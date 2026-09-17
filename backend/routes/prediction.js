/**
 * PREDICTION ROUTES
 * Handles CT scan upload and real AI prediction via Google Gemini Vision.
 *
 * Uses FREE Google Gemini 1.5 Flash API:
 *   - 15 req/min, 1,500 req/day, 1M tokens/month — no credit card required
 *   - Get API key: https://aistudio.google.com/app/apikey */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { analyzeCTScan } = require('../utils/geminiAI');

const router = express.Router();


// FILE UPLOAD CONFIGURATION
 
/**
 * Disk storage configuration for Multer.
 * Ensures the uploads directory exists and creates unique timestamped filenames.
 */
const storage = multer.diskStorage({
  /**
   * Defines the target folder on disk where files should be stored.
   * @param {import('express').Request} req - Express request
   * @param {Express.Multer.File} file - Uploaded file metadata
   * @param {Function} cb - Multer callback(err, destinationPath)
   */
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  /**
   * Generates a safe, non-colliding filename for the uploaded scan.
   * @param {import('express').Request} req - Express request
   * @param {Express.Multer.File} file - Uploaded file metadata
   * @param {Function} cb - Multer callback(err, generatedFilename)
   */
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `ct-scan-${uniqueSuffix}${ext}`);
  },
});

/**
 * File filter validator to restrict uploads to supported medical image formats (PNG, JPG, JPEG).
 *
 * @param {import('express').Request} req - Express request
 * @param {Express.Multer.File} file - Uploaded file descriptor
 * @param {Function} cb - Multer callback(err, acceptFileBoolean)
 */
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PNG, JPG, and JPEG are allowed.'), false);
  }
};

/**
 * Multer middleware instance with file size and type boundaries.
 */
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});


// PREDICTION ENDPOINT (REAL AI)


/**
 * POST /api/predict
 * Uploads a chest CT scan slice, triggers Gemini Vision AI radiological analysis,
 * and returns structured clinical observations, malignancy risk, and Fleischner recommendations.
 *
 * @name predictCTScan
 * @function
 * @param {import('express').Request} req - Express request containing multipart file `image`
 * @param {import('express').Response} res - Express JSON response with prediction object
 * @returns {Promise<void>}
 */
router.post('/predict', upload.single('image'), async (req, res) => {
  let savedFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded',
        message: 'Please upload a CT scan image (PNG, JPG, or JPEG)',
      });
    }

    savedFilePath = req.file.path;
    console.log(`\n📤 CT scan uploaded: ${req.file.filename}`);
    console.log(`📊 File size: ${(req.file.size / 1024).toFixed(2)} KB`);

    // ==========================================
    // REAL AI ANALYSIS — Google Gemini Vision
    // ==========================================
    console.log('🧠 Starting Gemini Vision analysis...');
    const prediction = await analyzeCTScan(savedFilePath);

    console.log(`✅ Analysis complete: ${prediction.result} (${prediction.confidence}% confidence)`);

    res.json({
      success: true,
      prediction,
      imagePath: `/uploads/${req.file.filename}`,
      fileName: req.file.filename,
      uploadedAt: new Date().toISOString(),
      aiEngine: 'Google Gemini Vision',
    });

  } catch (error) {
    console.error('\n❌ Prediction error:', error.message);

    // Clean up uploaded file on error
    if (savedFilePath && fs.existsSync(savedFilePath)) {
      try { fs.unlinkSync(savedFilePath); } catch (_) { }
    }

    // User-friendly error based on error type
    let userMessage = 'Analysis failed. Please try again.';
    let statusCode = 500;

    if (error.message.includes('GEMINI_API_KEY') || error.message.includes('not configured')) {
      statusCode = 503;
      userMessage = 'AI service not configured. Please add your GEMINI_API_KEY to backend/.env. Get a FREE key at https://aistudio.google.com/app/apikey';
    } else if (error.message.includes('All Gemini models quota-exceeded') || error.message.includes('all models')) {
      statusCode = 429;
      userMessage = 'Rate limit reached on all AI models. Please wait 60 seconds and try again. (Free tier: 15 requests/minute)';
    } else if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('Too Many')) {
      statusCode = 429;
      userMessage = 'AI rate limit reached. Please wait 60 seconds and try again. (Free tier: 15 requests/minute)';
    } else if (error.message.includes('API_KEY_INVALID') || error.message.includes('invalid')) {
      statusCode = 401;
      userMessage = 'Invalid Gemini API key. Please check GEMINI_API_KEY in backend/.env. Get a valid key at https://aistudio.google.com/app/apikey';
    }

    res.status(statusCode).json({
      success: false,
      error: 'AI Analysis Failed',
      message: userMessage,
    });
  }
});


// PREDICTION HISTORY


/**
 * GET /api/predictions
 * Retrieves the historical log of uploaded scans stored on disk,
 * sorted newest-first with timestamps and sizes.
 *
 * @name getPredictionsHistory
 * @function
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response with list of scan records
 * @returns {void}
 */
router.get('/predictions', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');

    if (!fs.existsSync(uploadsDir)) {
      return res.json({ success: true, predictions: [], message: 'No predictions yet' });
    }

    const files = fs
      .readdirSync(uploadsDir)
      .filter(f => f !== '.gitkeep' && /\.(png|jpg|jpeg)$/i.test(f))
      .map(file => {
        const stats = fs.statSync(path.join(uploadsDir, file));
        return {
          fileName: file,
          imagePath: `/uploads/${file}`,
          uploadedAt: stats.birthtime,
          size: stats.size,
        };
      })
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.json({ success: true, predictions: files, count: files.length });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch predictions' });
  }
});


// MULTER ERROR HANDLING


/**
 * Dedicated error-handling middleware for Multer file upload exceptions.
 * Converts Multer-specific error codes (e.g., LIMIT_FILE_SIZE) into friendly 400 Bad Request responses.
 *
 * @name multerErrorHandler
 * @function
 * @param {Error} error - Upload exception
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware function
 * @returns {void}
 */
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'Maximum file size is 10MB',
      });
    }
    return res.status(400).json({ success: false, error: 'Upload error', message: error.message });
  }

  if (error) {
    return res.status(400).json({ success: false, error: 'Upload error', message: error.message });
  }

  next(error);
});

module.exports = router;
