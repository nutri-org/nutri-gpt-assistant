
const express = require('express');
const router = express.Router();

router.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    version: process.env.APP_VERSION,
    uptime: process.uptime()
  });
});

module.exports = router;
