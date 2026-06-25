# The Final Showdown 🐉 ⚔️

A cinematic pre-wedding sports rivalry registration platform.
**House Green (Maidhily)** vs **House Black (Hrithwik)** — only one house reigns supreme.

Built with: **Next.js 15 · MongoDB · Tailwind · shadcn/ui · Framer Motion**

---

## ✨ Features

- Cinematic dark hero with golden title, smoke effects, particles, glassmorphism
- Two rival houses with live confirmed / waiting-list counters
- Live "What game?" poll (Football / Cricket / Mixed)
- Approved suggestions carousel
- Multi-step registration flow with **interactive jersey number grid (1–99)** and **live jersey preview**
- Cinematic player-card reveal with confetti & share button
- Waiting-list auto-promotion when teams fill (11 slots each)
- Admin dashboard at `/admin`: stats, search/edit/delete/promote/demote registrations,
  approve suggestions, edit event settings, CSV export

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js 18+**
- **Yarn** (the project uses Yarn — do NOT use npm)
- **MongoDB** running locally OR a MongoDB Atlas connection string

### 2. Install
```bash
yarn install
```

### 3. Environment variables
Edit `.env` in the project root:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=final_showdown
NEXT_PUBLIC_BASE_URL=http://localhost:3000
CORS_ORIGINS=*
ADMIN_PASSWORD=showdown2025
```

Change `ADMIN_PASSWORD` to anything you like — it's the password for `/admin`.

### 4. Run dev server
```bash
yarn dev
```

Open: **http://localhost:3000**
Admin: **http://localhost:3000/admin** (default password: `showdown2025`)

### 5. Production build
```bash
yarn build
yarn start
```

---

## 🗂️ Project Structure

```
app/
├── api/[[...path]]/route.js   # All backend endpoints (REST API)
├── admin/page.js              # Admin dashboard
├── page.js                    # Main cinematic landing + registration flow
├── layout.js                  # Root layout
└── globals.css                # Cinematic styles, animations, gradients

components/ui/                 # shadcn/ui components
lib/
├── mongo.js                   # MongoDB connection + unique indexes
└── utils.js                   # Helpers
```

---

## 🔌 API Endpoints

### Public
| Method | Path                          | Description                          |
|--------|-------------------------------|--------------------------------------|
| GET    | `/api/stats`                  | Confirmed + waiting counts per house |
| GET    | `/api/jerseys?team=green`     | Taken jersey numbers per team        |
| GET    | `/api/poll/results`           | Poll tallies                         |
| POST   | `/api/poll/vote`              | Cast vote (1 per voterKey)           |
| GET    | `/api/suggestions/approved`   | Approved suggestions for carousel    |
| GET    | `/api/settings`               | Event date/time/venue/open           |
| POST   | `/api/register`               | Submit registration                  |

### Admin (require `x-admin-token` header)
| Method | Path                              |
|--------|-----------------------------------|
| POST   | `/api/admin/login`                |
| GET    | `/api/admin/verify`               |
| GET    | `/api/admin/registrations`        |
| PUT    | `/api/admin/registrations`        |
| DELETE | `/api/admin/registrations?id=...` |
| POST   | `/api/admin/promote`              |
| POST   | `/api/admin/demote`               |
| GET    | `/api/admin/suggestions`          |
| POST   | `/api/admin/suggestions/approve`  |
| DELETE | `/api/admin/suggestions?id=...`   |
| PUT    | `/api/admin/settings`             |
| GET    | `/api/admin/export`               | CSV download |

---

## 🗄️ Data Model (MongoDB Collections)

- **participants** — registrations (unique: email, phone, [team+jerseyNumber])
- **poll_votes** — one per voterKey
- **suggestions** — collected from registration form; admin approves
- **event_settings** — date / time / venue / registrationOpen

Unique indexes are auto-created on first API call.

---

## 🎨 Design Tokens

- **House Green**: emerald-500 → green-800, gold accents (#d4af37)
- **House Black**: red-700 → black, silver accents (#c0c0c0)
- Font: **Cinzel** (display) + **Inter** (body)
- All animations via Framer Motion + CSS keyframes (smoke, particles, shimmer, confetti)

---

## 📦 Deployment

Deploy easily to **Vercel** or any Node host:
1. Push to GitHub
2. Connect repo to Vercel
3. Add env vars: `MONGO_URL`, `DB_NAME`, `ADMIN_PASSWORD`
4. Deploy — done.

For MongoDB, use **MongoDB Atlas** (free tier works fine for this event).

---

May your house reign supreme. ⚔️
