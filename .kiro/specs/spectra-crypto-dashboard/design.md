# Design Document

## Overview

Spectra is architected as a modern full-stack application with a React TypeScript frontend, Node.js backend, and real-time WebSocket communication. The system follows a layered architecture pattern with clear separation between presentation, business logic, and data access layers. The frontend uses Zustand for state management and implements a component-based architecture for modularity. The backend serves as an API gateway and WebSocket proxy, handling authentication, rate limiting, and AI calculations. Real-time market data flows from Coinbase WebSocket feeds through the backend to the frontend, while REST API calls handle trading operations and historical data retrieval.

## Architecture

### System Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend - React + TypeScript"
        UI[UI Components]
        Store[Zustand Stores]
        Hooks[Custom Hooks]
        Services[Service Layer]
        AuthContext[Auth Context]
    end

    subgraph "Backend - Node.js + Express"
        API[REST API Routes]
        WSServer[WebSocket Server]
        AIEngine[AI Analysis Engine]
        AuthMiddleware[Authentication Middleware]
        AuthService[Auth Service]
        UserService[User Service]
    end

    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL Database)]
        LocalStorage[Browser LocalStorage]
    end

    subgraph "External Services"
        CoinbaseREST[Coinbase REST API]
        CoinbaseWS[Coinbase WebSocket Feed]
    end

    UI --> Hooks
    Hooks --> Store
    Hooks --> Services
    Hooks --> AuthContext
    Services --> API
    Services --> WSServer
    AuthContext --> AuthService

    API --> AuthMiddleware
    AuthMiddleware --> UserService
    UserService --> PostgreSQL
    AuthService --> API
    AuthMiddleware --> CoinbaseREST
    WSServer --> CoinbaseWS
    AIEngine --> Store
    API --> AIEngine
    
    Store --> LocalStorage
    AuthContext --> LocalStorage
```

### Technology Stack Rationale

**Frontend:**

- **React 18+**: Provides concurrent rendering for smooth UI updates during high-frequency market data streams
- **TypeScript**: Ensures type safety across complex data structures (market data, orders, portfolio)
- **Zustand**: Lightweight state management (3KB) with minimal boilerplate, ideal for real-time data updates
- **TailwindCSS**: Utility-first CSS for rapid UI development and consistent design system
- **Recharts**: Declarative charting library with good performance for financial data visualization
- **Framer Motion**: Hardware-accelerated animations for smooth price transitions and UI interactions

**Backend:**

- **Node.js + Express**: Non-blocking I/O ideal for handling multiple WebSocket connections and API requests
- **WebSocket (ws library)**: Native WebSocket support for bidirectional real-time communication
- **Crypto module**: Built-in HMAC SHA256 signing for Coinbase API authentication

**Deployment:**

- **Vercel**: Edge network deployment for frontend with automatic HTTPS and CDN
- **Railway**: Container-based backend hosting with native WebSocket support and auto-scaling

### Data Flow Architecture

**Real-Time Market Data Flow:**

1. Coinbase WebSocket Feed → Backend WebSocket Manager
2. Backend normalizes and batches messages (60fps throttling)
3. Backend broadcasts to connected frontend clients via WebSocket
4. Frontend updates Zustand market store
5. React components re-render with new prices (memoized to prevent unnecessary renders)

**Trading Operation Flow:**

1. User submits order via Trading Interface
2. Frontend validates inputs and shows confirmation modal
3. Frontend sends order to Backend REST API
4. Backend authenticates request with HMAC signature
5. Backend submits order to Coinbase REST API
6. Backend returns order status to frontend
7. Frontend updates Portfolio Store and displays confirmation

**AI Insights Flow:**

1. Backend AI Engine subscribes to market data updates
2. On price updates, AI Engine calculates technical indicators (RSI, SMA, volatility)
3. AI Engine generates insights and caches for 60 seconds
4. Frontend polls insights endpoint every 30 seconds
5. Kiro Agent Hook triggers recalculation on significant market moves (>5% in 15 min)
6. Frontend displays updated insights in dashboard

## Components and Interfaces

### UI Design Philosophy

**Robinhood-Inspired Interface:**

The Spectra System adopts a clean, modern interface inspired by Robinhood's design principles (as implemented in tasks 2.4-2.5):

- **Horizontal Tab Navigation**: Primary navigation uses tabs instead of sidebar for better mobile experience
- **Minimalist Design**: Focus on data and charts with minimal chrome
- **Bold Typography**: Large, readable numbers for prices and values
- **Color-Coded Feedback**: Green for gains/bullish, red for losses/bearish, consistent throughout
- **Dark Mode First**: Optimized for dark mode with high contrast for readability
- **Smooth Animations**: Subtle transitions and micro-interactions for polish

**Navigation Structure:**

- **Header**: Logo, search, account menu, theme toggle, connection status indicator
- **Tab Bar**: Investing (default), Trading, Portfolio, Insights, Alerts, History
- **Mobile**: Bottom tab bar for thumb-friendly navigation on mobile devices
- **Responsive**: Adapts seamlessly from 320px mobile to 1920px desktop (Requirement 9.1)

### Frontend Component Hierarchy

```
App
├── DashboardLayout
│   ├── Header (logo, search, account menu, theme toggle, connection status)
│   ├── TabNavigation (horizontal tabs: Investing, Trading, Portfolio, Insights, Alerts, History)
│   └── MainContent (route-based content area)
├── LandingPage (Hero, Features, CryptoShowcase, AIInsights, CallToAction, Footer)
├── Login (email/password form, redirects to /dashboard)
├── Signup (registration form, redirects to /dashboard)
├── InvestingView (default dashboard view)
│   ├── ViewModeSelector (24h change, volume, volatility, market cap)
│   ├── HeatmapGrid (responsive grid → vertical list on mobile)
│   │   └── CoinCell[] (individual cryptocurrency cells with pulse animations)
│   └── CoinDetailModal (detailed view on click)
├── TradingView
│   ├── OrderForm (buy/sell form with validation)
│   ├── OrderBook (live bids/asks, optional)
│   ├── OrderConfirmation (confirmation modal)
│   └── PriceChart (line chart with time range selector)
├── PortfolioView
│   ├── PortfolioSummary (total value, 24h P&L, available cash)
│   ├── HoldingsList (individual holdings table with sorting)
│   ├── AllocationChart (pie chart)
│   └── PortfolioChart (historical value line chart, 7d/30d)
├── InsightsView
│   ├── InsightsDashboard
│   │   └── InsightCard[] (3-5 prioritized insights with confidence scores)
│   ├── MetricsDisplay (RSI, volatility, volume indicators)
│   └── InsightDetailModal (detailed analysis on click)
├── AlertsView
│   ├── CreateAlert (alert creation form)
│   ├── AlertsList (active/triggered alerts with filters)
│   └── AlertNotification (toast notifications)
├── HistoryView (replaces TradeHistoryView)
│   ├── TradeHistoryTable (paginated/virtual scrolling table)
│   ├── TradeFilters (symbol, date range, type, status)
│   ├── TradeSearch (search by ID or symbol)
│   └── ExportButton (CSV export)
├── Settings
│   ├── CoinbaseCredentialsForm (API key and secret input with ECDSA support)
│   ├── WalletSection (Coinbase account balances, deposit/withdraw info)
│   ├── SecuritySection (Change Password, 2FA)
│   ├── DangerZone (Delete Account)
│   └── DeleteConfirmationModal (Modal for critical actions)
└── Shared Components
    ├── ErrorBoundary (catches React errors)
    ├── LoadingSpinner (loading states)
    ├── SkeletonLoader (skeleton screens)
    ├── Toast (notifications)
    ├── EmptyState (no data states)
    └── PaperTradingIndicator (badge when paper trading is active)
