// Usage: npm run create-admin -- <username> <email> <password>
const bcrypt = require('bcryptjs');
const db = require('../lib/db');

const [username, email, password] = process.argv.slice(2);
if (!username || !email || !password || password.length < 8) {
  console.error('Usage: npm run create-admin -- <username> <email> <password (8+ characters)>');
  process.exit(1);
}
const hash = bcrypt.hashSync(password, 10);
const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
if (existing) {
  db.prepare('UPDATE users SET password_hash = ?, email = ?, is_staff = 1 WHERE id = ?').run(hash, email, existing.id);
  console.log(`Updated staff account "${username}".`);
} else {
  db.prepare('INSERT INTO users (username, email, password_hash, is_staff) VALUES (?,?,?,1)').run(username, email, hash);
  console.log(`Created staff account "${username}".`);
}
