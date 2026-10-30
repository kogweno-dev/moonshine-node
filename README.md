# Moonshine Events (Node.js)

Express + Nunjucks + SQLite (Node's built-in `node:sqlite`). Requires **Node 22.13 or newer**.

## Run on your computer
```bash
npm install
npm run create-admin -- yourname you@example.com YourStrongPassword
npm start            # http://localhost:3000
```
Starter content (services, gallery, packages, menu, FAQs) loads automatically on first start.

## Pages
- `/` home, `/catering/` catering, `/signup/`, `/login/`
- `/dashboard/` customers see their own enquiries; staff see all enquiries and can change status.

## Edit your content
- Phone, email, address: `lib/config.js` (`biz`).
- Services, packages, prices, menu, FAQs, gallery: `data/content.json`, then run `npm run reseed`
  (this reloads content only. Users and enquiries are never deleted).

## Deploy (cPanel Node.js app, or any Node host)
- Application root: the folder containing `package.json`. Startup command: `node server.js`.
- Environment variables: `NODE_ENV=production`, `SESSION_SECRET=<long random string>`.
- Run `npm install` once, then `npm run create-admin -- ...` in the terminal.
- The database is the file `data/moonshine.db`. Back it up. It is excluded from Git.