```

### Key Component Interfaces

**CoinCell Component:**

```typescript
interface CoinCellProps {
  symbol: string
  name: string
  price: number
  change24h: number
  volume24h: number
  marketCap: number
  viewMode: 'change' | 'volume' | 'volatility' | 'marketCap'
  onClick: (symbol: string) => void
}
```

**OrderForm Component:**

```typescript
interface OrderFormProps {
  symbol: string
  currentPrice: number
  balance: number
  onSubmit: (order: OrderRequest) => Promise<void>
  onCancel: () => void
}

interface OrderRequest {
  symbol: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit'
  amount: number
  limitPrice?: number
}
```

**InsightCard Component:**

```typescript
interface InsightCardProps {
  insight: MarketInsight
  onClick: (insight: MarketInsight) => void
}

interface MarketInsight {
  id: string
  symbol: string
  signal: 'bullish' | 'bearish' | 'neutral'
  confidence: number // 0-100
  summary: string
  indicators: {
    rsi?: number
    volumeChange?: number
    volatility?: number
    smaSignal?: 'golden_cross' | 'death_cross' | null
  }
  timestamp: number
}
```

**WalletSection Component:**

```typescript
interface WalletSectionProps {
  accounts: CoinbaseAccount[]
  isLoading: boolean
  onRefresh: () => Promise<void>
}

interface CoinbaseAccount {
  uuid: string
  name: string
  currency: string
  availableBalance: number
  hold: number
  type: 'wallet' | 'vault'
}
```

### Backend Service Interfaces

**WebSocket Manager:**

```typescript
interface WebSocketManager {
  connect(): Promise<void>
  disconnect(): void
  subscribe(productIds: string[]): void
  onMessage(handler: (message: TickerMessage) => void): void
  getConnectionStatus(): 'connected' | 'disconnected' | 'reconnecting'
}

interface TickerMessage {
  type: 'ticker'
  productId: string
  price: number
  open24h: number
  volume24h: number
  low24h: number
  high24h: number
  bestBid: number
  bestAsk: number
  timestamp: number
}
```

**AI Engine:**

```typescript
interface AIEngine {
  calculateRSI(prices: number[], period?: number): number
  calculateVolatility(prices: number[]): number
  detectSMACrossover(prices: number[]): 'bullish' | 'bearish' | 'neutral'
  analyzeVolume(current: number, average: number): VolumeAnalysis
  generateInsights(marketData: MarketData[]): MarketInsight[]
}

