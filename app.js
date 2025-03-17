const express = require('express');
require('dotenv').config();
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const { query, validationResult } = require('express-validator');
const winston = require('winston');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();
const port = 3000;

const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;
const API_SECRET_KEY = process.env.API_SECRET_KEY;

// Configure Winston for logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Log requests to a file
    new winston.transports.File({ filename: 'logs/requests.log', level: 'info' }),
    // Log errors to a separate file
    new winston.transports.File({ filename: 'logs/errors.log', level: 'error' }),
  ],
});

// Middleware to log requests
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    query: req.query,
    headers: req.headers,
  });
  next();
});

// Middleware
app.use(express.json());
app.use(cors()); // CORS support

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware for API key authentication
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader !== API_SECRET_KEY) {
    logger.error('Unauthorized request', { url: req.url, headers: req.headers });
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Root route
app.get('/', async (req, res) => {
  res.status(200).send('This is my express app');
});

// RTC Token generation endpoint
app.get('/token-rtc', authenticate, [
  // Validate query parameters
  query('channelName').notEmpty().isString(),
  query('uid').notEmpty().isNumeric(),
  query('role').notEmpty().isIn(['host', 'subscriber']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error('Validation failed', { errors: errors.array() });
    return res.status(400).json({ errors: errors.array() });
  }

  const { channelName, uid, role } = req.query;
  const expireTime = 36000; // 10 hours
  const currentTime = Math.floor(Date.now() / 1000);
  const privilagedExpireTime = currentTime + expireTime;

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role === 'host' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
    privilagedExpireTime
  );

  res.status(200).json({ token });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Internal server error', { error: err.stack });
  res.status(500).json({ error: 'Something went wrong!' });
}); 

// Export the app instance
module.exports = app;

// Start the server only if this file is run directly
if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Example app listening on port ${port}`);
  });
}