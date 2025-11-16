# Implementation Plan

- [-] 1. Project Setup and Configuration
  - Initialize monorepo structure with frontend and backend directories
  - Configure TypeScript for both frontend (React) and backend (Node.js)
  - Set up TailwindCSS with custom design system (colors, typography, spacing)
  - Configure Vite for frontend with environment variable support
  - Create .env.example files with all required variables documented
  - Set up ESLint and Prettier for code consistency
  - Initialize Git repository with proper .gitignore (exclude .env, include .kiro)
  - _Requirements: 15.1_

- [ ] 2. Backend Foundation and Coinbase Integration
- [ ] 2.1 Set up Express server with TypeScript
  - Create Express app with CORS middleware configured for frontend URL
  - Implement health check endpoint (/health) with service status checks
  - Set up error handling middleware for consistent error responses
  - Configure Winston logger with file and console transports
  - _Requirements: 15.1, 12.4_

- [ ] 2.2 Implement Coinbase REST API client
  - Create CoinbaseClient class with HMAC SHA256 authentication
  - Implement generateSignature function for API request signing
  - Add methods: getAccounts(), getProducts(), placeOrder(), getOrder(), cancelOrder()
  - Implement request retry logic (3 attempts with exponential backoff)
  - Add rate limiting tracking to prevent API quota exhaustion
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 12.2_

- [ ] 2.3 Implement WebSocket connection to Coinbase
  - Create WebSocketManager class with connection lifecycle management
  - Implement exponential backoff reconnection (1s, 2s, 4s... up to 60s max)
  - Add subscribe() method for ticker and level2 channels
  - Implement message parsing and normalization to internal TickerMessage format
  - Add connection status tracking (connected/disconnected/reconnecting)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 13.3_

- [ ] 3. Backend WebSocket Server for Frontend Communication
- [ ] 3.1 Create WebSocket server for frontend clients
  - Set up ws library WebSocket server on separate port (3002)
  - Implement client connection handling with connection tracking
  - Create message broadcasting function to send updates to all connected clients
  - Add heartbeat mechanism (30s interval) to detect dead connections
  - _Requirements: 2.2, 11.1_

- [ ] 3.2 Implement market data relay
  - Subscribe to Coinbase WebSocket for top 30 cryptocurrency pairs
  - Batch incoming messages using requestAnimationFrame-style timing
  - Throttle broadcasts to frontend clients (60fps max)
  - Normalize and enrich data before broadcasting (add timestamps, format numbers)
  - _Requirements: 2.2, 2.4, 11.1, 11.2_

- [ ] 4. AI Analysis Engine
- [ ] 4.1 Implement technical indicator calculations
  - Create calculateRSI() function with 14-period default
  - Create calculateSMA() function with configurable period
  - Create detectSMACrossover() to identify golden/death crosses
  - Create calculateVolatility() using standard deviation formula
  - Create analyzeVolume() to compare current vs 7-day average
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 4.2 Implement whale detection
  - Parse level2 order book data from Coinbase WebSocket
  - Calculate average order size over rolling window
  - Detect orders exceeding 10x average size
  - Generate whale alert events
  - _Requirements: 6.5_

- [ ] 4.3 Build insights generation system
  - Create generateInsights() function that analyzes all indicators
  - Implement insight prioritization algorithm (confidence scoring)
  - Generate natural language summaries for each insight
  - Implement 60-second caching for insights per symbol
  - Create insights API endpoint (GET /api/insights/:symbol)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 11.2_

- [ ] 5. Frontend Foundation and State Management
- [ ] 5.1 Set up React app with routing
  - Create React app with Vite and TypeScript
  - Set up React Router with routes: /, /trading, /portfolio, /insights, /alerts, /history
  - Create Layout component with Header and Sidebar
  - Implement theme toggle (dark/light mode) with localStorage persistence
  - _Requirements: 9.5, 14.1_

