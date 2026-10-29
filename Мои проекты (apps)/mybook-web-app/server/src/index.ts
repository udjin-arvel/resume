import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import storyRoutes from './routes/story.routes.js';
import notionRoutes from './routes/notion.routes.js';
import noteRoutes from './routes/note.routes.js';
import loreRoutes from './routes/lore.routes.js';
import compositionRoutes from './routes/composition.routes.js';
import reportRoutes from './routes/report.routes.js';
import mistakeRoutes from './routes/mistake.routes.js';
import commentRoutes from './routes/comment.routes.js';
import imageRoutes from './routes/image.routes.js';
import audioRoutes from './routes/audio.routes.js';
import fragmentRoutes from './routes/fragment.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { authenticateToken, requireModerator } from './middleware/auth.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== 'production';

// CORS configuration - MUST be before helmet
const allowedOrigins = isDev
  ? [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ]
  : ['https://thebook.arvelov.online'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || isDev) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(cookieParser());

// Security middleware - after CORS
app.use(helmet({
  crossOriginResourcePolicy: isDev ? false : { policy: 'same-origin' },
  crossOriginOpenerPolicy: isDev ? false : { policy: 'same-origin' },
}));

// Rate limiting (disabled in development)
if (!isDev) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.',
    },
  });
  app.use(limiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
const uploadsPath = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'TheBook API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/notions', notionRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/lore', loreRoutes);
app.use('/api/compositions', compositionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/mistakes', mistakeRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/fragments', fragmentRoutes);
app.use('/api/admin', authenticateToken, requireModerator, adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TheBook API server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app; 