# Implementation Plan

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

- [ ] 2. Backend Foundation and Coinbase Integration
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

- [x] 2.3 Implement WebSocket connection to Coinbase
  - Create backend/src/services/WebSocketManager.ts with connection lifecycle management
  - Implement exponential backoff reconnection (1s, 2s, 4s... up to 60s max)
  - Add subscribe() method for ticker and level2 channels
  - Implement message parsing and normalization to internal TickerMessage format
  - Add connection status tracking (connected/disconnected/reconnecting)
  - Create backend/src/types/websocket.ts for message type definitions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 13.3_

- [ ] 3. Backend WebSocket Server for Frontend Communication
- [ ] 3.1 Create WebSocket server for frontend clients
  - Create backend/src/services/FrontendWebSocketServer.ts
  - Set up ws library WebSocket server on separate port (3002)
  - Implement client connection handling with connection tracking
  - Create message broadcasting function to send updates to all connected clients
  - Add heartbeat mechanism (30s interval) to detect dead connections
  - Update backend/src/index.ts to initialize WebSocket server
  - _Requirements: 2.2, 11.1_

- [ ] 3.2 Implement market data relay
  - Create backend/src/services/MarketDataRelay.ts
  - Subscribe to Coinbase WebSocket for top 30 cryptocurrency pairs (BTC, ETH, SOL, etc.)
  - Batch incoming messages using setInterval-based timing
  - Throttle broadcasts to frontend clients (60fps max)
  - Normalize and enrich data before broadcasting (add timestamps, format numbers)
  - Wire up MarketDataRelay in backend/src/index.ts
  - _Requirements: 2.2, 2.4, 11.1, 11.2_

- [ ] 4. AI Analysis Engine
- [ ] 4.1 Implement technical indicator calculations
  - Create backend/src/services/TechnicalIndicators.ts
  - Implement calculateRSI() function with 14-period default
  - Implement calculateSMA() function with configurable period
  - Implement detectSMACrossover() to identify golden/death crosses
  - Implement calculateVolatility() using standard deviation formula
  - Implement analyzeVolume() to compare current vs 7-day average
  - Create backend/src/types/indicators.ts for type definitions
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 4.2 Implement whale detection
  - Create backend/src/services/WhaleDetector.ts
  - Parse level2 order book data from Coinbase WebSocket
  - Calculate average order size over rolling window
  - Detect orders exceeding 10x average size
  - Generate whale alert events
  - _Requirements: 6.5_

- [ ] 4.3 Build insights generation system
  - Create backend/src/services/AIEngine.ts
  - Implement generateInsights() function that analyzes all indicators
  - Implement insight prioritization algorithm (confidence scoring)
  - Generate natural language summaries for each insight
  - Implement 60-second caching for insights per symbol using Map
  - Create insights API endpoint (GET /api/insights/:symbol) in backend/src/routes/insights.ts
  - Wire up insights routes in backend/src/index.ts
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 11.2_

- [ ] 5. Frontend Foundation and State Management
- [x] 5.1 Set up React app with routing
  - Create React app with Vite and TypeScript
  - Set up React Router with routes: /, /login, /signup, /dashboard
  - Create basic Dashboard page structure
  - Landing page with navigation already implemented
  - _Requirements: 9.5, 14.1_

- [ ] 5.1a Build Dashboard Layout and Navigation (Robinhood-style)
  - Create frontend/src/components/layout/DashboardLayout.tsx with Header and main content area
  - Create Header with logo, search bar, account menu, theme toggle, connection status
  - Create horizontal tab navigation (similar to Robinhood): Investing, Trading, Portfolio, Insights, Alerts, History
  - Implement theme toggle (dark/light mode) with localStorage persistence
  - Add responsive mobile navigation (bottom tab bar on mobile)
  - Create route structure: /dashboard (default to Investing/Heatmap), /dashboard/trading, /dashboard/portfolio, /dashboard/insights, /dashboard/alerts, /dashboard/history
  - Update Login/Signup pages to redirect to /dashboard on button click
  - _Requirements: 9.5, 14.1_

- [ ] 5.2 Create Zustand stores
  - Create frontend/src/stores/marketStore.ts for cryptocurrency data with updateBatch() method
  - Create frontend/src/stores/portfolioStore.ts for holdings and valuations
  - Create frontend/src/stores/alertsStore.ts for alert management
  - Create frontend/src/stores/uiStore.ts for theme, view mode, selected coin
  - Create frontend/src/types/market.ts and other type definition files
  - _Requirements: 3.1, 3.2, 14.2, 14.4_

