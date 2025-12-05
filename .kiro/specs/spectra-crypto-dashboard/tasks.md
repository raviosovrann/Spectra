# Implementation Plan

## Current Status Summary

**Completed:**
- ✅ Project setup with monorepo structure (frontend/backend)
- ✅ Landing page with Hero, Features, CryptoShowcase, AIInsights, CallToAction, Footer sections
- ✅ User authentication system (registration, login, JWT tokens, HTTP-only cookies)
- ✅ Database setup with PostgreSQL and user table migration (spectra_user_t)
- ✅ Password hashing with bcrypt (10 salt rounds) and API credential encryption with AES-256-GCM
- ✅ Authentication routes (register, login, logout, me) and middleware
- ✅ User management routes (profile, Coinbase keys with CRUD operations)
- ✅ Frontend authentication context with cookie-based sessions and auto-refresh
- ✅ Login and Signup pages with real authentication and validation
- ✅ Protected routes implementation with ProtectedRoute wrapper
- ✅ Settings page for Coinbase API credentials (HMAC & ECDSA support), Wallet section, Security, and Danger Zone
- ✅ Profile page for personal information and preferences
- ✅ Dashboard layout with horizontal tab navigation (Robinhood-style)
- ✅ Coinbase Advanced Trade API client with HMAC and ECDSA signature support
- ✅ WebSocket manager for Coinbase connection with reconnection logic and exponential backoff
- ✅ Express server with CORS, cookie parser, health check, and error handling
- ✅ UI/UX Refinements (Delete Modal, Navigation fixes, Page reorganization)
- ✅ Wallet API endpoint to fetch Coinbase account balances
- ✅ Technical indicators (RSI, SMA, MACD, Bollinger Bands, Stochastic, volatility, volume analysis)
- ✅ Technical Analysis Engine combining indicators for market insights
- ✅ Dynamic InsightsView with add/remove coins, detail modal, and whale detection
- ✅ Backend WebSocket Server for frontend clients
- ✅ Market Data Relay from Coinbase to frontend
- ✅ Database Migrations for portfolios, holdings, trades, alerts
- ✅ Whale Detection via ticker data volume analysis
- ✅ Insights Generation with AI Engine combining ML + Technical Analysis
- ✅ Market Data History API for historical candles
- ✅ Frontend Zustand Stores (marketStore, portfolioStore, alertsStore, insightsStore)
- ✅ WebSocket Hook with auto-reconnection
- ✅ InvestingView with real-time WebSocket data
- ✅ CoinDetailModal with price charts and technical indicators
- ✅ TradingView with real-time data, order form, and Coinbase integration
- ✅ Order submission flow with backend API and Coinbase integration
- ✅ OrderConfirmation modal with success/error handling
- ✅ Order status tracking API (GET/DELETE /api/orders/:orderId)
- ✅ Historical market data fully migrated to CoinGecko OHLC endpoints with 365-day aggregation and caching
- ✅ TradingView + useCandleData wired to the new history endpoint, removing timeframe dropdown in favor of a fixed 1-year view
- ✅ CredentialsGate component enforcing Coinbase credential checks across Portfolio, Alerts, and History views
- ✅ Backend portfolio, alerts, and trades routes returning real DB-backed data with the frontend pages now consuming live APIs (loaders, error states, CSV export)

**In Progress / Next Priority:**
1. **Alert Monitoring Engine** - Real-time trigger processing and notifications (Tasks 9.2-9.3)
2. **Automated Test Coverage** - Orders, portfolio math, and alert rules (Tasks 7.5, 8.4, 9.5)
3. **Demo & Deployment Prep** - Documentation refresh plus localtunnel-based demo workflow

**Deferred:**
- Paper Trading Mode (hidden in UI for MVP)
- Kiro Integration (Agent Hooks, MCP, Steering Docs)
- Deployment (optional for demo)

---

- [x] 1. Project Setup and Configuration
  - Initialize monorepo structure with frontend and backend directories
  - Configure TypeScript for both frontend (React) and backend (Node.js)
  - Set up TailwindCSS with custom design system (colors, typography, spacing)
  - Configure Vite for frontend with environment variable support
  - Create .env.example files with all required variables documented
  - Set up ESLint and Prettier for code consistency
  - Initialize Git repository with proper .gitignore (exclude .env, include .kiro)
  - _Requirements: 15.1_

- [x] 1.1 Create Landing Page and Authentication UI
  - Build landing page with Hero, Features, CryptoShowcase, AIInsights, CallToAction, Footer sections
  - Create Login page with email/password and social auth UI (for visual purposes only)
  - Create Signup page with form validation UI (for visual purposes only)
  - Set up React Router with routes for /, /login, /signup, /dashboard
  - Login/Signup buttons redirect directly to /dashboard (no actual authentication)
  - Implement responsive navigation and layout
  - _Requirements: 9.5, 14.1_

- [x] 2. Backend Foundation and Coinbase Integration
- [x] 2.1 Set up Express server with TypeScript
  - Create Express app with CORS middleware configured for frontend URL
  - Implement health check endpoint (/health) with service status checks
  - Set up error handling middleware for consistent error responses
  - Configure Winston logger with file and console transports
  - _Requirements: 15.1, 12.4_

- [x] 2.2 Implement Coinbase REST API client
  - Create backend/src/services/CoinbaseClient.ts with HMAC SHA256 authentication
  - Implement generateSignature function for API request signing
  - Add methods: getAccounts(), getProducts(), placeOrder(), getOrder(), cancelOrder()
  - Implement request retry logic (3 attempts with exponential backoff)
  - Add rate limiting tracking to prevent API quota exhaustion
  - Create backend/src/types/coinbase.ts for type definitions
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 12.2_

- [x] 2.2.1 Add ECDSA signature support to CoinbaseClient
  - Update backend/src/services/CoinbaseClient.ts to detect key format (HMAC vs ECDSA)
  - Implement ECDSA signature generation using crypto.createSign('SHA256')
  - Auto-detect signature type based on key format (BEGIN EC PRIVATE KEY = ECDSA)
  - Test with both HMAC and ECDSA API keys
  - Update backend/src/types/coinbase.ts to include signatureType field
  - _Requirements: 15.1, 12.2_