- [ ] 5.2 Create Zustand stores
  - Create marketStore for cryptocurrency data with updateBatch() method
  - Create portfolioStore for holdings and valuations
  - Create alertsStore for alert management
  - Create uiStore for theme, view mode, selected coin
  - Add TypeScript interfaces for all store states
  - _Requirements: 3.1, 3.2, 14.2, 14.4_

- [ ] 5.3 Implement WebSocket hook for frontend
  - Create useWebSocket custom hook with connection management
  - Implement automatic reconnection on connection loss
  - Add message handler registration system
  - Update marketStore when ticker messages arrive
  - Display connection status indicator in Header
  - _Requirements: 2.2, 13.3_

- [ ] 6. Heatmap Visualization
- [ ] 6.1 Build HeatmapGrid component
  - Create responsive grid layout using CSS Grid
  - Implement color calculation based on 24h change (-10% to +10% range)
  - Add smooth color transitions using CSS transitions
  - Implement click handler to open CoinDetailModal
  - Optimize rendering with React.memo
  - _Requirements: 1.1, 1.3, 9.1, 9.2, 11.1_

- [ ] 6.2 Build CoinCell component
  - Display symbol, name, price, 24h change, volume, market cap
  - Format numbers with appropriate precision (2 decimals for price, K/M/B for large numbers)
  - Implement pulse animation on price updates (green for up, red for down)
  - Add hover effects for better UX
  - Use monospace font for numerical values
  - _Requirements: 1.4, 9.3_

- [ ] 6.3 Implement ViewModeSelector
  - Create toggle buttons for: 24h Change, Volume, Volatility, Market Cap
  - Update uiStore when view mode changes
  - Reorganize heatmap cells based on selected metric
  - Add visual indicator for active view mode
  - _Requirements: 1.5_

- [ ] 6.4 Create CoinDetailModal
  - Display detailed cryptocurrency information
  - Show price chart (line chart for MVP, candlestick optional)
  - Display technical indicators (RSI, volatility, volume)
  - Add "Trade" button to navigate to trading interface
  - Implement modal close on ESC key and backdrop click
  - _Requirements: 1.1, 9.3_

- [ ] 7. Trading Interface
- [ ] 7.1 Build OrderForm component
  - Create form with fields: order type (market/limit), side (buy/sell), amount, limit price
  - Implement real-time balance display
  - Add input validation: positive amounts, minimum $10, sufficient balance
  - Calculate and display estimated fees (assume 0.5% for MVP)
  - Show total cost/proceeds calculation
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 7.2 Implement order submission flow
  - Create placeOrder API endpoint (POST /api/orders)
  - Validate order on backend (amount, balance, minimum size)
  - Call Coinbase API to place order
  - Return order ID and status to frontend
  - Update portfolioStore with pending order
  - _Requirements: 4.4, 4.5, 12.3_

- [ ] 7.3 Build OrderConfirmation modal
  - Display order summary: symbol, type, amount, price, fees, total
  - Show "Confirm" and "Cancel" buttons
  - Disable confirm button during submission
  - Show loading spinner while order is being placed
  - Display success/error message after submission
  - _Requirements: 4.4, 4.5_

- [ ] 7.4 Implement order status tracking
  - Create getOrderStatus API endpoint (GET /api/orders/:orderId)
  - Poll order status every 2 seconds until filled or cancelled
  - Update UI with real-time status (pending → open → filled)
  - Update portfolioStore when order is filled
  - _Requirements: 4.5_

- [ ]\* 7.5 Add order placement tests
  - Write unit tests for order validation logic
  - Write integration tests for order submission flow
  - Test error handling for insufficient balance, invalid amounts
  - _Requirements: 4.2, 4.3_

- [ ] 8. Portfolio Management
- [ ] 8.1 Build PortfolioSummary component
  - Display total portfolio value with real-time updates
  - Show 24h P&L in USD and percentage
  - Display available cash balance
  - Add visual indicators (green for profit, red for loss)
  - _Requirements: 3.1, 3.5_