interface VolumeAnalysis {
  change: number // percentage
  isSignificant: boolean // >150% of average
  trend: 'increasing' | 'decreasing' | 'stable'
}
```

**Coinbase API Client:**

```typescript
interface CoinbaseClient {
  authenticate(apiKey: string, apiSecret: string, signatureType?: 'hmac' | 'ecdsa'): void
  getAccounts(): Promise<Account[]>
  placeOrder(order: OrderRequest): Promise<OrderResponse>
  getOrder(orderId: string): Promise<Order>
  cancelOrder(orderId: string): Promise<void>
  getProducts(): Promise<Product[]>
}

interface Account {
  uuid: string
  name: string
  currency: string
  availableBalance: number
  hold: number
  type: 'wallet' | 'vault'
}

interface OrderResponse {
  orderId: string
  status: 'pending' | 'open' | 'filled' | 'cancelled'
  filledSize: number
  executedValue: number
  fees: number
}
```

**Note on Signature Types:**
- **HMAC SHA256**: Traditional Coinbase API keys (legacy format)
- **ECDSA**: Coinbase Developer Platform (CDP) keys using EC private keys (newer format)
- The system auto-detects signature type based on key format (`BEGIN EC PRIVATE KEY` = ECDSA)

## Data Models

### Database Schema

**PostgreSQL Database: `spectra_dev`**

The system uses PostgreSQL for persistent storage of user data, authentication credentials, and trading history.

**Users Table (`spectra_user_t`):**

```sql
CREATE TABLE spectra_user_t (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email_address VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- bcrypt hashed
  user_coinbase_public VARCHAR(500), -- Encrypted Coinbase API key
  user_coinbase_public_iv VARCHAR(32), -- Initialization vector for encryption
  user_coinbase_public_tag VARCHAR(32), -- Auth tag for encryption
  user_coinbase_secret VARCHAR(500), -- Encrypted Coinbase API secret
  user_coinbase_secret_iv VARCHAR(32),
  user_coinbase_secret_tag VARCHAR(32),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_user_email ON spectra_user_t(email_address);
CREATE INDEX idx_user_username ON spectra_user_t(username);
```

**User Model Interface:**

```typescript
interface User {
  userId: string
  fullName: string
  username: string
  emailAddress: string
  password: string // hashed
  userCoinbasePublic?: string // encrypted
  userCoinbasePublicIv?: string
  userCoinbasePublicTag?: string
  userCoinbaseSecret?: string // encrypted
  userCoinbaseSecretIv?: string
  userCoinbaseSecretTag?: string
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
  isActive: boolean
}

interface UserDTO {
  userId: string
  fullName: string
  username: string
  emailAddress: string
  hasCoinbaseKeys: boolean
  createdAt: Date
  lastLogin?: Date
}
```

**Portfolios Table:**

```sql
CREATE TABLE portfolios (
  portfolio_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES spectra_user_t(user_id) ON DELETE CASCADE,
  total_value DECIMAL(20, 2) NOT NULL DEFAULT 0,
  cash_balance DECIMAL(20, 2) NOT NULL DEFAULT 0,
  change_24h DECIMAL(20, 2) DEFAULT 0,
  change_24h_percent DECIMAL(10, 4) DEFAULT 0,
  is_paper_trading BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_portfolio_user ON portfolios(user_id);
```

**Holdings Table:**

```sql
CREATE TABLE holdings (
  holding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(portfolio_id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  average_buy_price DECIMAL(20, 2) NOT NULL,
  current_price DECIMAL(20, 2),
  current_value DECIMAL(20, 2),
  unrealized_pnl DECIMAL(20, 2),
  unrealized_pnl_percent DECIMAL(10, 4),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_holding_portfolio ON holdings(portfolio_id);
CREATE INDEX idx_holding_symbol ON holdings(symbol);
```

**Trades Table:**

```sql
CREATE TABLE trades (
  trade_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES spectra_user_t(user_id) ON DELETE CASCADE,
  order_id VARCHAR(100),
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
  amount DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 2) NOT NULL,
  fees DECIMAL(20, 2) DEFAULT 0,
  total_value DECIMAL(20, 2) NOT NULL,
  is_paper_trade BOOLEAN DEFAULT false,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trade_user ON trades(user_id);
CREATE INDEX idx_trade_symbol ON trades(symbol);
CREATE INDEX idx_trade_executed ON trades(executed_at DESC);
```

**Alerts Table:**

```sql
CREATE TABLE alerts (
  alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES spectra_user_t(user_id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('price', 'rsi', 'volume', 'sma_crossover', 'volatility')),
  condition JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'snoozed', 'dismissed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  triggered_at TIMESTAMP
);

CREATE INDEX idx_alert_user ON alerts(user_id);
CREATE INDEX idx_alert_status ON alerts(status);
CREATE INDEX idx_alert_symbol ON alerts(symbol);
```

**Database Connection Configuration:**

```typescript
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'spectra_dev',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export default pool
```

### Market Data Models

**Cryptocurrency:**

```typescript
interface Cryptocurrency {
  symbol: string // e.g., 'BTC'
  name: string // e.g., 'Bitcoin'
  productId: string // e.g., 'BTC-USD'
  price: number
  change24h: number // percentage
  volume24h: number
  marketCap: number
  high24h: number
  low24h: number
  lastUpdate: number // timestamp
}
```

**PriceHistory:**

```typescript
interface PriceHistory {
  symbol: string
  interval: '1m' | '5m' | '15m' | '1h' | '1d'
  candles: Candle[]
}

interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}
```

### Portfolio Models

**Portfolio:**

```typescript
interface Portfolio {
  userId: string
  totalValue: number // USD
  cash: number // available USD
  holdings: Holding[]
  change24h: number // USD
  change24hPercent: number
  lastUpdate: number
}

interface Holding {
  symbol: string
  quantity: number
  averageBuyPrice: number
  currentPrice: number
  currentValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
}
```

### Trading Models

**Order:**

```typescript
interface Order {
  orderId: string
  userId: string
  symbol: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit'
  status: 'pending' | 'open' | 'filled' | 'cancelled' | 'rejected'
  amount: number
  limitPrice?: number
  filledAmount: number
  averagePrice: number
  fees: number
  totalValue: number
  createdAt: number
  updatedAt: number
}
```

**Trade:**

```typescript
interface Trade {
  tradeId: string
  orderId: string
  userId: string
  symbol: string
  side: 'buy' | 'sell'
  amount: number
  price: number
  fees: number
  totalValue: number
  executedAt: number
}
```

### Alert Models

**Alert:**

```typescript
interface Alert {
  alertId: string
  userId: string
  symbol: string
  type: 'price' | 'rsi' | 'volume' | 'sma_crossover' | 'volatility'
  condition: AlertCondition
  status: 'active' | 'triggered' | 'snoozed' | 'dismissed'
  createdAt: number
  triggeredAt?: number
}

interface AlertCondition {
  // For price alerts
  priceAbove?: number
  priceBelow?: number

  // For RSI alerts
  rsiAbove?: number
  rsiBelow?: number

  // For volume alerts
  volumeChangePercent?: number

  // For SMA alerts
  smaCrossover?: 'golden' | 'death'

  // For volatility alerts
  volatilityThreshold?: number
}
```

## Error Handling

### Error Classification

**Network Errors:**

- WebSocket connection failures
- API request timeouts
- Rate limit exceeded
- DNS resolution failures

**Authentication Errors:**

- Invalid API credentials
- Expired signatures
- Insufficient permissions

**Validation Errors:**

- Invalid order amounts
- Insufficient balance
- Below minimum order size
- Invalid price limits

**Business Logic Errors:**

- Market closed
- Trading pair not available
- Order already filled/cancelled

### Error Handling Strategy

**Frontend Error Handling:**

```typescript
interface ErrorHandler {
  handleNetworkError(error: NetworkError): void
  handleValidationError(error: ValidationError): void
  handleAuthError(error: AuthError): void
  displayUserMessage(message: string, severity: 'error' | 'warning' | 'info'): void
}

// Example implementation
class FrontendErrorHandler implements ErrorHandler {
  handleNetworkError(error: NetworkError): void {
    if (error.code === 'TIMEOUT') {
      this.displayUserMessage('Request timed out. Please try again.', 'error')
    } else if (error.code === 'CONNECTION_LOST') {
      this.displayUserMessage('Connection lost. Reconnecting...', 'warning')
      // Trigger reconnection logic
    }
  }

  handleValidationError(error: ValidationError): void {
    // Display field-specific error messages
    this.displayUserMessage(error.message, 'error')
  }
}
```

**Backend Error Handling:**

```typescript
// Express error middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  })

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details,
    })
  }

  if (err instanceof AuthenticationError) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid credentials',
    })
  }

  if (err instanceof RateLimitError) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: err.retryAfter,
    })
  }

  // Generic error response
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred',
  })
})
```

**WebSocket Error Handling:**

```typescript
class WebSocketManager {
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private baseDelay = 1000 // 1 second