- [ ] 5.3 Implement WebSocket hook for frontend
  - Create frontend/src/hooks/useWebSocket.ts custom hook with connection management
  - Implement automatic reconnection on connection loss
  - Add message handler registration system
  - Update marketStore when ticker messages arrive
  - Create frontend/src/components/ConnectionStatus.tsx indicator component
  - Integrate ConnectionStatus in dashboard Header
  - _Requirements: 2.2, 13.3_

- [ ] 6. Heatmap Visualization
- [ ] 6.1 Build HeatmapGrid component
  - Create frontend/src/components/heatmap/HeatmapGrid.tsx
  - Implement responsive grid layout using CSS Grid
  - Implement color calculation based on 24h change (-10% to +10% range)
  - Add smooth color transitions using CSS transitions
  - Implement click handler to open CoinDetailModal
  - Optimize rendering with React.memo
  - Create frontend/src/pages/InvestingView.tsx (default dashboard view) and integrate HeatmapGrid
  - This will be the main "Investing" tab (similar to Robinhood's home screen)
  - _Requirements: 1.1, 1.3, 9.1, 9.2, 11.1_

- [ ] 6.2 Build CoinCell component
  - Create frontend/src/components/heatmap/CoinCell.tsx
  - Display symbol, name, price, 24h change, volume, market cap
  - Create frontend/src/utils/formatters.ts for number formatting (K/M/B suffixes)
  - Implement pulse animation on price updates (green for up, red for down)
  - Add hover effects for better UX
  - Use monospace font for numerical values
  - _Requirements: 1.4, 9.3_

- [ ] 6.3 Implement ViewModeSelector
  - Create frontend/src/components/heatmap/ViewModeSelector.tsx
  - Create toggle buttons for: 24h Change, Volume, Volatility, Market Cap
  - Update uiStore when view mode changes
  - Reorganize heatmap cells based on selected metric
  - Add visual indicator for active view mode
  - _Requirements: 1.5_

- [ ] 6.4 Create CoinDetailModal
  - Create frontend/src/components/modals/CoinDetailModal.tsx
  - Display detailed cryptocurrency information
  - Show price chart (line chart using Recharts)
  - Display technical indicators (RSI, volatility, volume)
  - Add "Trade" button to navigate to trading interface
  - Implement modal close on ESC key and backdrop click
  - _Requirements: 1.1, 9.3_

- [ ] 7. Trading Interface
- [ ] 7.1 Build OrderForm component
  - Create frontend/src/components/trading/OrderForm.tsx
  - Create form with fields: order type (market/limit), side (buy/sell), amount, limit price
  - Implement real-time balance display from portfolioStore
  - Add input validation: positive amounts, minimum $10, sufficient balance
  - Calculate and display estimated fees (assume 0.5% for MVP)
  - Show total cost/proceeds calculation
  - Create frontend/src/pages/TradingView.tsx and integrate OrderForm
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 7.2 Implement order submission flow
  - Create backend/src/routes/orders.ts with placeOrder endpoint (POST /api/orders)
  - Create backend/src/services/OrderService.ts for order logic
  - Validate order on backend (amount, balance, minimum size)
  - Call Coinbase API to place order
  - Return order ID and status to frontend
  - Update portfolioStore with pending order in frontend
  - Wire up orders routes in backend/src/index.ts
  - _Requirements: 4.4, 4.5, 12.3_

- [ ] 7.3 Build OrderConfirmation modal
  - Create frontend/src/components/modals/OrderConfirmation.tsx
  - Display order summary: symbol, type, amount, price, fees, total
  - Show "Confirm" and "Cancel" buttons
  - Disable confirm button during submission
  - Show loading spinner while order is being placed
  - Display success/error message after submission
  - _Requirements: 4.4, 4.5_

- [ ] 7.4 Implement order status tracking
  - Add getOrderStatus endpoint (GET /api/orders/:orderId) in backend/src/routes/orders.ts
  - Create frontend/src/hooks/useOrderStatus.ts hook
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
  - Create frontend/src/components/portfolio/PortfolioSummary.tsx
  - Display total portfolio value with real-time updates from portfolioStore
  - Show 24h P&L in USD and percentage
  - Display available cash balance
  - Add visual indicators (green for profit, red for loss)
  - Create frontend/src/pages/PortfolioView.tsx and integrate PortfolioSummary
  - _Requirements: 3.1, 3.5_

- [ ] 8.2 Build HoldingsList component
  - Create frontend/src/components/portfolio/HoldingsList.tsx
  - Create table with columns: Symbol, Quantity, Avg Buy Price, Current Price, Value, P&L, P&L%
  - Format numbers with appropriate precision using formatters utility
  - Color-code P&L values (green/red)
  - Add sorting by column headers
  - _Requirements: 3.2_

- [ ] 8.3 Build AllocationChart component
  - Create frontend/src/components/portfolio/AllocationChart.tsx
  - Create pie chart using Recharts showing portfolio allocation
  - Display percentage for each holding
  - Use consistent color scheme from Tailwind config
  - Add legend with symbol names
  - _Requirements: 3.3_

- [ ] 8.4 Build PortfolioChart component
  - Create frontend/src/components/portfolio/PortfolioChart.tsx
  - Create line chart using Recharts showing historical portfolio value
  - Add time range selector (7d, 30d)
  - Fetch historical data from backend API
  - Display tooltips on hover with date and value
  - _Requirements: 3.4_

- [ ] 8.5 Implement portfolio data persistence
  - Create backend/src/routes/portfolio.ts with endpoints: GET /api/portfolio, GET /api/portfolio/history
  - Create backend/src/services/PortfolioService.ts
  - Store holdings in in-memory Map (database optional for MVP)
  - Calculate portfolio value based on current prices from market data
  - Update portfolio when orders are filled
  - Wire up portfolio routes in backend/src/index.ts
  - _Requirements: 3.1, 3.2, 14.5_

- [ ]\* 8.6 Add portfolio calculation tests
  - Write unit tests for P&L calculations
  - Test portfolio valuation with multiple holdings
  - Test edge cases (zero holdings, negative P&L)
  - _Requirements: 3.1, 3.2_

- [ ] 9. AI Insights Dashboard
- [ ] 9.1 Build InsightCard component
  - Create frontend/src/components/insights/InsightCard.tsx
  - Display insight summary text
  - Show signal type badge (bullish/bearish/neutral) with color coding
  - Display confidence score as percentage or progress bar
  - Show relevant indicator values (RSI, volume change, etc.)
  - Add click handler to show detailed analysis
  - _Requirements: 7.2, 7.3, 7.4_

- [ ] 9.2 Build InsightsDashboard component
  - Create frontend/src/pages/InsightsView.tsx
  - Fetch insights from API (GET /api/insights)
  - Display 3-5 top insights sorted by confidence
  - Implement auto-refresh every 30 seconds using useEffect
  - Show loading state while fetching
  - Handle empty state (no significant insights)
  - _Requirements: 7.1, 7.5_

- [ ] 9.3 Build MetricsDisplay component
  - Create frontend/src/components/insights/MetricsDisplay.tsx
  - Create cards for each metric: RSI, Volatility, Volume, SMA
  - Display current values with visual indicators
  - Color-code based on thresholds (RSI >70 red, <30 green)
  - Show trend arrows (up/down/neutral)
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 9.4 Implement insight detail view
  - Create frontend/src/components/modals/InsightDetailModal.tsx
  - Show historical chart of relevant indicator using Recharts
  - Display explanation of the signal
  - Show related cryptocurrencies with similar signals
  - _Requirements: 7.5_

- [ ] 10. Smart Alerts System
- [ ] 10.1 Build CreateAlert component
  - Create frontend/src/components/alerts/CreateAlert.tsx
  - Create form with fields: symbol, alert type, condition, threshold
  - Support alert types: price above/below, RSI overbought/oversold, volume spike, SMA crossover
  - Validate inputs (positive thresholds, valid ranges)
  - Submit to backend API (POST /api/alerts)
  - Create frontend/src/pages/AlertsView.tsx and integrate CreateAlert
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 10.2 Build AlertsList component
  - Create frontend/src/components/alerts/AlertsList.tsx
  - Display active alerts in a table
  - Show: symbol, type, condition, status (active/triggered/snoozed)
  - Add "Delete" button for each alert
  - Add "Snooze" button for triggered alerts
  - Filter by status (active/triggered/all)
  - _Requirements: 8.5_

- [ ] 10.3 Implement alert monitoring service
  - Create backend/src/services/AlertService.ts
  - Monitor market data and indicators from MarketDataRelay
  - Check alert conditions on every market update
  - Trigger alerts when conditions are met
  - Update alert status in in-memory store
  - Send notifications to frontend via WebSocket
  - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [ ] 10.4 Build AlertNotification component
  - Create frontend/src/components/alerts/AlertNotification.tsx (toast component)
  - Display alert message with symbol and condition
  - Add "Dismiss" and "View" buttons
  - Implement browser notification API for background alerts
  - Request notification permission on first alert creation
  - _Requirements: 8.5_

- [ ] 10.5 Implement alert persistence
  - Create backend/src/routes/alerts.ts with endpoints: GET /api/alerts, POST /api/alerts, DELETE /api/alerts/:id, PATCH /api/alerts/:id/snooze
  - Store alerts in in-memory Map (database optional for MVP)
  - Load active alerts on app initialization
  - Wire up alerts routes in backend/src/index.ts
  - _Requirements: 14.3_

- [ ]\* 10.6 Add alert system tests
  - Write unit tests for alert condition checking
  - Test alert triggering logic
  - Test notification delivery
  - _Requirements: 8.2, 8.3, 8.4_

- [ ] 11. Trade History
- [ ] 11.1 Build TradeHistoryTable component
  - Create frontend/src/components/history/TradeHistoryTable.tsx
  - Create table with columns: Date, Symbol, Type, Amount, Price, Fees, Total
  - Implement pagination (20 trades per page)
  - Format dates and numbers appropriately using formatters utility
  - Add sorting by column headers
  - Create frontend/src/pages/HistoryView.tsx and integrate TradeHistoryTable
  - _Requirements: 5.1, 5.2_

- [ ] 11.2 Implement trade filtering
  - Create frontend/src/components/history/TradeFilters.tsx
  - Add filter controls: symbol dropdown, date range picker, type (buy/sell), status
  - Update table when filters change
  - Show active filter badges
  - Add "Clear filters" button
  - _Requirements: 5.2_

- [ ] 11.3 Implement trade search
  - Add search input in TradeFilters component for trade ID or symbol
  - Filter trades as user types
  - Highlight matching text in results
  - _Requirements: 5.4_

- [ ] 11.4 Implement CSV export
  - Create frontend/src/utils/csvExport.ts utility
  - Add "Export" button in HistoryView
  - Generate CSV with all filtered trades
  - Include headers: Date, Symbol, Type, Amount, Price, Fees, Total
  - Trigger browser download
  - _Requirements: 5.5_

- [ ] 11.5 Create trade history API
  - Create backend/src/routes/trades.ts with endpoint: GET /api/trades
  - Support query params for filtering (symbol, dateFrom, dateTo, type, status)
  - Support pagination with limit and offset
  - Support sorting by date, amount, P&L
  - Return total count for pagination
  - Store trades in in-memory array (database optional for MVP)
  - Wire up trades routes in backend/src/index.ts
  - _Requirements: 5.1, 5.2, 5.3, 14.5_

- [ ] 12. Paper Trading Mode
- [ ] 12.1 Implement paper trading toggle
  - Add toggle switch in dashboard Header component
  - Store preference in uiStore and localStorage
  - Display clear indicator badge when paper trading is active
  - Create frontend/src/components/modals/PaperTradingConfirmation.tsx for mode switching
  - _Requirements: 10.4, 10.5_

- [ ] 12.2 Implement virtual balance management
  - Add virtual portfolio state to portfolioStore
  - Initialize virtual balance ($10,000) when paper trading is enabled
  - Track virtual holdings separately from real holdings
  - Update virtual balance on paper trades
  - Persist virtual portfolio in localStorage
  - _Requirements: 10.1, 10.3_

- [ ] 12.3 Implement paper order execution
  - Update OrderService in backend to check paper trading mode
  - Intercept order submissions when paper trading is active
  - Execute orders against real market prices without calling Coinbase API
  - Simulate order fills with realistic delays (1-2 seconds using setTimeout)
  - Update virtual portfolio with executed trades
  - _Requirements: 10.2, 10.3_

- [ ] 13. Charts and Visualizations
- [ ] 13.1 Build PriceChart component
  - Create frontend/src/components/charts/PriceChart.tsx
  - Create line chart using Recharts for price history
  - Support time ranges: 1h, 24h, 7d, 30d with selector buttons
  - Display tooltips with price and timestamp on hover
  - Fetch historical price data from backend API
  - Add zoom and pan functionality (optional)
  - _Requirements: 1.1_

- [ ]\* 13.2 Implement candlestick chart (optional)
  - Create frontend/src/components/charts/CandlestickChart.tsx
  - Create candlestick chart for detailed price action
  - Show OHLC (Open, High, Low, Close) data
  - Color-code candles (green for up, red for down)
  - _Requirements: 1.1_

- [ ] 14. Responsive Design and Mobile Optimization
- [ ] 14.1 Implement responsive layouts
  - Review all components and add Tailwind responsive classes (sm:, md:, lg:, xl:)
  - Convert heatmap grid to vertical list on mobile (<768px)
  - Stack portfolio cards vertically on mobile
  - Make tables horizontally scrollable on mobile with overflow-x-auto
  - Ensure sidebar collapses to hamburger menu on mobile
  - _Requirements: 9.1, 9.2_

- [ ] 14.2 Optimize touch interactions
  - Increase touch target sizes to minimum 44px for all buttons
  - Add touch-friendly swipe gestures for navigation (optional)
  - Implement pull-to-refresh for market data (optional)
  - Test on iOS and Android devices or browser dev tools
  - _Requirements: 9.3_

- [ ] 14.3 Optimize mobile performance
  - Implement code splitting with React.lazy() for routes
  - Lazy load non-critical components (modals, charts)
  - Optimize images and assets (use WebP format)
  - Test on 4G connection throttling (target: <3s load time)
  - _Requirements: 9.4_

- [ ] 15. Error Handling and User Feedback
- [ ] 15.1 Implement error boundary
  - Create frontend/src/components/ErrorBoundary.tsx to catch React errors
  - Display user-friendly error message
  - Add "Reload" button to recover
  - Log errors to console for debugging
  - Wrap App component with ErrorBoundary in main.tsx
  - _Requirements: 13.1_

- [ ] 15.2 Add loading states
  - Create frontend/src/components/LoadingSpinner.tsx component
  - Create frontend/src/components/SkeletonLoader.tsx for skeleton screens
  - Show loading states for: initial data load, order submission, API calls
  - Add skeleton screens for heatmap and portfolio
  - _Requirements: 13.1_

- [ ] 15.3 Implement toast notifications
  - Create frontend/src/components/Toast.tsx component
  - Create frontend/src/hooks/useToast.ts hook for toast management
  - Show toasts for: order success, order failure, connection lost, connection restored
  - Auto-dismiss after 5 seconds with manual dismiss option
  - Position toasts in top-right corner
  - _Requirements: 13.1_

- [ ] 15.4 Add empty states
  - Create frontend/src/components/EmptyState.tsx component
  - Show empty states for: no holdings, no trades, no alerts, no insights
  - Include helpful text and call-to-action buttons
  - _Requirements: 13.1_

- [ ] 16. Keyboard Shortcuts and Accessibility
- [ ] 16.1 Implement keyboard shortcuts
  - Create frontend/src/hooks/useKeyboardShortcuts.ts hook
  - Add shortcuts: "/" for search, "b" for buy, "s" for sell, "ESC" to close modals
  - Create frontend/src/components/modals/KeyboardShortcutsHelp.tsx (triggered by "?")
  - Ensure all interactive elements are keyboard accessible (tab navigation)
  - _Requirements: 9.3_

- [ ]\* 16.2 Improve accessibility
  - Add ARIA labels to all interactive elements
  - Ensure proper heading hierarchy (h1, h2, h3)
  - Add alt text to images and icons
  - Test with screen reader (optional)
  - Ensure color contrast meets WCAG AA standards
  - _Requirements: 9.3_

- [ ] 17. Performance Monitoring and Optimization
- [ ] 17.1 Implement performance monitoring
  - Add performance.mark() and performance.measure() calls for key operations
  - Measure WebSocket message latency in WebSocketManager
  - Track component render times using React DevTools Profiler
  - Log performance metrics to console in development mode
  - _Requirements: 11.1, 11.4_

- [ ] 17.2 Optimize bundle size
  - Run `npm run build` and analyze bundle with vite-plugin-visualizer
  - Implement code splitting for routes using React.lazy()
  - Lazy load heavy components (charts, modals)
  - Review and remove unused dependencies
  - _Requirements: 9.4_

- [ ] 17.3 Implement caching strategies
  - Cache API responses with appropriate TTL in backend services
  - Use browser cache for static assets
  - Implement service worker for offline support (optional)
  - _Requirements: 11.2_

- [ ] 18. Security Hardening
- [ ] 18.1 Implement input sanitization
  - Create backend/src/middleware/validation.ts for input validation
  - Sanitize all user inputs before processing
  - Validate data types and ranges on backend using Joi or Zod
  - Prevent XSS attacks by escaping user-generated content
  - _Requirements: 12.5_

- [ ] 18.2 Add rate limiting
  - Update backend/src/index.ts to use express-rate-limit middleware
  - Configure limit: 100 requests per 15 minutes per IP
  - Return 429 status with retry-after header
  - Apply to all /api routes
  - _Requirements: 12.3_

- [ ] 18.3 Secure WebSocket connections
  - Implement WebSocket authentication (token-based, optional for MVP)
  - Validate origin header in WebSocket server to prevent CSRF
  - Limit connections per IP (5 max) in FrontendWebSocketServer
  - _Requirements: 12.4_

- [ ] 19. Documentation and Developer Experience
- [ ]\* 19.1 Write API documentation
  - Create docs/API.md documenting all REST endpoints
  - Include request/response examples for each endpoint
  - Document error codes and messages
  - Add authentication instructions for Coinbase API
  - _Requirements: 15.1_

- [ ]\* 19.2 Create setup guide
  - Create docs/SETUP.md with step-by-step instructions
  - Document Coinbase API setup process (creating API keys)
  - List all environment variables with descriptions
  - Add troubleshooting section for common issues
  - _Requirements: 15.1_

- [x] 19.3 Write README
  - README.md already exists with project overview
  - Update with screenshots of key features once implemented
  - Tech stack and project structure already documented
  - Add Kiro usage documentation (Agent Hooks, MCP, Steering Docs) when implemented
  - _Requirements: 15.1_

- [ ] 20. Kiro Integration
- [ ] 20.1 Create Agent Hooks
  - Create .kiro/hooks/market-change.hook.ts: Trigger on >5% price move in 15 min, recalculate insights
  - Create .kiro/hooks/docs-update.hook.ts: Auto-update API docs when endpoints change
  - Create .kiro/hooks/test-gen.hook.ts: Generate tests for new utility functions
  - Test hooks by triggering conditions
  - _Requirements: 7.5_

- [ ] 20.2 Configure MCP integrations
  - Create .kiro/settings/mcp.json for MCP server configurations
  - Configure coinbase-ws MCP server for WebSocket management
  - Configure coinbase-api MCP server for REST API integration
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
  - Configure environment variables in Railway dashboard
  - Set start command: `npm start` and build command: `npm run build`
  - Verify WebSocket support is enabled (Railway supports WebSockets by default)
  - Test deployed backend with Postman or curl
  - _Requirements: 15.1_

- [ ] 22.2 Deploy frontend to Vercel
  - Create Vercel project and connect GitHub repo
  - Configure build settings (build command: `npm run build`, output directory: `frontend/dist`)
  - Add environment variables (VITE_BACKEND_API_URL, VITE_BACKEND_WS_URL)
  - Test deployed frontend
  - _Requirements: 15.1_

- [ ] 22.3 Configure custom domain (optional)
  - Add custom domain in Vercel/Railway dashboard
  - Update CORS settings in backend with new domain
  - Update environment variables with production URLs
  - Test with custom domain
  - _Requirements: 12.4_

- [ ] 22.4 Set up monitoring
  - Configure error tracking (Sentry or similar, optional)
  - Set up uptime monitoring (UptimeRobot or similar, optional)
  - Configure log aggregation (Railway logs, optional)
  - Set up alerts for critical errors (optional)
  - _Requirements: 13.4_

- [ ] 23. Final Polish and Demo Preparation
- [ ] 23.1 UI/UX polish
  - Review all components and add smooth animations with Framer Motion
  - Refine color scheme and typography for consistency
  - Add hover states and micro-interactions to buttons and cards
  - Ensure consistent spacing and alignment across all pages
  - Test dark mode appearance
  - _Requirements: 9.5_

- [ ] 23.2 Create demo video
  - Record 3-minute demo video showing:
    - Real-time heatmap with live updates
    - Order placement and execution
    - AI insights generation
    - Kiro features (Agent Hooks, MCP, Steering Docs)
  - Add voiceover narration explaining features
  - Edit and upload to YouTube/Vimeo
  - _Requirements: 1.1, 4.1, 7.1_

- [ ] 23.3 Prepare submission materials
  - Take high-quality screenshots of key features
  - Write compelling project description for Devpost or similar
  - Prepare tagline and project summary
  - Verify GitHub repository is public
  - Ensure .kiro directory is NOT in .gitignore (already configured)
  - _Requirements: 15.1_

- [ ]\* 23.4 Write blog post (optional)
  - Write dev.to or Medium blog post about building Spectra
  - Include technical challenges and solutions
  - Highlight Kiro usage and benefits
  - Add screenshots and code snippets
  - _Requirements: 7.1_
