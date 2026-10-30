const crypto = require('crypto');
const path = require('path');
const express = require('express');
const nunjucks = require('nunjucks');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

const config = require('./lib/config');
const db = require('./lib/db');
const seed = require('./lib/seed');
const K = require('./lib/constants');
const { validateEnquiry, validateSignup, clean } = require('./lib/validate');

seed();

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

// ---- templates
const env = nunjucks.configure(path.join(__dirname, 'views'), { express: app, autoescape: true, noCache: !config.production });
env.addFilter('money', (n) => Number(n).toLocaleString('en-KE'));
env.addFilter('dt', (s) => {
  if (!s) return '';
  const str = String(s);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(str) ? new Date(str + 'T12:00:00+03:00') : new Date(str.includes('T') ? str : str.replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Nairobi' });
});

// ---- middleware
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
  next();
});
app.use('/static', express.static(path.join(__dirname, 'public'), { maxAge: config.production ? '7d' : 0 }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));
app.use(cookieSession({
  name: 'ms_session', keys: [config.secret], maxAge: 14 * 24 * 3600 * 1000,
  httpOnly: true, sameSite: 'lax', secure: config.production,
}));

app.use((req, res, next) => {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  req.user = req.session.userId
    ? db.prepare('SELECT id, username, email, is_staff FROM users WHERE id = ?').get(req.session.userId) || null
    : null;
  res.locals.user = req.user;
  res.locals.csrfToken = req.session.csrf;
  res.locals.messages = req.session.flash || [];
  req.session.flash = null;
  res.locals.biz = config.biz;
  res.locals.whatsapp_url = `https://wa.me/${config.biz.whatsapp}?text=Hello%20Moonshine%20Events%2C%20I%20would%20like%20a%20quote%20for%20my%20event.`;
  res.locals.year = new Date().getFullYear();
  res.locals.event_types = K.EVENT_TYPES;
  res.locals.budgets = K.BUDGETS;
  res.locals.active = '';
  if (req.method === 'POST') {
    const sent = Buffer.from(String((req.body && req.body._csrf) || ''));
    const real = Buffer.from(req.session.csrf);
    if (sent.length !== real.length || !crypto.timingSafeEqual(sent, real)) {
      return res.status(403).render('error.html', { code: 403, message: 'Your session expired. Go back, refresh the page and try again.' });
    }
  }
  next();
});

const flash = (req, tags, text) => { (req.session.flash = req.session.flash || []).push({ tags, text }); };
const requireLogin = (req, res, next) => (req.user ? next() : res.redirect('/login/?next=' + encodeURIComponent(req.originalUrl)));
const safeNext = (n) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard/');

// ---- tiny in-memory rate limiter
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) { hits.set(key, arr); return true; }
  arr.push(now); hits.set(key, arr);
  return false;
}

// ---- data helpers
const packages = () => db.prepare('SELECT * FROM packages ORDER BY sort, id').all()
  .map((p) => { const list = p.includes.split('\n').map((s) => s.trim()).filter(Boolean); return { ...p, include_list: list, top_includes: list.slice(0, 4) }; });