  private handleConnectionError(error: Error): void {
    logger.error('WebSocket connection error', { error: error.message })
    this.attemptReconnect()
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached')
      this.notifyFrontend('connection_failed')
      return
    }

    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts),
      60000 // Max 60 seconds
    )

    setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }
}
```

### Retry Logic

**API Request Retry:**

- Retry on network errors: 3 attempts with exponential backoff
- Retry on 5xx server errors: 2 attempts with 1-second delay
- No retry on 4xx client errors (validation, authentication)
- No retry on successful responses (2xx)

**WebSocket Reconnection:**

- Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 60s (max)
- Maximum 10 reconnection attempts
- Reset attempt counter on successful connection
- Resubscribe to channels after reconnection

## Testing Strategy

### Unit Testing

**Frontend Unit Tests:**

- Component rendering tests (React Testing Library)
- Hook behavior tests (custom hooks)
- Utility function tests (calculations, formatters, validators)
- Store action tests (Zustand stores)

**Backend Unit Tests:**

- AI calculation tests (RSI, SMA, volatility)
- Authentication signature generation tests
- Data normalization tests
- Validation logic tests

**Example Test Cases:**

```typescript
// RSI calculation test
describe('calculateRSI', () => {
  it('should return 50 with insufficient data', () => {
    expect(calculateRSI([100])).toBe(50)
  })

  it('should calculate RSI correctly for standard dataset', () => {
    const prices = [
      44, 44.34, 44.09, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28,
      46.28,
    ]
    expect(calculateRSI(prices, 14)).toBeCloseTo(66.25, 1)
  })

  it('should identify overbought conditions', () => {
    const overboughtPrices = generateOverboughtPrices()
    expect(calculateRSI(overboughtPrices)).toBeGreaterThan(70)
  })
})