- [ ] 8.2 Build HoldingsList component
  - Create table with columns: Symbol, Quantity, Avg Buy Price, Current Price, Value, P&L, P&L%
  - Format numbers with appropriate precision
  - Color-code P&L values (green/red)
  - Add sorting by column headers
  - _Requirements: 3.2_

- [ ] 8.3 Build AllocationChart component
  - Create pie chart using Recharts showing portfolio allocation
  - Display percentage for each holding
  - Use consistent color scheme
  - Add legend with symbol names
  - _Requirements: 3.3_

- [ ] 8.4 Build PortfolioChart component
  - Create line chart showing historical portfolio value
  - Add time range selector (7d, 30d)
  - Fetch historical data from backend API
  - Display tooltips on hover with date and value
  - _Requirements: 3.4_

- [ ] 8.5 Implement portfolio data persistence
  - Create portfolio API endpoints: GET /api/portfolio, GET /api/portfolio/history
  - Store holdings in database or in-memory store
  - Calculate portfolio value based on current prices
  - Update portfolio when orders are filled
  - _Requirements: 3.1, 3.2, 14.5_

- [ ]\* 8.6 Add portfolio calculation tests
  - Write unit tests for P&L calculations
  - Test portfolio valuation with multiple holdings
  - Test edge cases (zero holdings, negative P&L)
  - _Requirements: 3.1, 3.2_

- [ ] 9. AI Insights Dashboard
- [ ] 9.1 Build InsightCard component
  - Display insight summary text
  - Show signal type badge (bullish/bearish/neutral) with color coding
  - Display confidence score as percentage or progress bar
  - Show relevant indicator values (RSI, volume change, etc.)
  - Add click handler to show detailed analysis
  - _Requirements: 7.2, 7.3, 7.4_

- [ ] 9.2 Build InsightsDashboard component
  - Fetch insights from API (GET /api/insights)
  - Display 3-5 top insights sorted by confidence
  - Implement auto-refresh every 30 seconds
  - Show loading state while fetching
  - Handle empty state (no significant insights)
  - _Requirements: 7.1, 7.5_

- [ ] 9.3 Build MetricsDisplay component
  - Create cards for each metric: RSI, Volatility, Volume, SMA
  - Display current values with visual indicators
  - Color-code based on thresholds (RSI >70 red, <30 green)
  - Show trend arrows (up/down/neutral)
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 9.4 Implement insight detail view
  - Create modal or expanded view for detailed insight analysis
  - Show historical chart of relevant indicator
  - Display explanation of the signal
  - Show related cryptocurrencies with similar signals
  - _Requirements: 7.5_

- [ ] 10. Smart Alerts System
- [ ] 10.1 Build CreateAlert component
  - Create form with fields: symbol, alert type, condition, threshold
  - Support alert types: price above/below, RSI overbought/oversold, volume spike, SMA crossover
  - Validate inputs (positive thresholds, valid ranges)
  - Submit to backend API (POST /api/alerts)
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 10.2 Build AlertsList component
  - Display active alerts in a list or table
  - Show: symbol, type, condition, status (active/triggered/snoozed)
  - Add "Delete" button for each alert
  - Add "Snooze" button for triggered alerts
  - Filter by status (active/triggered/all)
  - _Requirements: 8.5_

- [ ] 10.3 Implement alert monitoring service
  - Create AlertService that monitors market data and indicators
  - Check alert conditions on every market update
  - Trigger alerts when conditions are met
  - Update alert status in database
  - Send notifications to frontend via WebSocket
  - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [ ] 10.4 Build AlertNotification component
  - Create toast notification component
  - Display alert message with symbol and condition
  - Add "Dismiss" and "View" buttons
  - Implement browser notification API for background alerts
  - Request notification permission on first alert creation
  - _Requirements: 8.5_

- [ ] 10.5 Implement alert persistence
  - Create alerts API endpoints: GET /api/alerts, POST /api/alerts, DELETE /api/alerts/:id
  - Store alerts in database with user association
  - Load active alerts on app initialization
  - _Requirements: 14.3_

