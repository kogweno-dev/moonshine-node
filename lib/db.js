// Uses Node's built-in SQLite (Node 22.13+), so no native packages to compile.
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { dbPath } = require('./config');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_staff INTEGER NOT NULL DEFAULT 0,
  created TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, summary TEXT NOT NULL, features TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL, cta_label TEXT NOT NULL DEFAULT 'Get a quote', link TEXT NOT NULL DEFAULT '#contact', sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS gallery (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, caption TEXT NOT NULL DEFAULT '', category TEXT NOT NULL,
  image TEXT NOT NULL, sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, event TEXT NOT NULL, quote TEXT NOT NULL, sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, question TEXT NOT NULL, answer TEXT NOT NULL, sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, tagline TEXT NOT NULL, price_per_guest INTEGER NOT NULL,
  min_guests INTEGER NOT NULL DEFAULT 50, includes TEXT NOT NULL, is_featured INTEGER NOT NULL DEFAULT 0, sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT, category TEXT NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  is_vegetarian INTEGER NOT NULL DEFAULT 0, sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL, event_date TEXT, guests INTEGER, budget TEXT NOT NULL DEFAULT '', venue TEXT NOT NULL DEFAULT '',
  package_id INTEGER REFERENCES packages(id) ON DELETE SET NULL,
  message TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'new',
  created TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_enq_user ON enquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_enq_created ON enquiries(created);
`);

module.exports = db;