// Order validation test
describe('validateOrderAmount', () => {
  it('should reject negative amounts', () => {
    const result = validateOrderAmount(-10, 1000)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Amount must be positive')
  })

  it('should reject amounts below minimum', () => {
    const result = validateOrderAmount(5, 1000)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Minimum order')
  })

  it('should reject amounts exceeding balance', () => {
    const result = validateOrderAmount(1500, 1000)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Insufficient balance')
  })
})
```

### Integration Testing

**API Integration Tests:**

- Test complete order placement flow (frontend → backend → Coinbase)
- Test WebSocket message flow (Coinbase → backend → frontend)
- Test authentication flow with real API credentials (sandbox)
- Test error handling for various failure scenarios

**Database Integration Tests:**

- Test portfolio persistence and retrieval
- Test trade history storage and querying
- Test alert creation and triggering

### End-to-End Testing

**Critical User Flows:**

1. **Market Monitoring Flow:**
   - User opens dashboard
   - Heatmap loads with real-time data
   - Prices update in real-time
   - User switches view modes
   - User clicks on cryptocurrency for details

2. **Trading Flow:**
   - User selects cryptocurrency
   - User enters order details
   - System validates inputs
   - User confirms order
   - Order executes successfully
   - Portfolio updates with new holding

3. **Alert Flow:**
   - User creates price alert
   - Market price crosses threshold
   - Alert triggers
   - User receives notification
   - User dismisses alert

**E2E Test Framework:**

- Use Playwright for browser automation
- Test on Chrome, Firefox, Safari
- Test on desktop and mobile viewports
- Mock Coinbase API responses for consistent testing

### Performance Testing

**Load Testing:**

- Simulate 100 concurrent WebSocket connections
- Measure message processing latency
- Test frontend rendering performance with 30 simultaneous price updates
- Measure API response times under load

**Stress Testing:**

- Test system behavior during extreme market volatility (1000+ updates/second)
- Test memory usage over extended periods (24+ hours)
- Test database query performance with large datasets (10,000+ trades)

**Performance Benchmarks:**

- WebSocket message latency: < 100ms
- API response time: < 500ms (p95)
- Frontend frame rate: > 30fps during updates
- Time to interactive: < 3 seconds on 4G connection

### Testing Tools

- **Frontend:** Jest, React Testing Library, Vitest
- **Backend:** Jest, Supertest
- **E2E:** Playwright
- **Load Testing:** Artillery, k6
- **Code Coverage:** Istanbul/nyc (target: 80% coverage)

## Performance Optimizations

### Frontend Optimizations

**React Rendering Optimizations:**

```typescript
// Memoize expensive components
const CoinCell = React.memo(
  ({ symbol, price, change24h }: CoinCellProps) => {
    // Component implementation
  },
  (prevProps, nextProps) => {
    // Only re-render if price or change24h changed
    return prevProps.price === nextProps.price && prevProps.change24h === nextProps.change24h
  }
)

// Use useMemo for expensive calculations
const sortedCoins = useMemo(() => {
  return coins.sort((a, b) => b.change24h - a.change24h)
}, [coins])

// Use useCallback for event handlers
const handleCoinClick = useCallback((symbol: string) => {
  setSelectedCoin(symbol)
}, [])
```

**WebSocket Update Batching:**

```typescript
class MarketDataBatcher {
  private updateQueue: MarketUpdate[] = []
  private rafId: number | null = null

  queueUpdate(update: MarketUpdate): void {
    this.updateQueue.push(update)

    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.flushUpdates()
      })
    }
  }

  private flushUpdates(): void {
    const batch = [...this.updateQueue]
    this.updateQueue = []
    this.rafId = null

    // Process all updates at once
    marketStore.updateBatch(batch)
  }
}
```

**Virtual Scrolling for Large Lists:**

To maintain performance with large datasets (Requirement 11.3), the system implements virtual scrolling using react-window. This technique only renders visible items, dramatically reducing DOM nodes and improving scroll performance.

```typescript
import { FixedSizeList } from 'react-window';

