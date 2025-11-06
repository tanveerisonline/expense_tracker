# Free Hosting Guide (Render + Vercel)

This app is a React (Vite) client and an Express/MongoDB API. Below are step‑by‑step instructions to deploy for free with minimal changes.

## What you’ll need

- A free MongoDB Atlas cluster and connection string (`MONGO_URI`).
- A GitHub account with this repo pushed.
- Two public URLs (client and server) from Render or Vercel.

## Required environment variables

Backend (Express):
- `MONGO_URI` — MongoDB Atlas connection string.
- `JWT_SECRET` — any long random string.
- `CLIENT_ORIGIN` — the full client URL (e.g., `https://yourapp.vercel.app`).
- `JWT_COOKIE_NAME` — optional, defaults to `token`.
- `CSRF_COOKIE_NAME` — optional, defaults to `_csrf`.
- `COOKIE_SAMESITE` — set to `none` when client and server are on different domains.
- `COOKIE_SECURE` — set to `true` in production (required when `sameSite=none`).

Frontend (Vite):
- `VITE_API_BASE_URL` — backend base URL ending with `/api` (e.g., `https://your-api.onrender.com/api`).

Notes:
- Cookies are used for auth. When client and server are on different domains, cookies must be issued with `SameSite=None; Secure`.
- These options are now configurable via `COOKIE_SAMESITE` and `COOKIE_SECURE` in the backend.

---

## Option A — Client on Vercel, API on Render (recommended)

### 1) Deploy the API to Render
1. Sign in at render.com and click “New +” → “Web Service”.
2. Connect your GitHub repo.
3. Select the `server` directory as the root.
4. Set:
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables:
   - `MONGO_URI=YOUR_ATLAS_URI`
   - `JWT_SECRET=YOUR_RANDOM_STRING`
   - `CLIENT_ORIGIN=https://yourapp.vercel.app` (replace after you deploy the client)
   - `COOKIE_SAMESITE=none`
   - `COOKIE_SECURE=true`
6. Create service → wait for it to finish. Copy the Render URL (e.g., `https://your-api.onrender.com`).

### 2) Deploy the client to Vercel
1. Sign in at vercel.com and import your repo.
2. In project settings, set “Root Directory” to `client`.
3. Framework preset: Vite (detected automatically).
4. Build Command: `npm run build`, Output Directory: `dist`.
5. Add environment variable:
   - `VITE_API_BASE_URL=https://your-api.onrender.com/api`
6. Deploy and copy the URL (e.g., `https://yourapp.vercel.app`).

### 3) Finalize CORS
1. Go back to Render → your API service → Environment → set `CLIENT_ORIGIN` to your Vercel URL and redeploy.
2. Test:
   - Open your Vercel URL, sign up/log in, add an expense, and export CSV/PDF.

### 4) Troubleshooting
- “Unauthorized” on protected routes: ensure `CLIENT_ORIGIN` matches exactly and `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true` are set.
- CSRF error: the app fetches `/api/csrf-token` first; verify your backend is reachable at `VITE_API_BASE_URL`.
- Mixed content: always use `https` for both client and server URLs.

---

## Option B — Client and API both on Render (simple)

You’ll create two services: a Static Site for the client and a Web Service for the API.

### 1) API (Web Service)
- Same as in Option A, step 1.

### 2) Client (Static Site)
1. New + → Static Site → connect repo.
2. Root Directory: `client`.
3. Build Command: `npm install && npm run build`.
4. Publish Directory: `dist`.
5. Add env var: `VITE_API_BASE_URL=https://your-api.onrender.com/api`.
6. Copy the static site URL, e.g., `https://your-client.onrender.com`.

### 3) CORS & cookies
- In the API service, set `CLIENT_ORIGIN=https://your-client.onrender.com`.
- Set `COOKIE_SAMESITE=none` and `COOKIE_SECURE=true`.

### 4) Test as in Option A.

---

## Local development remains unchanged
- Run backend: `cd server && npm install && npm start` (defaults to `http://localhost:5000`).
- Run client: `cd client && npm install && npm run dev` (proxies `/api` to port 5000).

---

## Code changes already included

- Backend cookies are now configurable:
  - `COOKIE_SAMESITE` and `COOKIE_SECURE` control auth and CSRF cookie behavior.
- Client reads `VITE_API_BASE_URL`:
  - API calls and export links use this base for production.

---

## Quick checklist

- [ ] MongoDB Atlas URI working (`MONGO_URI`).
- [ ] `JWT_SECRET` set.
- [ ] Backend `CLIENT_ORIGIN` equals your deployed client URL.
- [ ] `COOKIE_SAMESITE=none` and `COOKIE_SECURE=true` on backend when client and server are on different domains.
- [ ] Client `VITE_API_BASE_URL` points to your backend `/api`.
- [ ] App loads, login works, expenses and payments CRUD work, exports download.

---

## Optional: Custom domain
- Point a custom domain to Vercel for the client and update `CLIENT_ORIGIN` on the backend.
- If you also want a custom domain for the API, point DNS to Render and update `VITE_API_BASE_URL` accordingly.

---

## Common pitfalls
- Wrong `CLIENT_ORIGIN` string (missing `https` or trailing slash differences).
- Not redeploying after changing environment variables.
- Using `SameSite=Lax` with different domains → cookies won’t be sent.
- Trying to access `/api` relative path in production without setting `VITE_API_BASE_URL`.

Happy deploying!