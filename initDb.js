const fs = require('fs');
const path = require('path');
const db = require('./config/db');

async function initializeDb() {
  try {
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Executing init.sql...');
    await db.query(sql);
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    process.exit();
  }
}

initializeDb();