- [x] 2.3 Implement WebSocket connection to Coinbase
  - Create backend/src/services/WebSocketManager.ts with connection lifecycle management
  - Implement exponential backoff reconnection (1s, 2s, 4s... up to 60s max)
  - Add subscribe() method for ticker and level2 channels
  - Implement message parsing and normalization to internal TickerMessage format
  - Add connection status tracking (connected/disconnected/reconnecting)
  - Create backend/src/types/websocket.ts for message type definitions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 13.3_

- [x] 2.4 Set up PostgreSQL database and user authentication
- [x] 2.4.1 Configure database connection
  - Install pg (PostgreSQL client) and related dependencies
  - Create backend/src/database/config.ts with connection pool configuration
  - Add database environment variables to .env.example (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
  - Test database connection with health check
  - _Requirements: 12.1, 14.5_

- [x] 2.4.2 Run database migrations
  - Execute backend/src/database/migrations/001_create_users_table.sql to create spectra_user_t table
  - Verify table creation with columns: user_id, full_name, username, email_address, password, user_coinbase_public, user_coinbase_secret (with encryption fields)
  - Verify indexes are created on email_address and username
  - _Requirements: 12.1_

- [x] 2.4.3 Implement user authentication service
  - Create backend/src/services/AuthService.ts with register, login, and verifyToken methods
  - Implement password hashing with bcrypt (10 salt rounds)
  - Implement JWT token generation and verification (24-hour expiration)
  - Create backend/src/types/auth.ts for authentication type definitions
  - Add ENCRYPTION_KEY and JWT_SECRET to environment variables
  - _Requirements: 12.1, 12.2_

- [x] 2.4.4 Implement API credential encryption
  - Create backend/src/utils/encryption.ts with encryptApiKey and decryptApiKey functions
  - Use AES-256-GCM encryption algorithm
  - Store initialization vector (IV) and auth tag separately in database
  - Test encryption/decryption with sample Coinbase API keys
  - _Requirements: 12.1, 12.2_

- [x] 2.4.5 Create authentication routes
  - Create backend/src/routes/auth.ts with endpoints: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
  - Implement input validation for registration (email format, password strength, unique username)
  - Return JWT token and user data (excluding password and encrypted keys) on successful login
  - Create authentication middleware backend/src/middleware/auth.ts to verify JWT tokens
  - Wire up auth routes in backend/src/index.ts
  - _Requirements: 12.1, 12.5_

- [x] 2.4.6 Create user management routes
  - Create backend/src/routes/users.ts with endpoints: GET /api/users/profile, PATCH /api/users/profile, PATCH /api/users/coinbase-keys
  - Implement endpoint to update user profile (full_name, username)
  - Implement endpoint to add/update Coinbase API credentials (encrypt before storing)
  - Protect all routes with authentication middleware
  - Wire up user routes in backend/src/index.ts
  - _Requirements: 12.1, 12.2, 15.1_

- [x] 2.4.7 Implement frontend authentication context
  - Create frontend/src/contexts/AuthContext.tsx with login, logout, register methods
  - Store JWT token in localStorage with key 'spectra_auth_token'
  - Implement automatic token refresh logic (check expiration)
  - Create frontend/src/hooks/useAuth.ts hook for accessing auth context
  - Create frontend/src/types/auth.ts for authentication type definitions
  - _Requirements: 12.1_

- [x] 2.4.8 Update Login and Signup pages with real authentication
  - Update frontend/src/pages/Login.tsx to call AuthContext.login() with email and password
  - Update frontend/src/pages/Signup.tsx to call AuthContext.register() with form data
  - Add form validation (email format, password strength, matching passwords)
  - Display error messages for failed authentication
  - Redirect to /dashboard on successful authentication
  - _Requirements: 12.1, 12.5_

- [x] 2.4.9 Implement protected routes
  - Create frontend/src/components/ProtectedRoute.tsx wrapper component
  - Check authentication status before rendering protected routes
  - Redirect to /login if user is not authenticated
  - Wrap all dashboard routes with ProtectedRoute
  - _Requirements: 12.1_

- [x] 2.4.10 Create user settings page for Coinbase API keys
  - Create frontend/src/pages/Settings.tsx with form for Coinbase API credentials
  - Add input fields for API key and API secret
  - Implement save functionality that calls PATCH /api/users/coinbase-keys
  - Display success/error messages
  - Add link to Settings page in dashboard header account menu
  - Note: ProfileView.tsx also exists for viewing user profile information
  - _Requirements: 12.1, 15.1_

- [x] 2.4.11 Add Wallet section to Settings page
  - Create frontend/src/components/settings/WalletSection.tsx component
  - Display Coinbase account balances fetched from GET /api/wallet/accounts
  - Show available balance, held funds, and account type for each currency
  - Add refresh button to reload balances
  - Display loading state while fetching accounts
  - Show empty state if no API keys configured
  - Add helpful text about depositing/withdrawing funds via Coinbase
  - Integrate WalletSection into Settings.tsx below CoinbaseCredentialsForm
  - _Requirements: 15.2, 12.1_

- [x] 2.4.12 Create wallet API endpoints
  - Create backend/src/routes/wallet.ts with endpoint: GET /api/wallet/accounts
  - Protect route with authentication middleware to get user_id
  - Retrieve user's encrypted Coinbase API credentials from database
  - Decrypt credentials and initialize CoinbaseClient
  - Call client.getAccounts() to fetch account balances
  - Return account data to frontend
  - Handle errors gracefully (invalid keys, API errors)
  - Wire up wallet routes in backend/src/index.ts
  - _Requirements: 15.2, 12.1, 12.2_

- [x] 2.4.13 Add authentication tests
  - Write unit tests for password hashing and JWT generation
  - Write unit tests for API credential encryption/decryption
  - Write integration tests for registration and login flows
  - Test authentication middleware with valid and invalid tokens
  - _Requirements: 12.1, 12.2_

- [x] 2.4.14 Add unit tests for CoinbaseAdvancedClient
  - Create backend/tests/unit/CoinbaseAdvancedClient.test.ts for isolated unit tests
  - Mock axios HTTP client to avoid real API calls
  - Test HMAC signature generation with known inputs and expected outputs
  - Test ECDSA signature generation with mock EC private key
  - Test signature type auto-detection (HMAC vs ECDSA based on key format)
  - Test request header construction (CB-ACCESS-KEY, CB-ACCESS-SIGN, CB-ACCESS-TIMESTAMP)
  - Test error handling for invalid credentials, network failures, and API errors
  - Test retry logic with exponential backoff for failed requests
  - Verify request payload formatting for different API methods (getAccounts, placeOrder, etc.)
  - _Requirements: 15.1, 15.2, 12.2_

- [x] 2.5 Build Dashboard Layout and Navigation (Robinhood-style)
  - Create frontend/src/components/layout/DashboardLayout.tsx with Header and main content area
  - Create Header with logo, search bar, account menu, theme toggle, connection status
  - Create horizontal tab navigation: Investing, Trading, Portfolio, Insights, Alerts, History
  - Implement theme toggle (dark/light mode) with localStorage persistence
  - Add responsive mobile navigation (bottom tab bar on mobile)
  - Create route structure: /dashboard (default to Investing), /dashboard/trading, /dashboard/portfolio, /dashboard/insights, /dashboard/alerts, /dashboard/history
  - Update Login/Signup pages to redirect to /dashboard on button click
  - _Requirements: 9.5, 14.1_

- [x] 2.6 Create Frontend Page Placeholders with Mock Data
  - Create frontend/src/pages/InvestingView.tsx with heatmap grid using mock data
  - Create frontend/src/pages/TradingView.tsx with order form UI using mock data
  - Create frontend/src/pages/PortfolioView.tsx with holdings table and charts using mock data
  - Create frontend/src/pages/InsightsView.tsx with AI insights cards using mock data
  - Create frontend/src/pages/AlertsView.tsx with alerts list using mock data
  - Create frontend/src/pages/HistoryView.tsx with trade history table using mock data
  - Create frontend/src/data/mockData.ts with sample cryptocurrency, portfolio, trade, insight, and alert data
  - Create frontend/src/stores/userStore.ts for theme and user preferences
  - Note: All pages are fully functional with mock data and beautiful UI
  - _Requirements: 1.1, 3.1, 4.1, 5.1, 7.1, 8.1, 9.5_

- [x] 2.7 UI/UX Refinements and Reorganization
  - Implement DeleteConfirmationModal for API key deletion
  - Fix navigation tab highlighting (hide active tab on Profile/Settings)
  - Reorganize Settings page: Add Security (Password, 2FA) and Danger Zone (Delete Account)
  - Simplify Profile page: Remove Security, Danger Zone, and Trading Mode
  - Rename "Logout" to "Sign Out" in account menu
  - Ensure consistent background styling across pages
  - _Requirements: 9.5, 12.1_

- [x] 3. Backend WebSocket Server and Real-Time Market Data
- [x] 3.1 Create WebSocket server for frontend clients
  - Create backend/src/services/FrontendWebSocketServer.ts with WebSocket server class
  - Install ws library: `npm install ws @types/ws` in backend directory
  - Set up WebSocket server on separate port (3002) from REST API
  - Implement client connection handling with Map to track connected clients
  - Create broadcast() method to send market updates to all connected clients
  - Add heartbeat/ping mechanism (30s interval) to detect and close dead connections
  - Implement connection authentication using JWT tokens from handshake
  - Update backend/src/index.ts to initialize and start WebSocket server alongside Express
  - _Requirements: 2.2, 11.1_

- [x] 3.2 Implement market data relay service
  - Create backend/src/services/MarketDataRelay.ts with MarketDataRelay class
  - Initialize WebSocketManager (already exists) and connect to Coinbase WebSocket feed
  - Subscribe to ticker channel for top 30 cryptocurrency pairs (BTC-USD, ETH-USD, SOL-USD, ADA-USD, DOGE-USD, etc.)
  - Implement message batching using setInterval to collect updates every 16ms (~60fps)
  - Normalize incoming Coinbase ticker messages to internal format with consistent field names
  - Enrich data with calculated fields (24h change percentage, formatted timestamps)
  - Integrate with FrontendWebSocketServer to broadcast batched updates to all connected frontend clients
  - Add error handling for Coinbase connection failures with automatic reconnection
  - Wire up MarketDataRelay in backend/src/index.ts to start on server initialization
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 11.1, 11.2_

- [x] 3.3 Create database migrations for portfolios, holdings, trades, and alerts
  - Create backend/src/database/migrations/002_create_portfolios_table.sql with columns: portfolio_id, user_id, total_value, cash_balance, change_24h, change_24h_percent, is_paper_trading, updated_at
  - Create backend/src/database/migrations/003_create_holdings_table.sql with columns: holding_id, portfolio_id, symbol, quantity, average_buy_price, current_price, current_value, unrealized_pnl, unrealized_pnl_percent, updated_at
  - Create backend/src/database/migrations/004_create_trades_table.sql with columns: trade_id, user_id, order_id, symbol, side, amount, price, fees, total_value, is_paper_trade, executed_at, created_at
  - Create backend/src/database/migrations/005_create_alerts_table.sql with columns: alert_id, user_id, symbol, alert_type, condition (JSONB), status, created_at, triggered_at
  - Create backend/src/database/runMigration.ts script to run migrations in order
  - Run migrations to create tables in database
  - _Requirements: 12.1, 14.5_

- [x] 4. Technical Analysis Engine (Complete)
- [x] 4.1 Implement technical indicator calculations
  - Create backend/src/services/TechnicalIndicators.ts with calculation functions
  - Implement calculateRSI(prices: number[], period: number = 14): number using standard RSI formula (RS = avg gain / avg loss)
  - Implement calculateSMA(prices: number[], period: number): number for simple moving average
  - Implement detectSMACrossover(prices: number[], shortPeriod: number = 7, longPeriod: number = 30): 'bullish' | 'bearish' | 'neutral' to detect golden/death crosses
  - Implement calculateVolatility(prices: number[]): number using standard deviation of returns
  - Implement analyzeVolume(currentVolume: number, averageVolume: number): VolumeAnalysis to detect volume spikes (>150% threshold)
  - Create backend/src/types/indicators.ts for type definitions (VolumeAnalysis, TechnicalIndicator, SMACrossover, etc.)
  - Handle edge cases: insufficient data (return neutral/50), NaN values, empty arrays
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 4.2 Implement whale detection
  - Create backend/src/services/WhaleDetector.ts
  - Detect large trades via ticker volume data (>10x average = whale)
  - Calculate average order size over rolling window (last 100 ticks)
  - Generate whale alert events integrated with Technical Analysis Engine
  - _Requirements: 6.5_

- [x] 4.3 Build insights generation system
  - Create backend/src/services/AIEngine.ts with Technical Analysis Engine class
  - Implement generateInsights(symbol: string, marketData: MarketData): MarketInsight[] function
  - Calculate all technical indicators using TechnicalIndicators service (RSI, SMA crossover, volatility, volume)
  - Implement confidence scoring algorithm: RSI extremes (>70 or <30) = high confidence, SMA crossover = medium, volume spike = medium
  - Generate natural language summaries for each insight (e.g., "BTC is oversold with RSI at 28 - potential buying opportunity")
  - Implement insight prioritization: sort by confidence score, limit to top 3-5 insights per symbol
  - Implement 60-second caching for insights per symbol using Map<string, { insights: MarketInsight[], timestamp: number }>
  - Create backend/src/routes/insights.ts with endpoints: GET /api/insights (top insights across all symbols), GET /api/insights/:symbol (symbol-specific)
  - Protect routes with authentication middleware
  - Wire up insights routes in backend/src/index.ts
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 11.2_

- [x] 4.4 Create market data history API
  - Create backend/src/routes/market.ts with endpoint: GET /api/market/history/:symbol
  - Support query params: interval (1m, 5m, 15m, 1h, 1d), start, end
  - Fetch historical candle data from Coinbase API or cache
  - Store historical data in memory cache for performance
  - Return candle data (timestamp, open, high, low, close, volume)
  - Wire up market routes in backend/src/index.ts
  - _Requirements: 1.1, 3.4_

- [x] 4.5 Update frontend InsightsView
  - Update frontend/src/pages/InsightsView.tsx to use insightsStore
  - Add ability to add/remove tracked coins
  - Add "View Details" modal with full insight breakdown
  - Show technical analysis details (RSI, SMA, volatility, volume)
  - Auto-refresh insights every 60 seconds
  - Add whale detection panel with filtering by size
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 5. Frontend State Management and Real-Time Data Integration
- [x] 5.1 Create Zustand stores for application state
  - Install zustand if not already: `npm install zustand` in frontend directory
  - Create frontend/src/stores/marketStore.ts with Zustand store for cryptocurrency data
  - Implement updateBatch(updates: Cryptocurrency[]) method to efficiently update multiple cryptos at once
  - Implement updateSingle(symbol: string, data: Partial<Cryptocurrency>) for individual updates
  - Add selectors: getCrypto(symbol), getAllCryptos(), getTopMovers()
  - Create frontend/src/stores/portfolioStore.ts for holdings, total value, cash balance, and P&L tracking
  - Implement methods: updateHolding(), addHolding(), removeHolding(), updateCashBalance(), calculateTotalValue()
  - Create frontend/src/stores/alertsStore.ts for alert management
  - Implement methods: addAlert(), deleteAlert(), snoozeAlert(), triggerAlert(), getActiveAlerts()
  - Create frontend/src/types/market.ts with Cryptocurrency, PriceHistory, Candle, TickerUpdate interfaces
  - Create frontend/src/types/portfolio.ts with Portfolio, Holding, PortfolioSummary interfaces
  - Create frontend/src/types/alert.ts with Alert, AlertCondition, AlertType interfaces
  - _Requirements: 3.1, 3.2, 14.2, 14.4_

- [x] 5.2 Implement WebSocket hook for frontend
  - Create frontend/src/hooks/useWebSocket.ts custom React hook with connection lifecycle management
  - Connect to backend WebSocket server using URL from environment variable (VITE_WS_URL or ws://localhost:3002)
  - Implement automatic reconnection on connection loss with exponential backoff (1s, 2s, 4s, 8s, max 30s)
  - Add message handler registration: onMessage(type: string, handler: (data: any) => void)
  - Parse incoming WebSocket messages and route to appropriate handlers based on message type
  - Update marketStore.updateBatch() when ticker batch messages arrive from backend
  - Track connection status state: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  - Return connection status and methods from hook: { status, connect, disconnect, send }
  - Update ConnectionStatus indicator in DashboardLayout Header to show real-time connection status with color coding
  - Add useEffect cleanup to close WebSocket connection when component unmounts
  - _Requirements: 2.2, 2.3, 13.3_

- [x] 6. Real-Time Heatmap Integration
- [x] 6.1 Enhance InvestingView with real-time data
  - Update frontend/src/pages/InvestingView.tsx to use marketStore.getAllCryptos() instead of mockCryptos
  - Initialize WebSocket connection using useWebSocket hook in component
  - Subscribe to market data updates and trigger re-renders when marketStore updates
  - Implement pulse animation on price updates using Framer Motion's animate prop (green pulse for price increase, red for decrease)
  - Wrap CoinCell component with React.memo() and custom comparison function to only re-render when price/change24h changes
  - Create frontend/src/utils/formatters.ts with functions: formatCurrency(), formatNumber() (K/M/B suffixes), formatPercent()
  - Add CSS transition classes for smooth color changes on heatmap cells (transition-colors duration-300)
  - Update cell background colors dynamically based on real-time 24h change percentage
  - Add loading skeleton while initial data loads
  - Handle empty state if no market data available
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 9.1, 9.2, 9.3, 11.1_

- [x] 6.2 Create CoinDetailModal
  - Create frontend/src/components/modals/CoinDetailModal.tsx with modal component
  - Accept props: isOpen, onClose, symbol
  - Display detailed cryptocurrency information: name, symbol, current price, 24h change (with color coding), 24h volume, market cap
  - Fetch and display price chart using PriceChart component (to be created in task 13.1) with 24h historical data
  - Fetch and display technical indicators from GET /api/insights/:symbol endpoint
  - Show indicator cards: RSI (with overbought/oversold zones), Volatility (percentage), Volume (vs average)
  - Add "Trade" button that navigates to /dashboard/trading with selected cryptocurrency pre-selected
  - Implement modal close on ESC key press using useEffect with keyboard event listener
  - Implement modal close on backdrop click
  - Add loading spinner while fetching data from backend
  - Handle error state if data fetch fails
  - Use Framer Motion for smooth modal enter/exit animations
  - _Requirements: 1.1, 9.3_

- [x] 7. Trading Interface
- [x] 7.1 Update TradingView with real-time data and order form
  - Update frontend/src/pages/TradingView.tsx to use marketStore.getAllCryptos() instead of mockCryptos
  - Subscribe to real-time price updates for selected cryptocurrency from marketStore
  - Update selected cryptocurrency price display in real-time (every update from WebSocket)
  - Fetch and display user's cash balance from portfolioStore.getCashBalance()
  - Add client-side input validation: amount > 0, amount >= $10 minimum, buy orders check balance >= total cost
  - Calculate estimated fees dynamically: feeAmount = subtotal * 0.005 (0.5%)
  - Show total cost calculation: total = (amount * price) + fees for buy orders
  - Show total proceeds calculation: total = (amount * price) - fees for sell orders
  - Update calculations in real-time as user types in amount field
  - Disable submit button if validation fails (insufficient balance, below minimum, invalid amount)
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7.2 Implement order submission flow
  - Create backend/src/routes/orders.ts with POST /api/orders endpoint
  - Protect route with authentication middleware to extract user_id from JWT
  - Retrieve user's encrypted Coinbase API credentials from database using user_id
  - Decrypt credentials using decryptApiKey() from encryption utility
  - Validate order on backend: amount > 0, amount >= $10 minimum, symbol format valid (XXX-USD)
  - For buy orders: verify user has sufficient balance (query Coinbase accounts API)
  - Initialize CoinbaseAdvancedClient with user's decrypted credentials
  - Call client.placeOrder() to submit order to Coinbase API
  - Store trade record in trades table
  - Return order response to frontend: { orderId, status, filledAmount, executedValue, fees }
  - Wire up orders routes in backend/src/index.ts with app.use('/api/orders', ordersRoutes)
  - Add error handling for: invalid credentials, insufficient balance, API errors, network failures
  - _Requirements: 4.4, 4.5, 12.1, 12.2, 12.3, 15.1, 15.3_

- [x] 7.3 Build OrderConfirmation modal
  - Create frontend/src/components/modals/OrderConfirmation.tsx modal component
  - Accept props: isOpen, onClose, onConfirm, orderDetails (symbol, side, type, amount, price, fees, total)
  - Display order summary in clear layout: "You are about to [BUY/SELL] [amount] [symbol] at [price]"
  - Show breakdown: Subtotal, Fees (0.5%), Total Cost/Proceeds
  - Add "Confirm Order" button (primary, green for buy, red for sell) and "Cancel" button (secondary)
  - Disable confirm button and show loading spinner during order submission (isSubmitting state)
  - Call onConfirm callback when user clicks confirm button
  - Display success message on successful order placement
  - Display error message if order fails
  - Close modal automatically 2 seconds after successful order
  - Implement modal close on ESC key and backdrop click (only when not submitting)
  - _Requirements: 4.4, 4.5_

- [x] 7.4 Implement order status tracking
  - Add GET /api/orders/:orderId endpoint in backend/src/routes/orders.ts
  - Protect route with authentication middleware
  - Retrieve user's Coinbase credentials and initialize CoinbaseAdvancedClient
  - Query Coinbase API for order status using client.getOrder(orderId)
  - Return order status: { orderId, status, filledAmount, averagePrice, fees, updatedAt }
  - Update trade record in database when order is filled
  - Add DELETE /api/orders/:orderId endpoint for order cancellation
  - Note: Frontend polling hook (useOrderStatus) deferred to future iteration
  - _Requirements: 4.5, 15.4_

- [ ]* 7.5 Add order placement tests
  - Write unit tests for order validation logic (amount, balance, minimum size)
  - Write integration tests for order submission flow
  - Test error handling for insufficient balance, invalid amounts, API failures
  - _Requirements: 4.2, 4.3_

- [x] 8. Portfolio Management
- [x] 8.1 Wire PortfolioView to live APIs
  - Replaced mock data with authenticated fetches to `/api/portfolio` and `/api/portfolio/history`
  - Added `CredentialsGate` wrapper so the page only renders when Coinbase keys are configured
  - Normalized backend payloads into strongly typed holdings before syncing them into `portfolioStore`
  - Surfaced total value, cash balance, and rolling 24h P&L with animated success/danger styling
  - Implemented optimistic refresh/retry flows plus graceful empty/errored states
  - _Requirements: 3.1, 3.2, 3.5_

- [x] 8.2 Visualize portfolio performance
  - Portfolio performance chart now consumes the 30-day history feed and renders responsive Recharts line series with tooltips
  - Asset allocation pie chart reflects real holding weights and handles empty portfolios cleanly
  - Loading placeholders and summary metrics stay in sync with the latest backend snapshot
  - _Requirements: 3.3, 3.4_

- [x] 8.3 Ship portfolio API + history synthesis
  - Added `backend/src/routes/portfolio.ts` with `/api/portfolio` and `/api/portfolio/history` endpoints protected by `authMiddleware`
  - SQL queries aggregate the most recent `spectra_user_portfolio_t` snapshot plus associated holdings, with numeric coercion handled via `toNumber`
  - History endpoint rebuilds a 30-day series from trade net flows so charts can render even without dedicated snapshots
  - Standardized logging + error responses for observability
  - _Requirements: 3.1, 3.2, 3.4, 12.1, 14.5_

- [ ]* 8.4 Add portfolio calculation tests
  - Write unit tests covering trade flow reconstruction and P&L edge cases (zero holdings, negative performance)
  - Validate API handlers return typed payloads when DB rows are missing or partial
  - _Requirements: 3.1, 3.2_

- [x] 9. Smart Alerts System
- [x] 9.1 Launch AlertsView CRUD experience
  - Wired `AlertsView` to `/api/alerts` so it fetches, creates, updates, and deletes real alerts instead of mocks
  - Added `CredentialsGate`, loaders, retries, and banner-level error handling for failed API interactions
  - Creation form validates target thresholds, supports multiple alert types, and normalizes backend payloads for UI display
  - Users can toggle status or delete alerts inline with visual badges describing active/triggered/snoozed states
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 9.2 Implement alert monitoring service
  - Added `AlertService` with an in-memory active-alert cache, periodic reload, and price-above/below checks that update DB status + `triggered_at`
  - `MarketDataRelay` calls `checkAlerts` on every Coinbase ticker and dispatches `alert_triggered` WebSocket messages to the owning user via `FrontendWebSocketServer`
  - Triggered alerts are removed from the active cache to prevent immediate retrigger; manual refresh is available when new alerts are created
  - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [x] 9.3 Build AlertNotification component
  - Implemented global `NotificationCenter` + Zustand store that renders stacked, dismissible toasts (now top-left with elevated z-index)
  - `DashboardLayout` listens for `alert_triggered` WebSocket events and pushes warning toasts while updating the alerts store; `AlertsView` adds a fetch-based fallback toast when status flips to triggered
  - _Requirements: 8.5_

- [x] 9.4 Implement alert persistence API
  - Added `backend/src/routes/alerts.ts` providing GET/POST/PATCH/DELETE with strict validation, JSONB condition storage, and normalized responses
  - All routes require auth and emit structured logs on failure for debugging
  - PATCH endpoint now doubles as "snooze/activate" control by toggling statuses and timestamps
  - _Requirements: 8.1, 12.1, 14.3_

- [ ]* 9.5 Add alert system tests
  - Write unit tests for alert condition checking (price, RSI, volume, SMA)
  - Test alert triggering logic with mock market data
  - Test notification delivery via WebSocket
  - _Requirements: 8.2, 8.3, 8.4_

- [x] 10. Trade History
- [x] 10.1 Upgrade HistoryView with live trade data
  - HistoryView now calls `/api/trades` with credentials, replacing mock data entirely
  - Added search, side filters, stats cards, CSV export button, and `CredentialsGate` protection
  - Implemented comprehensive loading, retry, and empty states so UX is consistent across credential scenarios
  - _Requirements: 5.1, 5.2_

- [ ] 10.2 Extend trade filtering and search
  - Add symbol dropdown plus date range picker that forward filters to the backend endpoint
  - Surface active filter badges and a "Clear filters" reset so users know what is applied
  - Consider pagination when large datasets are returned from the API (currently capped at 500 rows)
  - _Requirements: 5.2, 5.4_

- [x] 10.3 Implement CSV export
  - Added inline CSV export that serializes the currently filtered dataset and streams it to the browser
  - Files follow the naming scheme `trade-history-YYYY-MM-DD.csv` for bookkeeping
  - _Requirements: 5.5_

- [x] 10.4 Create trade history API
  - Added `backend/src/routes/trades.ts` with auth-protected GET endpoint supporting optional symbol/type/date filters
  - Responses normalize numeric precision via `toNumber` and cap result sets at 500 for now
  - Shared logger captures failures for each user_id and returns sanitized 500 errors to clients
  - _Requirements: 5.1, 5.2, 5.3, 12.1, 14.5_

- [ ] 11. Charts and Visualizations
- [ ] 11.1 Build PriceChart component with real data
  - Create frontend/src/components/charts/PriceChart.tsx with LineChart from Recharts
  - Accept props: symbol, timeRange (1h/24h/7d/30d), height (optional)
  - Create time range selector buttons above chart to switch between ranges
  - Fetch historical price data from GET /api/market/history/:symbol?interval=[timeRange] endpoint
  - Display line chart with X-axis (time), Y-axis (price), and smooth curve
  - Implement custom tooltip showing: timestamp (formatted), price (formatted with $)
  - Color line based on overall trend: green if price increased, red if decreased
  - Show loading skeleton while fetching data
  - Handle empty state: "No historical data available for this time range"
  - Add gradient fill under line for visual appeal
  - Integrate into CoinDetailModal (24h default) and TradingView (user selectable)
  - Memoize chart data to prevent unnecessary re-renders
  - _Requirements: 1.1_

- [x] 11.2 Build CandlestickChart component
  - frontend/src/components/charts/CandlestickChart.tsx already exists
  - Shows OHLC (Open, High, Low, Close) data with mock data
  - Color-coded candles (green for up, red for down)
  - Integrated into TradingView
  - Note: Update with real data when historical API is implemented
  - _Requirements: 1.1_

- [ ] 12. Responsive Design and Mobile Optimization
- [ ] 12.1 Implement responsive layouts
  - Review all components and add Tailwind responsive classes (sm:, md:, lg:, xl:)
  - Convert heatmap grid to vertical list on mobile (<768px)
  - Stack portfolio cards vertically on mobile
  - Make tables horizontally scrollable on mobile with overflow-x-auto
  - Ensure sidebar collapses to hamburger menu on mobile
  - _Requirements: 9.1, 9.2_

- [ ] 12.2 Optimize touch interactions
  - Increase touch target sizes to minimum 44px for all buttons
  - Add touch-friendly swipe gestures for navigation (optional)
  - Implement pull-to-refresh for market data (optional)
  - Test on iOS and Android devices or browser dev tools
  - _Requirements: 9.3_

- [ ] 12.3 Optimize mobile performance
  - Implement code splitting with React.lazy() for routes
  - Lazy load non-critical components (modals, charts)
  - Optimize images and assets (use WebP format)
  - Test on 4G connection throttling (target: <3s load time)
  - _Requirements: 9.4_

- [ ] 14. Error Handling and User Feedback
- [ ] 14.1 Implement error boundary
  - Create frontend/src/components/ErrorBoundary.tsx to catch React errors
  - Display user-friendly error message
  - Add "Reload" button to recover
  - Log errors to console for debugging
  - Wrap App component with ErrorBoundary in main.tsx
  - _Requirements: 13.1_

- [ ] 14.2 Add loading states
  - Create frontend/src/components/LoadingSpinner.tsx component
  - Create frontend/src/components/SkeletonLoader.tsx for skeleton screens
  - Show loading states for: initial data load, order submission, API calls
  - Add skeleton screens for heatmap and portfolio
  - _Requirements: 13.1_

- [ ] 14.3 Implement toast notifications
  - Create frontend/src/components/Toast.tsx component
  - Create frontend/src/hooks/useToast.ts hook for toast management
  - Show toasts for: order success, order failure, connection lost, connection restored
  - Auto-dismiss after 5 seconds with manual dismiss option
  - Position toasts in top-right corner
  - _Requirements: 13.1_

- [ ] 14.4 Add empty states
  - Create frontend/src/components/EmptyState.tsx component
  - Show empty states for: no holdings, no trades, no alerts, no insights
  - Include helpful text and call-to-action buttons
  - _Requirements: 13.1_

- [ ] 15. Keyboard Shortcuts and Accessibility
- [ ] 15.1 Implement keyboard shortcuts
  - Create frontend/src/hooks/useKeyboardShortcuts.ts hook
  - Add shortcuts: "/" for search, "b" for buy, "s" for sell, "ESC" to close modals
  - Create frontend/src/components/modals/KeyboardShortcutsHelp.tsx (triggered by "?")
  - Ensure all interactive elements are keyboard accessible (tab navigation)
  - _Requirements: 9.3_

- [ ]* 15.2 Improve accessibility
  - Add ARIA labels to all interactive elements
  - Ensure proper heading hierarchy (h1, h2, h3)
  - Add alt text to images and icons
  - Test with screen reader (optional)
  - Ensure color contrast meets WCAG AA standards
  - _Requirements: 9.3_

- [ ] 16. Performance Monitoring and Optimization
- [ ] 16.1 Implement performance monitoring
  - Add performance.mark() and performance.measure() calls for key operations
  - Measure WebSocket message latency in WebSocketManager
  - Track component render times using React DevTools Profiler
  - Log performance metrics to console in development mode
  - _Requirements: 11.1, 11.4_

- [ ] 16.2 Optimize bundle size
  - Run `npm run build` and analyze bundle with vite-plugin-visualizer
  - Implement code splitting for routes using React.lazy()
  - Lazy load heavy components (charts, modals)
  - Review and remove unused dependencies
  - _Requirements: 9.4_

- [ ] 16.3 Implement caching strategies
  - Cache API responses with appropriate TTL in backend services
  - Use browser cache for static assets
  - Implement service worker for offline support (optional)
  - _Requirements: 11.2_

- [ ] 17. Security Hardening
- [ ] 17.1 Implement input validation middleware
  - Create backend/src/middleware/validation.ts for input validation
  - Use Joi or Zod for schema validation
  - Validate all user inputs before processing (orders, alerts, profile updates)
  - Sanitize string inputs to prevent XSS attacks
  - Return 400 Bad Request with validation errors
  - Apply validation middleware to all POST/PATCH/PUT routes
  - _Requirements: 12.5, 12.7_

- [ ] 17.2 Add rate limiting
  - Install express-rate-limit package
  - Create backend/src/middleware/rateLimiter.ts
  - Configure limit: 100 requests per 15 minutes per IP for API routes
  - Configure stricter limit: 10 orders per minute per user for order placement
  - Return 429 status with retry-after header
  - Apply to all /api routes in backend/src/index.ts
  - Log rate limit violations for monitoring
  - _Requirements: 12.3_

- [ ] 17.3 Secure WebSocket connections
  - Implement WebSocket authentication using JWT tokens from cookies
  - Validate token on WebSocket connection handshake
  - Validate origin header in FrontendWebSocketServer to prevent CSRF
  - Limit connections per IP (5 max) in FrontendWebSocketServer
  - Implement connection timeout (5 minutes idle)
  - Close connections on authentication failure
  - _Requirements: 12.4_

- [ ]* 18. Documentation and Developer Experience
- [ ]* 18.1 Write API documentation
  - Create docs/API.md documenting all REST endpoints
  - Include request/response examples for each endpoint
  - Document error codes and messages
  - Add authentication instructions for Coinbase API
  - _Requirements: 15.1_

- [ ]* 18.2 Create setup guide
  - Create docs/SETUP.md with step-by-step instructions
  - Document Coinbase API setup process (creating API keys)
  - List all environment variables with descriptions
  - Add troubleshooting section for common issues
  - _Requirements: 15.1_

- [x] 18.3 Write README
  - README.md already exists with project overview
  - Update with screenshots of key features once implemented
  - Tech stack and project structure already documented
  - Add Kiro usage documentation (Agent Hooks, MCP, Steering Docs) when implemented
  - _Requirements: 15.1_

- [ ]* 19. Kiro Integration (Optional)
- [ ]* 19.1 Create Agent Hooks
  - Create .kiro/hooks/market-change.hook.ts: Trigger on >5% price move in 15 min, recalculate insights
  - Create .kiro/hooks/docs-update.hook.ts: Auto-update API docs when endpoints change
  - Create .kiro/hooks/test-gen.hook.ts: Generate tests for new utility functions
  - Test hooks by triggering conditions
  - _Requirements: 7.5_

- [ ]* 19.2 Configure MCP integrations
  - Create .kiro/settings/mcp.json for MCP server configurations
  - Configure coinbase-ws MCP server for WebSocket management (if available)
  - Configure coinbase-api MCP server for REST API integration (if available)
  - Test MCP configurations
  - _Requirements: 15.1_

- [ ]* 19.3 Create Steering Documents
  - Create .kiro/steering/trading-rules.md with risk management rules
  - Create .kiro/steering/code-style.md with TypeScript conventions
  - Create .kiro/steering/ai-insights.md with indicator documentation
  - Create .kiro/steering/deployment.md with deployment process
  - _Requirements: 12.1_

- [ ]* 20. Testing and Quality Assurance
- [ ]* 20.1 Write unit tests
  - Test AI calculation functions (RSI, SMA, volatility)
  - Test order validation logic
  - Test data formatters and validators
  - Target: 80% code coverage
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 20.2 Write integration tests
  - Test order placement flow end-to-end
  - Test WebSocket message flow
  - Test API authentication
  - Test error handling scenarios
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 20.3 Write E2E tests
  - Test market monitoring flow (open app → view heatmap → click coin)
  - Test trading flow (select coin → place order → confirm → verify portfolio)
  - Test alert flow (create alert → trigger → receive notification)
  - Use Playwright for browser automation
  - _Requirements: 1.1, 4.1, 8.1_

- [ ]* 20.4 Perform manual testing
  - Test on Chrome, Firefox, Safari
  - Test on desktop and mobile devices
  - Test with real Coinbase sandbox account
  - Verify all features work end-to-end
  - _Requirements: 9.1, 9.2, 9.3_

- [ ]* 21. Deployment and Launch (Optional)
- [ ]* 21.1 Deploy backend to Railway
  - Create Railway project and connect GitHub repo
  - Configure environment variables in Railway dashboard (DB credentials, JWT_SECRET, ENCRYPTION_KEY, FRONTEND_URL)
  - Set start command: `npm start` and build command: `cd backend && npm install && npm run build`
  - Verify WebSocket support is enabled (Railway supports WebSockets by default)
  - Test deployed backend with Postman or curl
  - Verify database connection and migrations
  - _Requirements: 15.1_

- [ ]* 21.2 Deploy frontend to Vercel
  - Create Vercel project and connect GitHub repo
  - Configure build settings (build command: `cd frontend && npm install && npm run build`, output directory: `frontend/dist`)
  - Add environment variables (VITE_API_URL, VITE_WS_URL pointing to Railway backend)
  - Test deployed frontend
  - Verify authentication flow works with production backend
  - _Requirements: 15.1_

- [ ]* 21.3 Configure custom domain (optional)
  - Add custom domain in Vercel/Railway dashboard
  - Update CORS settings in backend with new domain
  - Update environment variables with production URLs
  - Update cookie domain settings for cross-domain authentication
  - Test with custom domain
  - _Requirements: 12.4, 12.6_

- [ ]* 21.4 Set up monitoring (optional)
  - Configure error tracking (Sentry or similar)
  - Set up uptime monitoring (UptimeRobot or similar)
  - Configure log aggregation (Railway logs)
  - Set up alerts for critical errors
  - Monitor WebSocket connection health
  - _Requirements: 13.4_

- [ ]* 22. Final Polish and Demo Preparation (Optional)
- [ ]* 22.1 UI/UX polish
  - Review all components and add smooth animations with Framer Motion
  - Refine color scheme and typography for consistency
  - Add hover states and micro-interactions to buttons and cards
  - Ensure consistent spacing and alignment across all pages
  - Test dark mode appearance and ensure all colors are readable
  - Add loading skeletons for better perceived performance
  - Polish error messages and empty states
  - _Requirements: 9.5_

- [ ]* 22.2 Create demo video
  - Record 3-minute demo video showing:
    - Real-time heatmap with live price updates
    - Order placement and execution flow
    - Portfolio tracking with real-time valuations
    - AI insights generation and alerts
    - Settings page with Coinbase API integration
  - Add voiceover narration explaining features
  - Edit and upload to YouTube/Vimeo
  - Add to README.md
  - _Requirements: 1.1, 4.1, 7.1_

- [ ]* 22.3 Prepare submission materials
  - Take high-quality screenshots of key features (heatmap, trading, portfolio, insights, alerts)
  - Write compelling project description highlighting real-time data, AI insights, and Coinbase integration
  - Prepare tagline: "AI-Powered Cryptocurrency Trading Dashboard with Real-Time Market Data"
  - Verify GitHub repository is public
  - Ensure .kiro directory is NOT in .gitignore (already configured)
  - Update README.md with setup instructions and screenshots
  - _Requirements: 15.1_

- [ ]* 22.4 Write blog post (optional)
  - Write dev.to or Medium blog post about building Spectra
  - Include technical challenges: WebSocket management, real-time state updates, Coinbase API integration
  - Highlight architecture decisions: Zustand for state, Recharts for visualization, PostgreSQL for persistence
  - Add screenshots and code snippets
  - Discuss AI insights generation and technical indicators
  - _Requirements: 7.1_

---

## Implementation Roadmap

The tasks are organized in a logical sequence to build the application incrementally:

**Phase 1: Foundation (Tasks 1-3) ✅ COMPLETE**
- Project setup, authentication, Coinbase integration
- WebSocket infrastructure for real-time data
- Database migrations for all entities

**Phase 2: Technical Analysis Engine (Tasks 4) ✅ COMPLETE**
- Technical indicator calculations (RSI, SMA, volatility, volume)
- Insights generation system with whale detection
- Market data history API

**Phase 3: Frontend Real-Time Integration (Tasks 5-6) ✅ COMPLETE**
- Zustand stores for market, portfolio, and alerts
- WebSocket hook for real-time updates
- InvestingView with live data and CoinDetailModal

**Phase 4: Trading Functionality (Tasks 7) ✅ COMPLETE**
- TradingView with real-time data and order form
- Order submission flow with Coinbase API
- Order confirmation modal and status tracking

**Phase 5: Portfolio & Alerts (Tasks 8-9) 🔄 IN PROGRESS**
- Update PortfolioView with real-time valuations and API
- Implement smart alerts system with monitoring
- Build alert notifications with browser notifications

**Phase 6: Trade History (Tasks 10) 🔄 IN PROGRESS**
- Update HistoryView with real trade data
- Add filtering, search, and CSV export
- Create trade history API with pagination

**Phase 7: Polish & Optimization (Tasks 11-17)**
- Paper trading mode (deferred)
- Charts and visualizations
- Responsive design and mobile optimization
- Error handling and user feedback
- Security hardening

**Phase 8: Optional Enhancements (Tasks 18-22)**
- Documentation and developer experience
- Kiro integration (hooks, MCP, steering)
- Testing and quality assurance
- Deployment and launch preparation

**Note:** Tasks marked with `*` are optional and can be skipped for MVP. Tasks marked with `[x]` are already completed.
