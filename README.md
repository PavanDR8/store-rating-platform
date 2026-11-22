# Rollex - Store Rating Platform

A full-stack web app where normal users rate stores from 1 to 5, store owners see who rated their store, and an administrator manages everything.

**Stack:** React + Vite + Tailwind CSS (frontend), Node.js + Express (backend), PostgreSQL (database), JWT authentication, bcryptjs password hashing.

## Features

- One login page for three roles: **ADMIN**, **USER**, **STORE_OWNER**. After login each role is sent to its own dashboard.
- **Admin:** dashboard totals (users, stores, ratings), add users / admins / store owners, add stores (new owner is created together with the store in one database transaction), searchable + filterable + sortable users and stores tables, user details (store owners show their store's average rating).
- **Normal user:** sign up, browse stores, search by name or address, sort, see overall and own rating, submit or edit a rating (one rating per store, edits update the same row), change password.
- **Store owner:** see own store, average rating, total ratings, and a sortable list of users who rated it with date and time. An owner can never see another store.
- Validation on both frontend and backend, backend pagination / filtering / sorting, parameterized SQL, central error handling.

## Folder structure

```
rollex/
├── backend/
│   ├── database/
│   │   ├── schema.sql              # full schema (reference copy)
│   │   ├── migrations/             # SQL files applied by `npm run db:setup`
│   │   ├── seeds/seed.js           # creates the default admin
│   │   └── setup.js                # creates DB if missing, runs migrations, seeds admin
│   ├── src/
│   │   ├── config/                 # env + database pool
│   │   ├── controllers/            # auth, admin, user, owner logic + SQL
│   │   ├── middleware/             # JWT auth, role check, error handler
│   │   ├── routes/                 # all API routes
│   │   ├── validators/             # Zod schemas
│   │   ├── utils/                  # helpers (pagination, sorting whitelist, errors)
│   │   └── server.js
│   ├── tests/api.test.js           # end-to-end API tests
│   └── .env.example
├── frontend/
│   └── src/ api/ components/ context/ hooks/ layouts/ pages/{auth,admin,user,owner,common}/ routes/ utils/
├── docs/rollex.postman_collection.json
├── package.json                    # root scripts to run everything
└── README.md
```

## Prerequisites (install these first)

| Tool | Why | Notes |
|---|---|---|
| **Node.js 18 or newer (LTS)** | runs backend and frontend, includes npm | https://nodejs.org |
| **PostgreSQL 14+** | the database | https://www.postgresql.org/download/ - during install remember the password you set for user `postgres`, keep port `5432`. The installer also offers **pgAdmin 4**. |
| **pgAdmin 4** | optional, to look at the tables | installed together with PostgreSQL |
| **Git** | version control, push to GitHub | https://git-scm.com |
| **VS Code** | editor | https://code.visualstudio.com |
| **Postman** | optional, to try the API | https://www.postman.com/downloads |

Check versions in a terminal: `node -v`, `npm -v`, `git --version`, `psql --version`.
(If `psql` is not found on Windows, the database still works; the setup script does not need `psql`.)

## Installation

```bash
git clone <your-repo-url> rollex
cd rollex
npm run install:all
```

`install:all` installs the root, backend and frontend dependencies.

## Environment variables

```bash
# macOS / Linux
cp backend/.env.example backend/.env
# Windows (PowerShell)
Copy-Item backend/.env.example backend/.env
```

Open `backend/.env` and set at least:

- `DB_PASSWORD` - the password you chose when installing PostgreSQL
- `JWT_SECRET` - any long random string. Generate one:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

The default admin login comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in the same file
(default `admin@platform.com` / `Admin@12345`). Change them before any real deployment.
`.env` is in `.gitignore` and must never be committed.

## Database setup (migrations + admin seed)

Make sure PostgreSQL is running, then from the project root:

```bash
npm run db:setup
```

This one command (safe to run again):
1. creates the database `store_rating_platform` if it does not exist,
2. applies every SQL file in `backend/database/migrations/`,
3. creates the default admin from your `.env` (skipped if it already exists).

Separate commands: `npm run db:migrate` (tables only) and `npm run db:seed` (admin only).

To start over with an empty database, in pgAdmin right-click the database -> Delete, then run `npm run db:setup` again.

## Run the app

```bash
npm run dev          # backend (http://localhost:5000) + frontend (http://localhost:5173) together
```

Or in two terminals: `npm run start:backend` and `npm run start:frontend`.
Open **http://localhost:5173** and log in with the admin account.

## First-use walkthrough

1. Log in as admin -> **Stores -> Add store** -> choose "Create a new owner" -> save. The owner and store are created together.
2. Open `/signup` in a private window and create a normal user.
3. As the user, open **Stores**, rate the store, then edit the rating.
4. Log in as the store owner (the email and password you entered in step 1) to see the rating.

## API documentation

All responses look like `{ "success": true, "data": ..., "pagination": {...} }` or `{ "success": false, "message": "...", "errors": { "field": "..." } }`.
Protected routes need the header `Authorization: Bearer <token>` (token comes from login).

List endpoints accept `?search=&sortBy=&order=asc|desc&page=1&limit=10`. An unknown `sortBy` returns 400.

| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | public | create a normal user |
| POST | `/api/auth/login` | public | returns `{ token, user }` |
| PATCH | `/api/auth/update-password` | any logged-in | body `{ currentPassword, newPassword }` |
| GET | `/api/admin/dashboard` | ADMIN | totals of users, stores, ratings |
| POST | `/api/admin/users` | ADMIN | create USER / ADMIN / STORE_OWNER |
| POST | `/api/admin/stores` | ADMIN | body `{name,email,address, ownerId}` **or** `{..., owner:{name,email,password,address}}` |
| GET | `/api/admin/users` | ADMIN | `search`, `role`, sortBy: name,email,address,role,rating,created_at |
| GET | `/api/admin/users/:id` | ADMIN | details (+ store and average rating for owners) |
| GET | `/api/admin/stores` | ADMIN | sortBy: name,email,address,avg_rating,rating_count,created_at |
| GET | `/api/admin/owners` | ADMIN | owners without a store (used by the Add store form) |
| GET | `/api/user/stores` | USER | `search` matches name or address; sortBy: name,address,avg_rating,my_rating |
| POST | `/api/user/ratings` | USER | body `{ storeId, rating }` - PostgreSQL UPSERT, 201 on new, 200 on update |
| GET | `/api/owner/dashboard` | STORE_OWNER | own store, stats, ratings; sortBy: name,email,rating,date |

A ready Postman collection is in `docs/rollex.postman_collection.json` (Postman -> Import). Run **Login (admin)** first; it saves the token automatically.

## Testing

1. Start the backend (`npm run start:backend`) with the database set up.
2. In another terminal: `npm run test:api`

The test suite (Node's built-in test runner, no extra packages) covers signup, duplicate email, login, wrong password, JWT and role checks, admin store + owner creation, transaction rollback, search / filter / sort, one-rating-per-store with updates, owner access and password change. It creates its own uniquely named data, so it can run repeatedly.

Manual UI checklist: signup validation messages, login for all three roles and redirect, admin tables (search, role filter, header sorting, details modal), add user / add store, user rating and edit, owner dashboard sorting, mobile layout (resize the browser), logout confirmation.

## Troubleshooting

| Problem | Fix |
|---|---|
| `password authentication failed` / error code 28P01 | `DB_USER` / `DB_PASSWORD` in `backend/.env` do not match your PostgreSQL install. |
| `ECONNREFUSED 5432` | PostgreSQL is not running. Windows: Services -> postgresql-x64-XX -> Start. macOS: `brew services start postgresql`. |
| `JWT_SECRET is missing` | You did not create `backend/.env`. See Environment variables. |
| Admin login fails | Run `npm run db:setup` and use `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`. |
| Frontend shows "Cannot reach the server" | Backend is not running on port 5000. If you changed `PORT`, set `VITE_BACKEND_URL` in `frontend/.env`. |
| CORS error | `CLIENT_URL` in `backend/.env` must match the URL in the browser (default `http://localhost:5173`). |
| Port already in use | Change `PORT` in `backend/.env`, or close the other program. |
| `npm run dev` says concurrently not found | Run `npm run install:all` from the project root. |

## Design decisions and assumptions

- **Store name is 3-60 characters.** The 20-60 rule from the brief is applied to user names (including owners and admins). Store names that long are unusual; change `storeName` in `backend/src/validators/schemas.js` and `database/schema.sql` if you need 20-60.
- **One store per owner.** `stores.owner_id` is UNIQUE, so the owner dashboard always has exactly one store.
- **Public signup only creates normal users.** The role is ignored if sent in the request. There is no public admin registration.
- **The role is checked in the database on every request**, not only inside the token.
- **Passwords:** the 8-16 character rule (one uppercase, one special character) is enforced on signup, admin-created users and password change.
