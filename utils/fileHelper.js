// utils/fileHelper.js
const fs = require('fs');
const path = require('path');

function readEmbeddedFile(absolutePathWithinPkg) {
  try {
    return fs.readFileSync(absolutePathWithinPkg, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read embedded file: ${absolutePathWithinPkg}. Original error: ${err.message}`);
  }
}


module.exports = { readEmbeddedFile };