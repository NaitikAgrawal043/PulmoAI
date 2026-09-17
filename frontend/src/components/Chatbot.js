/**
 * MEDPULSE AI - RAG CHATBOT COMPONENT
 * Unified medical assistant with Compressible & Expandable modes.
 * Ported directly from the port 5000 UI into the main application.
 */

import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/api';
import '../styles/MedPulseChat.css';

const DEFAULT_PROMPTS = [
  {
    title: 'Diabetes Symptoms',
    query: 'What are the common symptoms of diabetes mellitus?',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    )
  },
  {
    title: 'Hypertension Treatment',
    query: 'Explain the treatment options for hypertension',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.5 20.5 19 12a4.95 4.95 0 1 0-7-7L3.5 13.5a4.95 4.95 0 1 0 7 7Z" />
        <path d="m8.5 8.5 7 7" />
      </svg>
    )
  },
  {
    title: 'Chest Pain Diagnosis',
    query: 'What is the differential diagnosis for acute chest pain?',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    )
  },
  {
    title: 'Pulmonary Nodules',
    query: 'What causes pulmonary nodules and how are they evaluated on CT scans?',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    )
  }
];

/**
 * MEDPULSE AI - RAG CHATBOT COMPONENT
 * Renders the clinical conversational interface with dual display modes:
 *  - Floating compressed window (ideal for quick questions while viewing CT scans)
 *  - Full-screen expanded studio view with session sidebar, history search, and multi-turn threads
 *
 * @component
 * @param {Object} props
 * @param {Object} [props.analysisResult] - Optional current CT scan prediction context
 * @returns {JSX.Element}
 */
