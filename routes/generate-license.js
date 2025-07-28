const fs = require('fs');
const crypto = require('crypto');

const key = '1234-5678-ABCD';
const machineId = 'PC001';
const validTill = '2027-12-31';

const hash = crypto.createHash('sha256').update(key + machineId).digest('hex');

const license = {
  key,
  machineId,
  validTill,
  hash
};

fs.writeFileSync('../../license/license.json', JSON.stringify(license, null, 2));
console.log('✅ license.json generated.');