function TradeHistory({ trades }: { trades: Trade[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={trades.length}
      itemSize={60}
      width="100%"
    >
      {({ index, style }) => (
        <TradeRow trade={trades[index]} style={style} />
      )}
    </FixedSizeList>
  );
}
```

**When to Use Virtual Scrolling:**

- Trade history lists exceeding 100 items (Requirement 11.3)
- Alert lists with many historical alerts
- Order book displays with hundreds of orders
- Any list that could grow unbounded over time

**Performance Benefits:**

- Renders only ~20 visible items instead of potentially thousands
- Constant memory usage regardless of list size
- Smooth 60fps scrolling even with 10,000+ items
- Reduced initial render time

### Backend Optimizations

**Caching Strategy:**

```typescript
class InsightsCache {
  private cache = new Map<string, CachedInsight>()
  private ttl = 60000 // 60 seconds

  get(symbol: string): MarketInsight[] | null {
    const cached = this.cache.get(symbol)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > this.ttl) {
      this.cache.delete(symbol)
      return null
    }

    return cached.insights
  }

  set(symbol: string, insights: MarketInsight[]): void {
    this.cache.set(symbol, {
      insights,
      timestamp: Date.now(),
    })
  }
}
```

**Connection Pooling:**

```typescript
// Reuse HTTP connections for Coinbase API
const axios = require('axios')
const https = require('https')

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
})

const apiClient = axios.create({
  httpsAgent,
  timeout: 10000,
})
```

**Rate Limiting:**

```typescript
import rateLimit from 'express-rate-limit'

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: req.rateLimit.resetTime,
    })
  },
})

app.use('/api/', apiLimiter)
```

### Database Optimizations

**Indexing Strategy:**

- Index on `userId` for portfolio and trade queries
- Index on `symbol` for market data queries
- Composite index on `(userId, createdAt)` for trade history
- Index on `(userId, status)` for active alerts

**Query Optimization:**

- Use pagination for large result sets (trade history)
- Implement cursor-based pagination for real-time data
- Use projection to fetch only required fields
- Batch database writes for trade history

**Data Retention Policy:**

- Trade history: Minimum 90 days retention (Requirement 14.5)
- Market data: Keep 30 days of historical candles for charting
- Alert history: Keep triggered alerts for 30 days
- Portfolio snapshots: Daily snapshots for 90 days for historical charts
- Implement automated cleanup jobs to remove expired data

## Data Persistence Strategy

### Client-Side Storage (localStorage)

The Spectra System uses browser localStorage for user preferences and non-sensitive data to provide a seamless experience across sessions (Requirement 14).

**Persisted Data:**

```typescript
interface LocalStorageSchema {
  // Theme preference (Requirement 14.1)
  theme: 'dark' | 'light'
  
  // User watchlist (Requirement 14.2)
  watchlist: string[] // Array of cryptocurrency symbols
  
  // Alert configurations (Requirement 14.3)
  alerts: Alert[]
  
  // Last selected view mode (Requirement 14.4)
  lastViewMode: 'change' | 'volume' | 'volatility' | 'marketCap'
  
  // Paper trading virtual portfolio (Requirement 10.1, 10.3)
  paperTradingPortfolio: {
    balance: number
    holdings: Holding[]
    trades: Trade[]
  }
  
  // Paper trading mode preference
  paperTradingEnabled: boolean
}
```

**Storage Management:**

```typescript
class StorageManager {
  private static PREFIX = 'spectra_'
  
  static save<T>(key: string, value: T): void {
    try {
      localStorage.setItem(
        `${this.PREFIX}${key}`,
        JSON.stringify(value)
      )
    } catch (error) {
      logger.warn('localStorage save failed', { key, error })
      // Gracefully degrade if storage is full
    }
  }
  
  static load<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(`${this.PREFIX}${key}`)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      logger.warn('localStorage load failed', { key, error })
      return defaultValue
    }
  }
  
  static clear(key: string): void {
    localStorage.removeItem(`${this.PREFIX}${key}`)
  }
}
```

**Data Synchronization:**

- Theme changes persist immediately on toggle
- Watchlist updates persist on add/remove operations
- Alert configurations sync after creation/deletion
- Paper trading portfolio syncs after each simulated trade
- View mode preference saves on mode change

### Server-Side Storage

**In-Memory Storage (MVP):**

For the MVP, the backend uses in-memory data structures for simplicity and rapid development. This approach is suitable for demo purposes and single-instance deployments.

```typescript
// Portfolio storage
const portfolios = new Map<string, Portfolio>()

// Trade history storage (90-day retention per Requirement 14.5)
const trades = new Map<string, Trade[]>()

// Alert storage
const alerts = new Map<string, Alert[]>()

// Market data cache (30-day retention)
const marketDataCache = new Map<string, PriceHistory>()
```

**Data Cleanup Strategy:**

```typescript
class DataCleanupService {
  private cleanupInterval = 24 * 60 * 60 * 1000 // 24 hours
  
  start(): void {
    setInterval(() => {
      this.cleanupOldTrades()
      this.cleanupOldMarketData()
      this.cleanupTriggeredAlerts()
    }, this.cleanupInterval)
  }
  
  private cleanupOldTrades(): void {
    const cutoffDate = Date.now() - (90 * 24 * 60 * 60 * 1000) // 90 days
    
    trades.forEach((userTrades, userId) => {
      const filtered = userTrades.filter(
        trade => trade.executedAt > cutoffDate
      )
      trades.set(userId, filtered)
    })
  }
  
