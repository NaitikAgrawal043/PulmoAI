# -------------------------------
# Imports
# -------------------------------
import os
from dotenv import load_dotenv

load_dotenv()
from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import FastEmbedEmbeddings

from langchain_pinecone import PineconeVectorStore
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_openai import ChatOpenAI

from pinecone import Pinecone
from pinecone import ServerlessSpec


# -------------------------------
# 1. Load PDF Files
# -------------------------------
def load_pdf_files(data_path):
    """
    Recursively discovers and loads all PDF files in the target directory using PyPDFLoader.

    Args:
        data_path (str): Relative or absolute path to the directory containing PDFs.

    Returns:
        list[langchain_core.documents.Document]: Array of Document objects, one per extracted PDF page.
    """
    loader = DirectoryLoader(
        data_path,
        glob="*.pdf",
        loader_cls=PyPDFLoader
    )
    documents = loader.load()
    return documents


# -------------------------------
# 2. Split Documents (improved chunking)
# -------------------------------
def text_split(documents):
    """
    Splits long PDF documents into overlapping text chunks optimized for dense retrieval.
    Default chunking: 1000 characters with 200 character overlap to preserve semantic context.

    Args:
        documents (list[langchain_core.documents.Document]): Raw document pages to divide.

    Returns:
        list[langchain_core.documents.Document]: Processed text chunks ready for vector embedding.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )
    texts = text_splitter.split_documents(documents)
    return texts


# -------------------------------
# 3. Download Embeddings
# -------------------------------
def download_embeddings():
    """
    Initializes a lightweight local ONNX embedding model (BAAI/bge-small-en-v1.5).
    Produces 384-dimensional dense vector embeddings with low memory footprint (~67MB).

    Returns:
        FastEmbedEmbeddings: Initialized LangChain-compatible embedding generator.
    """
    # FastEmbed uses a lightweight ONNX runtime (~67MB model, no PyTorch).
    # Works efficiently within 512MB RAM constraints.
    embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")
    return embeddings


# -------------------------------
# 4. Setup Pinecone
# -------------------------------
def setup_pinecone(index_name, embedding):
    """
    Initializes a connection to Pinecone Vector Database.
    Creates a serverless cosine-similarity index if it does not already exist,
    and returns a LangChain PineconeVectorStore wrapper.

    Args:
        index_name (str): The name of the Pinecone vector index (e.g. 'medical-chatbot').
        embedding (Embeddings): Initialized LangChain embeddings instance.

    Returns:
        PineconeVectorStore: Connected vector store ready for similarity queries.
    """
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

    if index_name not in [idx.name for idx in pc.list_indexes()]:
        pc.create_index(
            name=index_name,
            dimension=384,
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )

    vector_store = PineconeVectorStore.from_existing_index(
        index_name=index_name,
        embedding=embedding
    )

    return vector_store


# -------------------------------
# 5. Load LLM (Groq Cloud)
# -------------------------------
def load_llm():
    """
    Initializes the ChatOpenAI client pointed to Groq's high-speed inference endpoint.
    Uses LLaMA-based compound models with low temperature (0.4) for clinical accuracy.

    Returns:
        ChatOpenAI: Configured LLM runner for RAG generation.
    """
    api_key = os.getenv("GROQ_API_KEY")
    llm = ChatOpenAI(
        model="groq/compound-mini",
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1",
        temperature=0.4,
        max_tokens=512,
        max_retries=1,
    )
    return llm

# -------------------------------
# 6. Create RAG Chain (specialized for CT / pulmonary nodules)
# -------------------------------

def create_rag_chain(vector_store, llm):
    """
    Constructs an end-to-end conversational Retrieval-Augmented Generation (RAG) runnable pipeline.
    
    Architecture:
      - Uses Maximal Marginal Relevance (MMR) retrieval to optimize diversity and relevance (k=4, fetch_k=8).
      - Truncates retrieved chunks to 1200 characters to safeguard against payload limits.
      - Formats multi-turn chat history and clinical context into a unified PromptTemplate.
      - Returns a RunnableLambda that outputs {"answer": str, "context": list[Document]}.

    Args:
        vector_store (PineconeVectorStore): Populated vector index.
        llm (ChatOpenAI): Initialized Groq LLM client.

    Returns:
        RunnableLambda: Executable LangChain runnable callable with {"input": str, "chat_history": str}.
    """
    # MMR retriever: balances relevance + diversity across retrieved chunks
    retriever = vector_store.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": 4,
            "fetch_k": 8,
            "lambda_mult": 0.7,
        }
    )

    # Truncate each retrieved chunk to avoid HTTP 413
    MAX_CHARS_PER_CHUNK = 1200

    def format_docs(docs):
        """
        Formats retrieved LangChain documents into a single consolidated string,
        truncating each individual chunk to MAX_CHARS_PER_CHUNK.

        Args:
            docs (list[langchain_core.documents.Document]): Retrieved documents.

        Returns:
            str: Combined context string with chunk breaks.
        """
        parts = []
        for doc in docs:
            content = doc.page_content
            if len(content) > MAX_CHARS_PER_CHUNK:
                content = content[:MAX_CHARS_PER_CHUNK] + "..."
            parts.append(content)
        return "\n\n".join(parts)

    template = """You are a friendly, knowledgeable medical AI assistant. Your knowledge comes from comprehensive medical literature, textbooks, and developer/creator documentation.

BEHAVIOR RULES:

1. **Casual greetings** ("hi", "hello", "how are you", etc.): Respond naturally and briefly like a friendly assistant. Example: "Hello! How can I help you today? Feel free to ask me any health or medical questions."
2. **Medical questions**: Use the retrieved context first; supplement with general medical knowledge if needed.
3. **Creator / Developer / Profile questions** ("Who is Naitik Agrawal?", "Who created/made this?", "Tell me about Naitik Agrawal", etc.): Answer directly, accurately, and politely using the context provided below.
4. **General & Context-based questions**: Always use the retrieved context below to answer questions before deciding if something is out of scope.
5. **Completely unrelated non-medical topics** (not in context and not about the project/creator): Politely steer back toward health topics in one short sentence.
6. Keep responses concise, well-structured, and easy to understand. Do NOT show your reasoning or thinking steps.
7. For medical diagnostic or clinical advice only: add a brief disclaimer that responses are informational and not a substitute for professional advice.
8. **Follow-up questions**: If the user refers to something mentioned earlier, use the conversation history below to understand what they mean.

Previous conversation:
{chat_history}

Context:
{context}

User:
{input}

Assistant:"""

    prompt = PromptTemplate(
        template=template,
        input_variables=["context", "input", "chat_history"]
    )

    # Build a manual chain that correctly passes ALL three keys to the prompt.
    # create_retrieval_chain only forwards {input} and {context}, dropping
    # {chat_history} — which causes a KeyError in the PromptTemplate.
    def run_rag(inputs: dict) -> dict:
        query = inputs["input"]
        chat_history = inputs.get("chat_history", "")

        # Retrieve relevant docs
        docs = retriever.invoke(query)
        context_str = format_docs(docs)

        # Build and invoke the prompt → LLM
        filled_prompt = prompt.format(
            input=query,
            context=context_str,
            chat_history=chat_history
        )
        result = llm.invoke(filled_prompt)

        # result is an AIMessage; extract text
        answer = result.content if hasattr(result, "content") else str(result)
        return {"answer": answer, "context": docs}

    return RunnableLambda(run_rag)