- [ ]\* 10.6 Add alert system tests
  - Write unit tests for alert condition checking
  - Test alert triggering logic
  - Test notification delivery
  - _Requirements: 8.2, 8.3, 8.4_

- [ ] 11. Trade History
- [ ] 11.1 Build TradeHistoryTable component
  - Create table with columns: Date, Symbol, Type, Amount, Price, Fees, Total
  - Implement pagination (20 trades per page)
  - Format dates and numbers appropriately
  - Add sorting by column headers
  - _Requirements: 5.1, 5.2_

- [ ] 11.2 Implement trade filtering
  - Add filter controls: symbol dropdown, date range picker, type (buy/sell), status
  - Update table when filters change
  - Show active filter badges
  - Add "Clear filters" button
  - _Requirements: 5.2_

- [ ] 11.3 Implement trade search
  - Add search input for trade ID or symbol
  - Filter trades as user types
  - Highlight matching text in results
  - _Requirements: 5.4_

- [ ] 11.4 Implement CSV export
  - Add "Export" button above table
  - Generate CSV with all filtered trades
  - Include headers: Date, Symbol, Type, Amount, Price, Fees, Total
  - Trigger browser download
  - _Requirements: 5.5_

- [ ] 11.5 Create trade history API
  - Create endpoint: GET /api/trades with query params for filtering
  - Support pagination with limit and offset
  - Support sorting by date, amount, P&L
  - Return total count for pagination
  - _Requirements: 5.1, 5.2, 5.3, 14.5_

- [ ] 12. Paper Trading Mode
- [ ] 12.1 Implement paper trading toggle
  - Add toggle switch in Header or Settings
  - Store preference in uiStore and localStorage
  - Display clear indicator when paper trading is active
  - Show confirmation modal when switching modes
  - _Requirements: 10.4, 10.5_

- [ ] 12.2 Implement virtual balance management
  - Initialize virtual balance ($10,000) when paper trading is enabled
  - Track virtual holdings separately from real holdings
  - Update virtual balance on paper trades
  - Persist virtual portfolio in localStorage
  - _Requirements: 10.1, 10.3_

- [ ] 12.3 Implement paper order execution
  - Intercept order submissions when paper trading is active
  - Execute orders against real market prices without calling Coinbase API
  - Simulate order fills with realistic delays (1-2 seconds)
  - Update virtual portfolio with executed trades
  - _Requirements: 10.2, 10.3_

- [ ] 13. Charts and Visualizations
- [ ] 13.1 Build PriceChart component
  - Create line chart using Recharts for price history
  - Support time ranges: 1h, 24h, 7d, 30d
  - Display tooltips with price and timestamp on hover
  - Add zoom and pan functionality (optional)
  - _Requirements: 1.1_

- [ ]\* 13.2 Implement candlestick chart (optional)
  - Create candlestick chart for detailed price action
  - Show OHLC (Open, High, Low, Close) data
  - Color-code candles (green for up, red for down)
  - _Requirements: 1.1_

- [ ] 14. Responsive Design and Mobile Optimization
- [ ] 14.1 Implement responsive layouts
  - Add breakpoint-based layouts using Tailwind responsive classes
  - Convert heatmap grid to vertical list on mobile (<768px)
  - Stack portfolio cards vertically on mobile
  - Make tables horizontally scrollable on mobile
  - _Requirements: 9.1, 9.2_

- [ ] 14.2 Optimize touch interactions
  - Increase touch target sizes to minimum 44px
  - Add touch-friendly swipe gestures for navigation
  - Implement pull-to-refresh for market data
  - Test on iOS and Android devices
  - _Requirements: 9.3_

- [ ] 14.3 Optimize mobile performance
  - Reduce initial bundle size with code splitting
  - Lazy load non-critical components
  - Optimize images and assets
  - Test on 4G connection (target: <3s load time)
  - _Requirements: 9.4_

