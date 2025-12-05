# Implementation Plan

- [x] 1. Create CryptoDropdown Component
  - Create `frontend/src/components/dropdowns/CryptoDropdown.tsx`
  - Implement searchable dropdown with symbol, name, price, and 24h change display
  - Add keyboard navigation (arrow keys, enter, escape)
  - Style with dark theme matching existing UI
  - Export component for use in TradingView
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Create TimeframeDropdown Component
  - Create `frontend/src/components/dropdowns/TimeframeDropdown.tsx`
  - Implement dropdown with grouped intervals (Minutes, Hours, Days)
  - Support all intervals: 1m, 2m, 3m, 4m, 5m, 10m, 15m, 30m, 45m, 1h, 2h, 3h, 4h, 1d
  - Add localStorage persistence for selected interval
  - Style with compact design matching CryptoDropdown
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Extend Backend CandleAggregator for All Intervals
  - Update `backend/src/services/CandleAggregator.ts` to support all 14 intervals
  - Add interval millisecond mappings for 2m, 3m, 4m, 10m, 30m, 45m, 2h, 3h, 4h
  - Update `processTicker()` to aggregate candles for all intervals
  - Update `getCandles()` to validate interval parameter
  - _Requirements: 8.2, 8.3, 8.4_

- [x] 4. Add WebSocket Per-Instrument Subscriptions
  - Update `backend/src/services/FrontendWebSocketServer.ts` with subscription management
  - Add `handleSubscribe()` and `handleUnsubscribe()` methods
  - Track subscriptions per client in a Map<WebSocket, Set<string>>
  - Implement `broadcastTicker()` to send only to subscribed clients
  - Throttle broadcasts to 1 per second per symbol
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Create useInstrumentWebSocket Hook
  - Create `frontend/src/hooks/useInstrumentWebSocket.ts`
  - Implement WebSocket subscription for specific instrument
  - Send subscribe/unsubscribe messages on symbol change
  - Return ticker data, connection status, and last update timestamp
  - Clean up subscription on unmount or symbol change
  - _Requirements: 4.1, 4.2, 4.5, 4.6_

- [x] 6. Create useCandleData Hook
  - Create `frontend/src/hooks/useCandleData.ts`
  - Implement REST API fetch for historical candles
  - Add AbortController for request cancellation on symbol/interval change
  - Return candles array, loading state, error state, and refetch function
  - Handle race conditions when rapidly changing symbols
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [x] 7. Redesign TradingView Layout
  - Update `frontend/src/pages/TradingView.tsx` with chart-centric layout
  - Chart area takes 70%+ of viewport height
  - Order form as compact 320px sidebar (hidden on mobile, stacked below on tablet)
  - Add header with CryptoDropdown, TimeframeDropdown, and price display
  - Integrate useInstrumentWebSocket and useCandleData hooks
  - Add localStorage persistence for selected symbol
  - Implement loading phase management (switching → loading → ready → error)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.4, 2.6, 6.1, 6.2, 6.3, 6.4_

- [x] 8. Enhance CandlestickChart Component
  - Update `frontend/src/components/charts/CandlestickChart.tsx`
  - Fix candlestick rendering with proper wick and body positioning
  - Implement separate price chart (75%) and volume chart (25%) areas
  - Add current price line with dashed style and price badge
  - Implement professional tooltip showing OHLC + volume
  - Add smooth transitions for candle updates
  - Ensure proper Y-axis scaling at all timeframes
  - Accept external candles and ticker props for real-time updates
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1_

- [x] 9. Implement Real-Time Chart Updates
  - Update chart to receive WebSocket ticker updates every second
  - Update current candle's high, low, close values in real-time
  - Create new candle when interval boundary is crossed
  - Add price pulse animation (green/red) on price changes
  - Ensure chart remains stable during rapid updates
  - _Requirements: 4.1, 4.2, 4.4, 7.1, 7.2, 7.3_

- [x] 10. Update Backend API for Extended Intervals
  - Update `backend/src/routes/market.ts` candles endpoint
  - Validate interval parameter against all 14 supported intervals
  - Return appropriate error for invalid intervals
  - Ensure historical data fetch works for all intervals
  - _Requirements: 8.1, 8.2, 8.5_

- [ ]* 11. Add Unit Tests for Dropdowns
  - Write tests for CryptoDropdown search and selection
  - Write tests for TimeframeDropdown interval selection
  - Test keyboard navigation
  - Test localStorage persistence
  - _Requirements: 2.5, 3.6_

- [ ]* 12. Add Integration Tests for Real-Time Updates
  - Test WebSocket subscription/unsubscription flow
  - Test chart updates on ticker messages
  - Test symbol switching without limbo states
  - Test interval switching with proper data reload
  - _Requirements: 4.5, 4.6, 6.2, 6.3, 6.4_
