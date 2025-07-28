
const express = require('express');
const router = express.Router();

router.get('/healthz', (req, res) => {
  const version = process.env.APP_VERSION || 'dev';
  res.status(200).json({
    status: 'ok',
    version,
    uptime: process.uptime()
  });
});

module.exports = router;