const Chatbot = ({ analysisResult }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Load saved chats from localStorage
  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem('medpulse_chats');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiEngine, setAiEngine] = useState('python-medical-rag');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize a default chat if empty
  useEffect(() => {
    if (chats.length > 0 && !activeChatId) {
      const latest = chats[0];
      setActiveChatId(latest.id);
      setMessages(latest.messages || []);
    } else if (chats.length === 0 && !activeChatId) {
      handleNewChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save chats to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('medpulse_chats', JSON.stringify(chats));
    } catch (e) {
      console.warn('Could not save chats to localStorage:', e);
    }
  }, [chats]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isExpanded]);

  /**
   * Initializes a new clinical consultation thread with a welcome prompt.
   */
  const handleNewChat = () => {
    const newId = Date.now().toString();
    const initialMsg = {
      role: 'bot',
      content: "Hello! I'm your MedPulse Medical AI Assistant powered by Pinecone RAG & Groq. Ask me anything about diseases, symptoms, treatments, medications, or CT scan findings!",
      timestamp: new Date().toISOString()
    };
    const newChat = {
      id: newId,
      title: 'New Consultation',
      date: new Date().toLocaleDateString(),
      messages: [initialMsg]
    };

    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newId);
    setMessages([initialMsg]);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  /**
   * Switches active viewport to an existing consultation session from sidebar history.
   *
   * @param {{ id: string, title: string, messages: Array }} chat - Session object
   */
  const handleSelectChat = (chat) => {
    setActiveChatId(chat.id);
    setMessages(chat.messages || []);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  /**
   * Permanently deletes a consultation session from history and localStorage.
   *
   * @param {React.MouseEvent} e - Click event
   * @param {string} chatId - Unique ID of chat to delete
   */
  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation();
    const updated = chats.filter(c => c.id !== chatId);
    setChats(updated);
    if (activeChatId === chatId) {
      if (updated.length > 0) {
        setActiveChatId(updated[0].id);
        setMessages(updated[0].messages || []);
      } else {
        handleNewChat();
      }
    }
  };

  /**
   * Sends user query to the backend RAG pipeline, updates state with user and assistant turns,
   * dynamically updates thread title, and records the responding AI engine.
   *
   * @param {string | null} [textToSend=null] - Optional override text (e.g. from suggestion buttons)
   */
  const handleSendMessage = async (textToSend = null) => {
    const query = (textToSend !== null ? textToSend : inputMessage).trim();
    if (!query || isTyping) return;

    const userMsg = {
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setIsTyping(true);

    // Update chat title if it's the first user question
    const titleSnippet = query.length > 28 ? query.substring(0, 28) + '...' : query;

    try {
      const response = await sendChatMessage(query, newMessages);
      if (response.engine) setAiEngine(response.engine);

      const botReply = {
        role: 'bot',
        content: response.reply,
        timestamp: new Date().toISOString(),
        engine: response.engine
      };

      const finalMessages = [...newMessages, botReply];
      setMessages(finalMessages);
      setIsTyping(false);

      // Save into chats state
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            title: chat.title === 'New Consultation' ? titleSnippet : chat.title,
            messages: finalMessages
          };
        }
        return chat;
      }));

    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg = {
        role: 'bot',
        content: "I'm having trouble connecting to the medical AI service. Please make sure the backend is active.",
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
      setIsTyping(false);
    }
  };

  /**
   * Copies clinical message content to system clipboard with temporary visual feedback.
   *
   * @param {string} text - Message text to copy
   * @param {number} index - Index of message in active thread
   */
  const handleCopyText = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Filtered chats for search
  const filteredChats = chats.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.messages.some(m => m.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  /**
   * Parses markdown-like text elements (bullet points, headers, bold) into clean React DOM elements.
   *
   * @param {string} content - Raw message text with markdown styling
   * @returns {JSX.Element[]} Rendered DOM nodes
   */
  const renderFormattedContent = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const bulletText = trimmed.replace(/^[*•-]\s*/, '');
        return (
          <li key={idx} dangerouslySetInnerHTML={{ __html: formatBold(bulletText) }} />
        );
      }
      if (trimmed.startsWith('### ')) {
        return <h4 key={idx} style={{ margin: '10px 0 4px', fontSize: '1.05em' }}>{trimmed.replace('### ', '')}</h4>;
      }
      if (!trimmed) {
        return <div key={idx} style={{ height: '6px' }} />;
      }
      return (
        <p key={idx} dangerouslySetInnerHTML={{ __html: formatBold(trimmed) }} />
      );
    });
  };

  /**
   * Replaces markdown bold (**text**) and italic (*text*) syntax with semantic HTML tags.
   *
   * @param {string} str - Raw string
   * @returns {string} HTML string with strong and em tags
   */
  const formatBold = (str) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  return (
    <>
      {/* Floating launcher button */}
      <button
        className={`medpulse-launcher ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open Medical AI Assistant"
        title="MedPulse AI Assistant"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        )}
      </button>

      {/* Backdrop for Expanded Mode */}
      {isOpen && isExpanded && (
        <div className="medpulse-backdrop" onClick={() => setIsExpanded(false)} />
      )}

      {/* Main Chatbot Modal Window */}
      {isOpen && (
        <div className={`medpulse-modal ${isExpanded ? 'expanded' : 'compressed'}`}>
          {/* SIDEBAR (Rendered in Expanded mode) */}
          <aside className="medpulse-sidebar">
            <div className="sidebar-header">
              <div className="mp-logo">
                <div className="mp-logo-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <span className="mp-logo-text">MedPulse AI</span>
              </div>
            </div>

            <button className="btn-sidebar-new" onClick={handleNewChat}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Chat
            </button>

            <div className="sidebar-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <nav className="sidebar-history">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`history-item ${chat.id === activeChatId ? 'active' : ''}`}
                  onClick={() => handleSelectChat(chat)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="history-item-text">{chat.title}</span>
                  <span
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    style={{ opacity: 0.5, cursor: 'pointer', padding: '2px 4px' }}
                    title="Delete Chat"
                  >
                    ×
                  </span>
                </div>
              ))}
            </nav>

            <div className="sidebar-footer">
              <div className="user-profile-row">
                <div className="user-avatar-mini">M</div>
                <div className="user-info-text">
                  <span className="user-name-label">Medical User</span>
                  <span className="user-status-label">● Online</span>
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN CHAT CONTENT AREA */}
          <main className="medpulse-main">
            {/* Header */}
            <header className="medpulse-header">
              <div className="header-brand">
                <div className="header-brand-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <div className="header-brand-info">
                  <h3 className="header-brand-title">MedPulse Assistant</h3>
                  <p className="header-brand-sub">Grounded in Medical Literature</p>
                </div>
              </div>

              <div className="header-controls">
                <div className="mp-model-badge" title={aiEngine === 'python-medical-rag' ? 'Pinecone RAG + Groq LLaMA 3' : 'Medical Literature RAG'}>
                  <span className="mp-status-dot"></span>
                  <span className="badge-text-full">{aiEngine === 'python-medical-rag' ? 'Pinecone RAG + Groq' : 'Medical Literature RAG'}</span>
                  <span className="badge-text-short">{aiEngine === 'python-medical-rag' ? 'Pinecone RAG' : 'Medical RAG'}</span>
                </div>

                {/* New Chat Button (available in compressed mode too) */}
                <button
                  className="btn-header-action"
                  onClick={handleNewChat}
                  title="Start New Chat"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>

                {/* EXPAND / COMPRESS BUTTON */}
                <button
                  className="btn-header-action"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Compress to Window' : 'Expand to Full Screen'}
                  aria-label={isExpanded ? 'Compress' : 'Expand'}
                >
                  {isExpanded ? (
                    /* Compress icon */
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="4 14 10 14 10 20" />
                      <polyline points="20 10 14 10 14 4" />
                      <line x1="14" y1="10" x2="21" y2="3" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  ) : (
                    /* Expand icon */
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  )}
                </button>

                {/* Close Button */}
                <button
                  className="btn-header-action btn-close"
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  aria-label="Close"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </header>

            {/* Chat Viewport */}
            <div className="medpulse-viewport">
              {/* Empty / Welcome State */}
              {messages.length <= 1 && (
                <div className="mp-empty-state">
                  <div className="mp-empty-icon">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <h2>What can I help you with?</h2>
                  <p>Ask about diseases, symptoms, treatments, CT scan findings, or any health topic.</p>

                  <div className="mp-suggested-prompts">
                    {DEFAULT_PROMPTS.map((p, idx) => (
                      <button
                        key={idx}
                        className="btn-prompt-card"
                        onClick={() => handleSendMessage(p.query)}
                      >
                        {p.icon}
                        <span>{p.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message List */}
              <div className="mp-message-container">
                {messages.map((msg, index) => (
                  <div key={index} className={`mp-message-row mp-msg-row ${msg.role}`}>
                    <div className={`mp-msg-avatar ${msg.role === 'bot' ? 'mp-bot-avatar' : 'mp-user-avatar'}`}>
                      {msg.role === 'bot' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      )}
                    </div>

                    <div className="mp-msg-body">
                      <div className="mp-msg-bubble">
                        {renderFormattedContent(msg.content)}
                      </div>
                      <div className="mp-msg-footer">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {msg.role === 'bot' && (
                          <button
                            className="btn-copy-msg"
                            onClick={() => handleCopyText(msg.content, index)}
                          >
                            {copiedIndex === index ? '✓ Copied' : 'Copy'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="mp-message-row mp-msg-row bot">
                    <div className="mp-msg-avatar mp-bot-avatar">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                      </svg>
                    </div>
                    <div className="mp-typing">
                      <span className="mp-typing-dot"></span>
                      <span className="mp-typing-dot"></span>
                      <span className="mp-typing-dot"></span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Floating Input Area */}
            <footer className="medpulse-input-footer">
              <div className="mp-input-box">
                <textarea
                  ref={inputRef}
                  className="mp-textarea"
                  placeholder="Ask a medical or CT scan question…"
                  rows={1}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isTyping}
                />
                <button
                  className="btn-mp-send"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isTyping}
                  aria-label="Send Message"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              </div>
              <p className="mp-disclaimer">
                MedPulse AI provides clinical literature insights. Always consult a qualified physician for personalized diagnosis.
              </p>
            </footer>
          </main>
        </div>
      )}
    </>
  );
};

export default Chatbot;