- [ ] 15. Error Handling and User Feedback
- [ ] 15.1 Implement error boundary
  - Create ErrorBoundary component to catch React errors
  - Display user-friendly error message
  - Add "Reload" button to recover
  - Log errors to console for debugging
  - _Requirements: 13.1_

- [ ] 15.2 Add loading states
  - Create LoadingSpinner component
  - Show loading states for: initial data load, order submission, API calls
  - Add skeleton screens for heatmap and portfolio
  - _Requirements: 13.1_

- [ ] 15.3 Implement toast notifications
  - Create Toast component for success/error/info messages
  - Show toasts for: order success, order failure, connection lost, connection restored
  - Auto-dismiss after 5 seconds with manual dismiss option
  - _Requirements: 13.1_

- [ ] 15.4 Add empty states
  - Create EmptyState component
  - Show empty states for: no holdings, no trades, no alerts, no insights
  - Include helpful text and call-to-action buttons
  - _Requirements: 13.1_

- [ ] 16. Keyboard Shortcuts and Accessibility
- [ ] 16.1 Implement keyboard shortcuts
  - Add shortcuts: "/" for search, "b" for buy, "s" for sell, "ESC" to close modals
  - Display keyboard shortcuts help modal (triggered by "?")
  - Ensure all interactive elements are keyboard accessible
  - _Requirements: 9.3_

- [ ]\* 16.2 Improve accessibility
  - Add ARIA labels to all interactive elements
  - Ensure proper heading hierarchy
  - Add alt text to images and icons
  - Test with screen reader
  - Ensure color contrast meets WCAG AA standards
  - _Requirements: 9.3_

- [ ] 17. Performance Monitoring and Optimization
- [ ] 17.1 Implement performance monitoring
  - Add performance.mark() calls for key operations
  - Measure WebSocket message latency
  - Track component render times
  - Log performance metrics to console in development
  - _Requirements: 11.1, 11.4_

- [ ] 17.2 Optimize bundle size
  - Analyze bundle with Vite build analyzer
  - Implement code splitting for routes
  - Lazy load heavy components (charts, modals)
  - Tree-shake unused dependencies
  - _Requirements: 9.4_

- [ ] 17.3 Implement caching strategies
  - Cache API responses with appropriate TTL
  - Use React Query or SWR for data fetching (optional)
  - Implement service worker for offline support (optional)
  - _Requirements: 11.2_

- [ ] 18. Security Hardening
- [ ] 18.1 Implement input sanitization
  - Sanitize all user inputs before processing
  - Validate data types and ranges on backend
  - Prevent SQL injection (if using SQL database)
  - Prevent XSS attacks in user-generated content
  - _Requirements: 12.5_

- [ ] 18.2 Add rate limiting
  - Implement rate limiting middleware on backend
  - Limit: 100 requests per 15 minutes per IP
  - Return 429 status with retry-after header
  - _Requirements: 12.3_

- [ ] 18.3 Secure WebSocket connections
  - Implement WebSocket authentication (token-based)
  - Validate origin header to prevent CSRF
  - Limit connections per IP (5 max)
  - _Requirements: 12.4_

- [ ] 19. Documentation and Developer Experience
- [ ]\* 19.1 Write API documentation
  - Document all REST endpoints in docs/API.md
  - Include request/response examples
  - Document error codes and messages
  - Add authentication instructions
  - _Requirements: 15.1_

- [ ]\* 19.2 Create setup guide
  - Write comprehensive SETUP.md with step-by-step instructions
  - Document Coinbase API setup process
  - List all environment variables with descriptions
  - Add troubleshooting section
  - _Requirements: 15.1_

- [ ]\* 19.3 Write README
  - Create compelling README.md with project overview
  - Add screenshots of key features
  - Include tech stack and architecture diagram
  - Document Kiro usage (Agent Hooks, MCP, Steering Docs)
  - Add installation and usage instructions
  - _Requirements: 15.1_

