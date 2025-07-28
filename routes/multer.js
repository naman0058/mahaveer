const multer = require('multer');
const path = require('path');
const fs = require('fs');

const isPkg = typeof process.pkg !== 'undefined';

// Set storage destination based on mode
const uploadPath = isPkg
  ? path.join(process.cwd(), 'uploads') // Outside the pkg bundle
  : path.join(__dirname, 'public', 'images'); // Inside project during dev

// Ensure upload folder exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

module.exports = upload;