  private cleanupOldMarketData(): void {
    const cutoffDate = Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days
    
    marketDataCache.forEach((history, symbol) => {
      history.candles = history.candles.filter(
        candle => candle.timestamp > cutoffDate
      )
    })
  }
  
  private cleanupTriggeredAlerts(): void {
    const cutoffDate = Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days
    
    alerts.forEach((userAlerts, userId) => {
      const filtered = userAlerts.filter(alert => {
        if (alert.status === 'active') return true
        if (alert.status === 'triggered' && alert.triggeredAt) {
          return alert.triggeredAt > cutoffDate
        }
        return false
      })
      alerts.set(userId, filtered)
    })
  }
}
```

**Future Database Migration:**

The in-memory storage can be replaced with a database (PostgreSQL, MongoDB) without changing the service interfaces:

- Portfolio data → `portfolios` table
- Trade history → `trades` table with `created_at` index
- Alerts → `alerts` table with `user_id` and `status` indexes
- Market data → Time-series database (InfluxDB, TimescaleDB) for optimal performance

## Security Considerations

### API Key Management

**Environment Variables:**

```bash
# Never commit these to version control
COINBASE_API_KEY=your_api_key
COINBASE_API_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret
```

**Key Rotation:**

- Rotate API keys every 90 days
- Use separate keys for development, staging, production
- Implement key versioning for zero-downtime rotation

### Authentication Architecture

**User Authentication Flow:**

The Spectra System implements JWT-based authentication for user sessions and stores user-specific Coinbase API credentials securely in the database. Users register with email, username, and password, which are validated and hashed with bcrypt before storage.

**Registration Flow:**
1. User submits registration form with full name, username, email, and password
2. Frontend validates email format, password strength (8+ chars, uppercase, lowercase, number), and username format (3-50 chars, alphanumeric + underscore)
3. Frontend sends POST /api/auth/register to backend
4. Backend validates inputs and checks for duplicate email/username
5. Backend hashes password with bcrypt (10 salt rounds)
6. Backend creates user record in spectra_user_t table
7. Backend returns success message

**Login Flow:**
1. User submits login form with email and password
2. Frontend sends POST /api/auth/login to backend
3. Backend queries user by email
4. Backend verifies password using bcrypt.compare()
5. Backend generates JWT token with 24-hour expiration
6. Backend returns JWT token and user data (excluding password and encrypted keys)
7. Frontend stores JWT in localStorage with key 'spectra_auth_token'
8. Frontend redirects to /dashboard

**API Request Flow:**
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    participant Coinbase

    User->>Frontend: Login (email, password)
    Frontend->>Backend: POST /api/auth/login
    Backend->>Database: Query user by email
    Database-->>Backend: User record
    Backend->>Backend: Verify password (bcrypt)
    Backend->>Backend: Generate JWT token
    Backend-->>Frontend: JWT token + user data
    Frontend->>Frontend: Store JWT in localStorage
    Frontend->>Backend: API request with JWT in Authorization header
    Backend->>Backend: Verify JWT signature and expiration
    Backend->>Database: Get user's Coinbase keys
    Database-->>Backend: Encrypted Coinbase API credentials
    Backend->>Backend: Decrypt credentials using ENCRYPTION_KEY
    Backend->>Coinbase: Request with user's keys
    Coinbase-->>Backend: Response
    Backend-->>Frontend: Data
```

**JWT Token Structure:**

```typescript
interface JWTPayload {
  userId: string
  email: string
  username: string
  iat: number // issued at
  exp: number // expiration (24 hours)
}
```

**Password Security:**

- Passwords hashed using bcrypt with salt rounds of 10
- Never store plain text passwords
- Implement password strength requirements (min 8 characters, uppercase, lowercase, number)

**Coinbase API Authentication (HMAC & ECDSA Signatures):**

Each user stores their own Coinbase API credentials encrypted in the database. When making Coinbase API requests, the backend retrieves the user's credentials and generates signatures based on the key type.

**HMAC SHA256 (Legacy Coinbase API Keys):**
```typescript
function generateHMACSignature(
  timestamp: number,
  method: string,
  path: string,
  body: string,
  secret: string
): string {
  const message = `${timestamp}${method}${path}${body}`
  return crypto.createHmac('sha256', secret).update(message).digest('hex')
}
```

**ECDSA (Coinbase Developer Platform Keys):**
```typescript
function generateECDSASignature(
  timestamp: number,
  method: string,
  path: string,
  body: string,
  privateKey: string
): string {
  const message = `${timestamp}${method}${path}${body}`
  const sign = crypto.createSign('SHA256')
  sign.update(message)
  sign.end()
  return sign.sign(privateKey, 'hex')
}
```

