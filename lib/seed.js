const fs = require('fs');
const path = require('path');
const db = require('./db');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'content.json'), 'utf8'));

function seed({ reset = false } = {}) {
  if (reset) {
    // Content only. Users and enquiries are never touched.
    for (const t of ['services', 'gallery', 'testimonials', 'faqs', 'menu_items', 'packages']) db.exec(`DELETE FROM ${t}`);
  }
  const has = db.prepare('SELECT COUNT(*) AS n FROM services').get().n;
  if (has > 0) return false;

  const run = (sql, rows, map) => {
    const st = db.prepare(sql);
    rows.forEach((r, i) => st.run(...map(r, i)));
  };
  db.exec('BEGIN');
  try {
    run('INSERT INTO services (title,summary,features,image,cta_label,link,sort) VALUES (?,?,?,?,?,?,?)', data.services,
      (r, i) => [r.title, r.summary, r.features, r.image, r.cta_label, r.link, i]);
    run('INSERT INTO gallery (title,caption,category,image,sort) VALUES (?,?,?,?,?)', data.gallery,
      (r, i) => [r.title, r.caption, r.category, r.image, i]);
    run('INSERT INTO testimonials (name,event,quote,sort) VALUES (?,?,?,?)', data.testimonials,
      (r, i) => [r.name, r.event, r.quote, i]);
    run('INSERT INTO faqs (question,answer,sort) VALUES (?,?,?)', data.faqs, (r, i) => [r.question, r.answer, i]);
    run('INSERT INTO packages (name,tagline,price_per_guest,min_guests,includes,is_featured,sort) VALUES (?,?,?,?,?,?,?)', data.packages,
      (r, i) => [r.name, r.tagline, r.price_per_guest, r.min_guests, r.includes, r.is_featured, i]);
    run('INSERT INTO menu_items (category,name,description,is_vegetarian,sort) VALUES (?,?,?,?,?)', data.menu,
      (r, i) => [r.category, r.name, r.description, r.is_vegetarian, i]);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  return true;
}

module.exports = seed;
