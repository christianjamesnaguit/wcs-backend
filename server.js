const express = require('express');
const cors = require('cors');
const path = require('path');
const serv = process.env.PORT || 3000;
const frontendPath = process.env.FRONTEND_PATH || path.join(__dirname, '..', 'frontend', 'dist');

// Import database connection
require('./config/database');

const app = express();

// CORS configuration - allow requests from Netlify in production
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.NETLIFY_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(frontendPath));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/avatars', express.static(path.join(__dirname, 'avatars')));

// Routes
app.get('/', (req, res) => {
  console.log('GET / - Serving index.html from:', frontendPath);
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/api/status', (req, res) => {
  console.log('GET /api/status - Status check');
  res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});

// Mount route modules
app.use('/api/folders', require('./routes/folders'));
app.use('/api/events', require('./routes/events'));
app.use('/api/files', require('./routes/files'));
app.use('/api/user', require('./routes/user'));
app.use('/api', require('./routes/auth')); // For /api/signup and /api/login

// Handle React Router routes - serve index.html for any unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// host
app.listen(serv, () => {
  console.log(`Server running on http://localhost:${serv}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend path: ${frontendPath}`);
});
