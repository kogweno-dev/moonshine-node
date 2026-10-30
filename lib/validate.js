const { EVENT_TYPES, BUDGETS } = require('./constants');

const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateEnquiry(body, packageIds) {
  const values = {
    name: clean(body.name, 120),
    phone: clean(body.phone, 30),
    email: clean(body.email, 160),
    event_type: clean(body.event_type, 40),
    event_date: clean(body.event_date, 10),
    guests: clean(body.guests, 7),
    budget: clean(body.budget, 20),
    venue: clean(body.venue, 160),
    package_id: clean(body.package_id, 10),
    message: clean(body.message, 2000),
  };
  const errors = {};

  if (!values.name) errors.name = 'Please enter your name.';
  if (!values.phone) errors.phone = 'Please enter a phone number we can reach.';
  else if (!/^[+\d][\d\s()-]{6,}$/.test(values.phone)) errors.phone = 'That phone number does not look right.';
  if (values.email && !EMAIL.test(values.email)) errors.email = 'That email address does not look right.';
  if (!EVENT_TYPES.some(([k]) => k === values.event_type)) errors.event_type = 'Please choose an event type.';
  if (!BUDGETS.some(([k]) => k === values.budget)) values.budget = '';

  if (values.event_date) {
    const d = new Date(values.event_date + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.event_date) || Number.isNaN(d.getTime())) errors.event_date = 'Enter a valid date.';
    else if (d < today) errors.event_date = 'Please choose a date in the future.';
  }
  if (values.guests) {
    const n = Number(values.guests);
    if (!Number.isInteger(n) || n < 1 || n > 100000) errors.guests = 'Enter a whole number of guests.';
  }
  if (values.package_id && !packageIds.includes(Number(values.package_id))) values.package_id = '';

  return { values, errors, ok: Object.keys(errors).length === 0 };
}

function validateSignup(body, taken) {
  const values = { username: clean(body.username, 30), email: clean(body.email, 160) };
  const errors = {};
  const pw = String(body.password1 || '');
  if (!/^[A-Za-z0-9_.-]{3,30}$/.test(values.username)) errors.username = 'Use 3 to 30 letters, numbers, dots, dashes or underscores.';
  else if (taken(values.username)) errors.username = 'That username is already taken.';
  if (!EMAIL.test(values.email)) errors.email = 'Enter a valid email address.';
  if (pw.length < 8) errors.password1 = 'Use at least 8 characters.';
  else if (/^\d+$/.test(pw)) errors.password1 = 'Password cannot be only numbers.';
  else if (pw.toLowerCase() === values.username.toLowerCase()) errors.password1 = 'Password is too similar to your username.';
  if (!errors.password1 && pw !== String(body.password2 || '')) errors.password2 = 'The two passwords do not match.';
  return { values, errors, ok: Object.keys(errors).length === 0, password: pw };
}

module.exports = { validateEnquiry, validateSignup, clean };
