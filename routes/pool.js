const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');

function getDBConfig() {
  const isPkg = typeof process.pkg !== 'undefined';
  const configPath = isPkg
    ? path.join(path.dirname(process.execPath), 'config.json') // For packaged .exe
    : path.join(__dirname, '..', 'config.json');               // For development

  if (!fs.existsSync(configPath)) {
    throw new Error(`❌ config.json not found at ${configPath}`);
  }

  const raw = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(raw);
  return config.db;
}

const dbConfig = getDBConfig();

const pool = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  port: dbConfig.port,
  multipleStatements: dbConfig.multipleStatements || false,
});

module.exports = pool;