function processEnquiry(req, res, backTo) {
  if (req.body.form_name !== 'enquiry') return { form: { values: {}, errors: {} } };
  if (req.body.website) { // honeypot: bots fill this in
    flash(req, 'success', 'Thank you. We have your enquiry and will reply the same working day.');
    res.redirect(backTo + '#contact');
    return { done: true };
  }
  if (limited('enq:' + req.ip, 8, 3600 * 1000)) {
    flash(req, 'error', 'You have sent several enquiries in a short time. Please call us on ' + config.biz.phone_1 + '.');
    res.redirect(backTo + '#contact');
    return { done: true };
  }
  const ids = db.prepare('SELECT id FROM packages').all().map((r) => r.id);
  const v = validateEnquiry(req.body, ids);
  if (!v.ok) {
    flash(req, 'error', 'Please fix the highlighted fields and send again.');
    return { form: { values: v.values, errors: v.errors, hasErrors: true } };
  }
  const x = v.values;
  db.prepare(`INSERT INTO enquiries (user_id,name,phone,email,event_type,event_date,guests,budget,venue,package_id,message)
              VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(req.user ? req.user.id : null, x.name, x.phone, x.email, x.event_type, x.event_date || null,
      x.guests ? Number(x.guests) : null, x.budget, x.venue, x.package_id ? Number(x.package_id) : null, x.message);
  flash(req, 'success', 'Thank you. We have your enquiry and will reply the same working day.');
  res.redirect(backTo + '#contact');
  return { done: true };
}

// ---- pages
function renderHome(req, res, form) {
  const q = req.query;
  if (!form.values || !Object.keys(form.values).length) {
    form = { values: { event_type: clean(q.event_type, 40), event_date: clean(q.event_date, 10), guests: clean(q.guests, 7) }, errors: {} };
  }
  res.render('home.html', {
    form,
    services: db.prepare('SELECT * FROM services ORDER BY sort, id').all(),
    gallery: db.prepare('SELECT * FROM gallery ORDER BY sort, id').all(),
    gallery_categories: K.GALLERY_CATEGORIES,
    testimonials: db.prepare('SELECT * FROM testimonials ORDER BY sort, id').all(),
    faqs: db.prepare('SELECT * FROM faqs ORDER BY sort, id').all(),
    packages: packages(),
  });
}
app.get('/', (req, res) => renderHome(req, res, { values: {}, errors: {} }));
app.post('/', (req, res) => { const r = processEnquiry(req, res, '/'); if (!r.done) renderHome(req, res, r.form); });

function renderCatering(req, res, form) {
  if (!form.values || !Object.keys(form.values).length) {
    form = { values: { event_type: 'catering', package_id: /^\d+$/.test(req.query.package || '') ? req.query.package : '' }, errors: {} };
  }
  const items = db.prepare('SELECT * FROM menu_items ORDER BY sort, id').all();
  const menu = K.MENU_CATEGORIES
    .map(([key, label]) => ({ key, label, items: items.filter((i) => i.category === key) }))
    .filter((g) => g.items.length);
  res.render('catering.html', {
    form, menu, packages: packages(), active: 'catering',
    gallery: db.prepare("SELECT * FROM gallery WHERE category = 'catering' ORDER BY sort, id").all(),
  });
}
app.get('/catering/', (req, res) => renderCatering(req, res, { values: {}, errors: {} }));
app.post('/catering/', (req, res) => { const r = processEnquiry(req, res, '/catering/'); if (!r.done) renderCatering(req, res, r.form); });

// ---- accounts
app.get('/signup/', (req, res) => (req.user ? res.redirect('/dashboard/') : res.render('signup.html', { form: { values: {}, errors: {} } })));
app.post('/signup/', (req, res) => {
  if (req.user) return res.redirect('/dashboard/');
  const taken = (u) => !!db.prepare('SELECT 1 FROM users WHERE username = ?').get(u);
  const v = validateSignup(req.body, taken);
  if (!v.ok) return res.render('signup.html', { form: { values: v.values, errors: v.errors } });
  const info = db.prepare('INSERT INTO users (username,email,password_hash) VALUES (?,?,?)')
    .run(v.values.username, v.values.email, bcrypt.hashSync(v.password, 10));
  req.session.userId = Number(info.lastInsertRowid);
  flash(req, 'success', 'Welcome to Moonshine Events. Your account is ready.');
  res.redirect('/dashboard/');
});

app.get('/login/', (req, res) => (req.user ? res.redirect('/dashboard/') : res.render('login.html', { next: safeNext(req.query.next), values: {} })));
app.post('/login/', (req, res) => {
  const next = safeNext(req.body.next);
  const username = clean(req.body.username, 30);
  if (limited('login:' + req.ip, 10, 15 * 60 * 1000)) {
    return res.status(429).render('login.html', { next, values: { username }, error: 'Too many attempts. Please wait 15 minutes and try again.' });
  }
  const u = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!u || !bcrypt.compareSync(String(req.body.password || ''), u.password_hash)) {
    return res.status(401).render('login.html', { next, values: { username }, error: 'Username or password is incorrect. Check both and try again.' });
  }
  req.session.userId = u.id;
  res.redirect(next);
});
app.post('/logout/', (req, res) => { req.session = null; res.redirect('/'); });

app.get('/dashboard/', requireLogin, (req, res) => {
  const sql = `SELECT e.*, p.name AS package_name FROM enquiries e LEFT JOIN packages p ON p.id = e.package_id`;
  const rows = req.user.is_staff
    ? db.prepare(sql + ' ORDER BY e.created DESC LIMIT 200').all()
    : db.prepare(sql + ' WHERE e.user_id = ? ORDER BY e.created DESC LIMIT 100').all(req.user.id);
  const enquiries = rows.map((e) => ({ ...e, event_label: K.label(K.EVENT_TYPES, e.event_type), status_label: K.label(K.STATUSES, e.status) }));
  let stats = null;
  if (req.user.is_staff) {
    const counts = Object.fromEntries(db.prepare('SELECT status, COUNT(*) AS n FROM enquiries GROUP BY status').all().map((r) => [r.status, r.n]));
    stats = K.STATUSES.map(([k, l]) => ({ label: l, n: counts[k] || 0 }));
  }
  res.render('dashboard.html', { enquiries, stats, statuses: K.STATUSES });
});
app.post('/dashboard/enquiries/:id/status/', requireLogin, (req, res) => {
  if (!req.user.is_staff) return res.status(403).render('error.html', { code: 403, message: 'Staff only.' });
  const status = String(req.body.status || '');
  if (K.STATUSES.some(([k]) => k === status)) {
    db.prepare('UPDATE enquiries SET status = ? WHERE id = ?').run(status, Number(req.params.id));
    flash(req, 'success', 'Status updated.');
  }
  res.redirect('/dashboard/');
});

// ---- errors
app.use((req, res) => res.status(404).render('error.html', { code: 404, message: 'We could not find that page.' }));
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(500).render('error.html', { code: 500, message: 'Something went wrong on our side. Please try again shortly.' });
});

app.listen(config.port, () => console.log(`Moonshine Events running on port ${config.port}`));
