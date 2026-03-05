# Sajdah API — Prayer Tracking Backend

## Setup

1. Install dependencies:
```bash
cd api
npm install
```

2. Create `.env` from `.env.example`:
```bash
cp .env.example .env
```

3. Set your MongoDB URI and JWT secret in `.env`:
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_here
PORT=5000
```

4. Start the server:
```bash
npm run dev
```

## API Endpoints

### Auth
- `POST /auth/register` — Register (email, password, language, initialQadaEstimate)
- `POST /auth/login` — Login (email, password)
- `GET /auth/me` — Get current user (requires Bearer token)

### Prayers
- `POST /prayers/today/ensure` — Create/fetch today's record
- `POST /prayers/present` — Mark prayer done `{ prayer: 'FAJR' }`
- `POST /prayers/qada` — Log qada `{ prayer: 'DHUHR', count: 7 }`
- `POST /prayers/undo` — Undo last action
- `POST /prayers/daily-close` — Close a day `{ date: 'YYYY-MM-DD' }`
- `POST /prayers/close-missed` — Close all missed days

### History
- `GET /history?from=YYYY-MM-DD&to=YYYY-MM-DD` — Get history
- `GET /history/stats` — Get 14-day stats

### Settings
- `GET /settings` — Get all settings
- `PUT /settings/notifications` — Update notification settings
- `PUT /settings/profile` — Update profile (language, timezone, dayBoundary)