- [ ] 20. Kiro Integration
- [ ] 20.1 Create Agent Hooks
  - Create market-change.hook.ts: Trigger on >5% price move in 15 min, recalculate insights
  - Create docs-update.hook.ts: Auto-update API docs when endpoints change
  - Create test-gen.hook.ts: Generate tests for new utility functions
  - Test hooks by triggering conditions
  - _Requirements: 7.5_

- [ ] 20.2 Configure MCP integrations
  - Create .kiro/mcp/coinbase-ws.mcp.json for WebSocket management
  - Create .kiro/mcp/coinbase-api.mcp.json for REST API integration
  - Test MCP configurations
  - _Requirements: 15.1_

- [ ] 20.3 Create Steering Documents
  - Create .kiro/steering/trading-rules.md with risk management rules
  - Create .kiro/steering/code-style.md with TypeScript conventions
  - Create .kiro/steering/ai-insights.md with indicator documentation
  - Create .kiro/steering/deployment.md with deployment process
  - _Requirements: 12.1_

- [ ] 21. Testing and Quality Assurance
- [ ]\* 21.1 Write unit tests
  - Test AI calculation functions (RSI, SMA, volatility)
  - Test order validation logic
  - Test data formatters and validators
  - Target: 80% code coverage
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]\* 21.2 Write integration tests
  - Test order placement flow end-to-end
  - Test WebSocket message flow
  - Test API authentication
  - Test error handling scenarios
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]\* 21.3 Write E2E tests
  - Test market monitoring flow (open app → view heatmap → click coin)
  - Test trading flow (select coin → place order → confirm → verify portfolio)
  - Test alert flow (create alert → trigger → receive notification)
  - Use Playwright for browser automation
  - _Requirements: 1.1, 4.1, 8.1_

- [ ]\* 21.4 Perform manual testing
  - Test on Chrome, Firefox, Safari
  - Test on desktop and mobile devices
  - Test with real Coinbase sandbox account
  - Verify all features work end-to-end
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 22. Deployment and Launch
- [ ] 22.1 Deploy backend to Railway
  - Create Railway project and connect GitHub repo
  - Configure environment variables
  - Set start command and build command
  - Verify WebSocket support is enabled
  - Test deployed backend with Postman
  - _Requirements: 15.1_

- [ ] 22.2 Deploy frontend to Vercel
  - Create Vercel project and connect GitHub repo
  - Configure build settings (build command, output directory)
  - Add environment variables (backend URLs)
  - Test deployed frontend
  - _Requirements: 15.1_

- [ ] 22.3 Configure custom domain (optional)
  - Add custom domain in Vercel/Railway
  - Update CORS settings with new domain
  - Update environment variables
  - Test with custom domain
  - _Requirements: 12.4_

- [ ] 22.4 Set up monitoring
  - Configure error tracking (Sentry or similar)
  - Set up uptime monitoring
  - Configure log aggregation
  - Set up alerts for critical errors
  - _Requirements: 13.4_

- [ ] 23. Final Polish and Demo Preparation
- [ ] 23.1 UI/UX polish
  - Add smooth animations with Framer Motion
  - Refine color scheme and typography
  - Add hover states and micro-interactions
  - Ensure consistent spacing and alignment
  - _Requirements: 9.5_

- [ ] 23.2 Create demo video
  - Record 3-minute demo video showing:
    - Real-time heatmap with live updates
    - Order placement and execution
    - AI insights generation
    - Kiro features (Agent Hooks, MCP, Steering Docs)
  - Add voiceover narration
  - Upload to YouTube/Vimeo
  - _Requirements: 1.1, 4.1, 7.1_

- [ ] 23.3 Prepare submission materials
  - Take screenshots of key features
  - Write compelling project description for Devpost
  - Prepare tagline and project summary
  - Verify GitHub repository is public
  - Ensure .kiro directory is NOT in .gitignore
  - _Requirements: 15.1_

- [ ]\* 23.4 Write blog post (optional)
  - Write dev.to blog post about building Spectra
  - Include technical challenges and solutions
  - Highlight Kiro usage and benefits
  - Add screenshots and code snippets
  - _Requirements: 7.1_
