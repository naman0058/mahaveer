const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('license'); // render license.ejs
});

router.post('/', async (req, res) => {
  const key = req.body.key.trim();

  try {
    const response = await axios.post('https://filemakr.com/api/verify/license', { key });

    if (response.data.valid) {
      fs.writeFileSync(path.join(process.cwd(), 'license.key'), key);
      return res.render('license', { message: '✅ License Activated! Please restart the app.' });
    } else {
      return res.render('license', { message: '❌ Invalid or expired license key.' });
    }
  } catch (err) {
    return res.render('license', { message: '❌ License validation failed. Check internet connection.' });
  }
});

module.exports = router;
