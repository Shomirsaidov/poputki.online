const Database = require('better-sqlite3');
const db = new Database('server/poputki.db');

console.log('Users:');
const users = db.prepare('SELECT * FROM users LIMIT 5').all();
console.log(JSON.stringify(users, null, 2));

console.log('Schema info for users:');
const schema = db.prepare("PRAGMA table_info(users)").all();
console.log(JSON.stringify(schema, null, 2));
