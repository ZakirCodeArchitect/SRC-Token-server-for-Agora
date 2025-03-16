const express = require('express');
require('dotenv').config();
const { RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole } = require('agora-access-token');
const { body, validationResult } = require('express-validator');

const app = express();
const port = 3000;

const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;
const API_SECRET_KEY = process.env.API_SECRET_KEY;

app.use(express.json());

// Middleware for API key authentication
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader !== API_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Root route
app.get('/', async (req, res) => {
  res.status(200).send('This is my express app');
});

// RTC Token generation endpoint
app.get('/token-rtc', authenticate, async (req, res) => {
  const { channelName, uid, role } = req.query;

  if (!channelName || !uid || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

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

// RTM Token generation endpoint
app.get('/token-rtm', authenticate, async (req, res) => {
  const { account, role } = req.query;

  if (!account || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const expireTime = 36000; // 10 hours
  const currentTime = Math.floor(Date.now() / 1000);
  const privilagedExpireTime = currentTime + expireTime;

  const token = RtmTokenBuilder.buildToken(
    APP_ID,
    APP_CERTIFICATE,
    account,
    role === 'host' ? RtmRole.PUBLISHER : RtmRole.SUBSCRIBER,
    privilagedExpireTime
  );

  res.status(200).json({ token });
});

// Start the server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});