**Auto-Detection:**
```typescript
function generateCoinbaseSignature(
  timestamp: number,
  method: string,
  path: string,
  body: string,
  secret: string
): string {
  const message = `${timestamp}${method}${path}${body}`
  
  // Detect ECDSA format (EC PRIVATE KEY)
  if (secret.includes('BEGIN EC PRIVATE KEY')) {
    const sign = crypto.createSign('SHA256')
    sign.update(message)
    sign.end()
    return sign.sign(secret, 'hex')
  }
  
  // Default to HMAC SHA256
  return crypto.createHmac('sha256', secret).update(message).digest('hex')
}

// Usage
const timestamp = Math.floor(Date.now() / 1000)
const signature = generateCoinbaseSignature(
  timestamp,
  'POST',
  '/api/v3/brokerage/orders',
  JSON.stringify(orderData),
  userCoinbaseSecret // Retrieved from database and decrypted
)
```

**API Credential Encryption:**

```typescript
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY // 32-byte key
const ALGORITHM = 'aes-256-gcm'

function encryptApiKey(apiKey: string): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const tag = cipher.getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  }
}

function decryptApiKey(encrypted: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(iv, 'hex')
  )
  
  decipher.setAuthTag(Buffer.from(tag, 'hex'))
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```

### Input Validation

**Server-Side Validation:**

```typescript
import Joi from 'joi'

const orderSchema = Joi.object({
  symbol: Joi.string()
    .pattern(/^[A-Z]+-USD$/)
    .required(),
  side: Joi.string().valid('buy', 'sell').required(),
  type: Joi.string().valid('market', 'limit').required(),
  amount: Joi.number().positive().min(10).required(),
  limitPrice: Joi.number().positive().when('type', {
    is: 'limit',
    then: Joi.required(),
  }),
})

function validateOrder(data: unknown): OrderRequest {
  const { error, value } = orderSchema.validate(data)
  if (error) {
    throw new ValidationError(error.details[0].message)
  }
  return value
}
```

### CORS Configuration

```typescript
import cors from 'cors'

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
}

app.use(cors(corsOptions))
```

### Rate Limiting

- API endpoints: 100 requests per 15 minutes per IP
- WebSocket connections: 5 connections per IP
- Order placement: 10 orders per minute per user
- Alert creation: 20 alerts per hour per user

## Deployment Architecture

### Frontend Deployment (Vercel)

**Build Configuration:**

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "cd frontend && npm install",
  "framework": "vite"
}
```

**Environment Variables:**

- `VITE_BACKEND_API_URL`: Backend API URL
- `VITE_BACKEND_WS_URL`: Backend WebSocket URL
- `VITE_ENABLE_PAPER_TRADING`: Feature flag

### Backend Deployment (Railway)

**Dockerfile:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/src ./src
COPY backend/tsconfig.json ./
RUN npm run build
EXPOSE 3001 3002
CMD ["npm", "start"]
```

**Environment Variables:**

- `COINBASE_API_KEY`: Coinbase API key
- `COINBASE_API_SECRET`: Coinbase API secret
- `NODE_ENV`: production
- `PORT`: 3001
- `WS_PORT`: 3002
- `FRONTEND_URL`: Frontend URL for CORS

### Monitoring and Logging

**Logging Strategy:**

```typescript
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
})

// Log important events
logger.info('Order placed', { userId, orderId, symbol, amount })
logger.error('API request failed', { error, endpoint, statusCode })
```

**Health Checks:**

```typescript
app.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'ok',
    services: {
      database: checkDatabaseConnection(),
      coinbaseAPI: checkCoinbaseConnection(),
      websocket: checkWebSocketStatus(),
    },
  }

  const isHealthy = Object.values(health.services).every((s) => s === 'ok')
  res.status(isHealthy ? 200 : 503).json(health)
})
```

## Design Decisions and Rationales

### Why Zustand over Redux?

- **Simplicity**: Minimal boilerplate, no actions/reducers/dispatchers
- **Performance**: Direct state updates without middleware overhead
- **Size**: 3KB vs 45KB (Redux + React-Redux)
- **TypeScript**: Better type inference out of the box
- **Real-time**: Easier to integrate with WebSocket updates

### Why Recharts over D3.js?

- **Learning Curve**: Declarative API vs imperative D3
- **React Integration**: Built for React, no DOM manipulation conflicts
- **Development Speed**: Pre-built chart components for financial data
- **Maintenance**: Less custom code to maintain
- **Note**: D3.js remains an option for custom heatmap visualization if needed

### Why Node.js Backend vs Serverless?

- **WebSocket Support**: Native WebSocket server support
- **Stateful Connections**: Maintain persistent Coinbase WebSocket connection
- **Cost**: More predictable pricing for high-frequency updates
- **Latency**: Lower latency for real-time data streaming

### Why Separate Backend vs Direct Frontend-to-Coinbase?

- **Security**: API keys never exposed to client
- **Rate Limiting**: Centralized rate limit management
- **Caching**: Server-side caching of AI insights
- **WebSocket Proxy**: Single Coinbase connection shared across clients
- **Business Logic**: Centralized order validation and risk management

### Why Paper Trading Mode?

- **User Onboarding**: Reduces barrier to entry for new traders
- **Risk Management**: Users can test strategies without financial risk
- **Demo Purposes**: Allows full feature demonstration without real funds
- **Development**: Easier testing without real money transactions

This design provides a solid foundation for building a production-ready cryptocurrency trading dashboard with real-time capabilities, AI-powered insights, and robust error handling.
