# Spectra Crypto Dashboard

AI-powered cryptocurrency trading dashboard with real-time market visualization and intelligent trading insights.

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
- `COINBASE_API_KEY` - Coinbase API key
- `COINBASE_API_SECRET` - Coinbase API secret
- `FRONTEND_URL` - Frontend URL for CORS
- `JWT_SECRET` - JWT secret for authentication
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
