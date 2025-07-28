// app.js
module.exports = function ({ viewsPath, publicPath }) {
  const express = require('express');
  const path = require('path'); // Still needed for path.join
  const fs = require('fs');
  const cookieSession = require('cookie-session');
  const cookieParser = require('cookie-parser');
  const logger = require('morgan');
  const createError = require('http-errors');
  const axios = require('axios');
  const cron = require('node-cron');

  const app = express();

  const indexRouter = require('./routes/index');
  const usersRouter = require('./routes/users');
  const licenseRoute = require('./routes/license');

  let isLicenseValid = false;
  // If license.key is *not* embedded, it must be present next to the .exe
  // In this case, process.cwd() is fine for an external file.
  const licensePath = path.join(process.cwd(), 'license.key');
  let licenseKey = '';

  async function verifyLicenseFile() {
    try {
      licenseKey = fs.readFileSync(licensePath, 'utf-8').trim();
      const res = await axios.post('https://filemakr.com/api/verify/license', { key: licenseKey });
      isLicenseValid = res.data.valid;
      console.log(isLicenseValid ? '✅ License verified' : '❌ License invalid');
    } catch (err) {
      console.log('❌ License check failed');
      isLicenseValid = false;
    }
  }

  verifyLicenseFile(); // Uncomment when ready
  // cron.schedule('0 0 * * *', verifyLicenseFile); // Uncomment when ready
 cron.schedule('0 */12 * * *', verifyLicenseFile);

  // Middlewares
  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());


  const ejs = require('ejs');
  const { readEmbeddedFile } = require('./utils/fileHelper');

  app.get('/debug-view', (req, res) => {
    try {
      // viewsPath already points to the correct embedded 'views' directory
      const templatePath = path.join(viewsPath, 'error.ejs');
      const template = readEmbeddedFile(templatePath);
      const html = ejs.render(template, { message: 'Test', error: {} });
      res.send(html);
    } catch (e) {
      res.send('❌ Failed: ' + e.message);
    }
  });

  // Monkey-patch res.render BEFORE routes
  app.use((req, res, next) => {
    res.render = function (view, options = {}, callback) {
      try {
        // viewsPath already points to the correct embedded 'views' directory
        const templatePath = path.join(viewsPath, `${view}.ejs`);
        const template = readEmbeddedFile(templatePath);
        const html = ejs.render(template, { ...res.locals, ...options, filename: templatePath });
        if (callback) return callback(null, html);
        res.send(html);
      } catch (err) {
        if (callback) return callback(err);
        next(err);
      }
    };
    next();
  });

  app.use((req, res, next) => {
    if (!isLicenseValid && req.path !== '/license') {
      return res.redirect('/license');
    }
    next();
  });

  // This is correct as publicPath is handled by server.js
  app.use(express.static(publicPath));
  app.use(cookieSession({
    name: 'session',
    keys: ['secret-key'],
    maxAge: 24 * 60 * 60 * 1000,
  }));

  // Routes
  app.use('/', indexRouter);
  app.use('/users', usersRouter);
  app.use('/license', licenseRoute);

  // 404 handler
  app.use((req, res, next) => next(createError(404)));

  // Error handler (render via monkey-patched res.render)
  app.use((err, req, res, next) => {
    res.status(err.status || 500).render('error', {
      message: err.message,
      error: req.app.get('env') === 'development' ? err : {}
    });
  });

  return app;
};