# Spectra Crypto Dashboard

AI-powered cryptocurrency trading dashboard with real-time market visualization and intelligent trading insights.

## Demo

https://github.com/user-attachments/assets/Demo.webm

## Project Structure

```
spectra-crypto-dashboard/
├── frontend/          # React + TypeScript frontend
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── package.json  # Frontend dependencies
├── backend/          # Node.js + Express backend
│   ├── src/          # Source code
│   └── package.json  # Backend dependencies
├── .kiro/            # Kiro configuration and specs
└── package.json      # Root workspace configuration
```

## Tech Stack

### Frontend

- **React 18+** - UI framework with concurrent rendering
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **Recharts** - Data visualization
- **Framer Motion** - Animations

### Backend

- **Node.js + Express** - REST API server
- **TypeScript** - Type-safe development
- **WebSocket (ws)** - Real-time communication
- **Winston** - Logging
- **Express Rate Limit** - API rate limiting

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# Copy example env files
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

4. Edit the `.env` files with your configuration (especially Coinbase API credentials)

### Development

Run both frontend and backend in development mode:

```bash
npm run dev
```

Or run them separately:

```bash
# Frontend only (http://localhost:5173)
npm run dev:frontend

# Backend only (http://localhost:3001)
npm run dev:backend
```

### Quick sharing with LocalTunnel (no deploy)

Use LocalTunnel to expose your local dev servers when you need a temporary public URL.

1) Install (optional): `npm install -g localtunnel` (or use `npx localtunnel ...`).

2) Pick tunnel subdomains (optional but easier to remember):
	- API: `npx localtunnel --port 3001 --subdomain spectra-api`
	- WebSocket: `npx localtunnel --port 3002 --subdomain spectra-ws`
	- Frontend: `npx localtunnel --port 5173 --subdomain spectra-app`

3) Start the backend with CORS pointed at your frontend tunnel:

```bash
# from repo root
FRONTEND_URL=https://spectra-app.loca.lt PORT=3001 WS_PORT=3002 \
npm run dev:backend
```

4) Start the frontend with backend URLs set to the tunnels and bind to all hosts so LocalTunnel can reach it:

```bash
# from repo root
VITE_BACKEND_API_URL=https://spectra-api.loca.lt \
VITE_BACKEND_WS_URL=wss://spectra-ws.loca.lt \
npm run dev --workspace=frontend -- --host --port 5173
```

5) Expose the frontend dev server:

```bash
npx localtunnel --port 5173 --subdomain spectra-app
```

6) Share the frontend tunnel URL (e.g., `https://spectra-app.loca.lt`). The app will call the tunneled API/WS endpoints.

Notes:
- Keep three tunnels running (API 3001, WS 3002, frontend 5173). If a tunnel drops, restart it; the URL may change unless you re-request the same subdomain.
- If you change the frontend tunnel URL, update `FRONTEND_URL` for the backend to keep CORS happy.
- LocalTunnel is best-effort; for more stability, use ngrok or a quick cloud deploy (see below).

### If LocalTunnel is flaky: fastest cloud deploy

- **Frontend (Vercel):** Import the repo, set root to `frontend/`, build command `npm install && npm run build`, output dir `dist`. Set env `VITE_BACKEND_API_URL` and `VITE_BACKEND_WS_URL` to your backend deployment URLs.
- **Backend (Railway/Render/Fly):** Deploy `backend/` with start command `npm run start --workspace=backend` (after `npm run build --workspace=backend`). Set envs `PORT=3001`, `WS_PORT=3002`, `FRONTEND_URL=<your Vercel URL>`, `JWT_SECRET`, DB creds, and Coinbase keys. Ensure WebSocket (3002) is exposed.
- Update frontend envs to point at the backend host and redeploy frontend. This two-step deploy is typically <15 minutes on Vercel + Railway.

### Building for Production

```bash
npm run build
```

### Code Quality

```bash
# Lint all workspaces
npm run lint

# Format code with Prettier
npm run format
```

### Testing

Run the test suite:

```bash
# Run all tests
cd backend
npm test

# Run tests once (no watch mode)
npm test -- --run

# Run with coverage
npm test -- --coverage --run

# Run specific test file
npm test -- tests/unit/auth.test.ts --run

# Run tests with UI
npm test:ui
```

For detailed testing documentation, see [docs/TESTING.md](docs/TESTING.md)

## Environment Variables

### Frontend (`frontend/.env`)

- `VITE_BACKEND_API_URL` - Backend REST API URL
- `VITE_BACKEND_WS_URL` - Backend WebSocket URL
- `VITE_ENABLE_PAPER_TRADING` - Enable paper trading mode
- `VITE_APP_NAME` - Application name
- `VITE_ENV` - Environment (development/production)

### Backend (`backend/.env`)

- `PORT` - REST API server port
- `WS_PORT` - WebSocket server port
- `COINBASE_API_KEY_NAME` - Coinbase Cloud API key name (kid)
- `COINBASE_PRIVATE_KEY` - PEM-formatted private key for the Coinbase API key
- `FRONTEND_URL` - Frontend URL for CORS
- `JWT_SECRET` - JWT secret for authentication
- Legacy variables `COINBASE_API_KEY` / `COINBASE_API_SECRET` are also accepted for backwards compatibility
- See `backend/.env.example` for full list

## Features

- 🔥 Real-time cryptocurrency heatmap
- 📊 AI-powered market insights
- 💹 Direct trading through Coinbase
- 📈 Portfolio management and tracking
- 🔔 Smart alert system
- 📱 Responsive mobile design
- 🌙 Dark/light mode
- 📝 Trade history and reporting
- 🎮 Paper trading mode

## Development Guidelines

- Follow TypeScript strict mode
- Use ESLint and Prettier for code consistency
- Write meaningful commit messages
- Keep components small and focused
- Use custom hooks for reusable logic
- Implement proper error handling

## License

MIT
