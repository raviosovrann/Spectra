# Requirements Document

## Introduction

This feature enhances the TradingView page in Spectra to provide a professional-grade, real-time candlestick chart experience similar to TradingView.com. The chart will be the primary focus of the page, occupying most of the screen real estate. Users can select cryptocurrencies and timeframes via compact dropdowns, and the chart updates in real-time via WebSocket messages every second.

## Glossary

- **TradingView Page**: The Spectra page where users place buy/sell orders and view detailed charts for a selected cryptocurrency
- **Candlestick Chart**: A financial chart showing open, high, low, close (OHLC) prices for each time period
- **Instrument**: A specific cryptocurrency trading pair (e.g., BTC-USD, ETH-USD)
- **WebSocket Real-Time Updates**: Live price updates pushed from the backend every second via WebSocket connection
- **OHLC Data**: Open, High, Low, Close price data for a candlestick
- **Ticker Data**: Real-time price and volume information from Coinbase WebSocket feed
- **Candle Aggregation**: The process of building candlestick data from individual ticker updates
- **Timeframe**: The duration each candlestick represents (e.g., 1 minute, 5 minutes, 1 hour)

## Requirements

### Requirement 1: Chart-Centric Layout

**User Story:** As a trader, I want the candlestick chart to be the primary focus of the TradingView page, so that I can analyze price action with maximum visibility.

#### Acceptance Criteria

1. THE Candlestick Chart SHALL occupy at least 70% of the available viewport height on desktop screens
2. THE TradingView Page SHALL display the chart as the primary element with the order form positioned as a compact sidebar
3. THE Chart Area SHALL include a price chart section occupying 75% of the chart height and a volume chart section occupying 25% of the chart height
4. THE TradingView Page SHALL use a responsive layout that stacks the order form below the chart on mobile devices
5. THE Chart SHALL resize smoothly when the browser window is resized without visual glitches

### Requirement 2: Cryptocurrency Selection Dropdown

**User Story:** As a trader, I want to select cryptocurrencies from a compact dropdown menu, so that I can quickly switch between instruments without scrolling through cards.

#### Acceptance Criteria

1. THE TradingView Page SHALL display a dropdown selector for cryptocurrency selection instead of card-based selection
2. THE Dropdown SHALL display the currently selected cryptocurrency symbol, name, and current price
3. THE Dropdown Options SHALL show each cryptocurrency with its symbol, name, and 24h change percentage
4. WHEN a user selects a different cryptocurrency, THE Chart SHALL transition smoothly to the new instrument within 500 milliseconds without entering a stuck or limbo state
5. THE Dropdown SHALL support keyboard navigation and search filtering by symbol or name
6. THE System SHALL cancel any pending data requests for the previous instrument when switching to prevent race conditions

### Requirement 3: Extended Timeframe Selection

**User Story:** As a trader, I want access to multiple timeframe options via a dropdown, so that I can analyze price action at different granularities.

#### Acceptance Criteria

1. THE TradingView Page SHALL display a dropdown selector for timeframe selection
2. THE Timeframe Dropdown SHALL support the following minute intervals: 1, 2, 3, 4, 5, 10, 15, 30, 45
3. THE Timeframe Dropdown SHALL support the following hour intervals: 1, 2, 3, 4
4. THE Timeframe Dropdown SHALL support the following day interval: 1
5. WHEN a user changes the timeframe, THE Chart SHALL reload with the appropriate candle data for the selected interval within 1 second
6. THE System SHALL persist the user's last selected timeframe in localStorage and restore it on page load

### Requirement 4: WebSocket Real-Time Chart Updates

**User Story:** As a trader, I want the chart to update every second via WebSocket, so that I see live price action without polling delays.

#### Acceptance Criteria

1. THE Candlestick Chart SHALL receive real-time price updates via WebSocket connection every second
2. WHILE receiving WebSocket ticker updates, THE Chart SHALL update the current candle's high, low, and close values within 100 milliseconds
3. THE Backend SHALL broadcast individual instrument ticker updates to subscribed frontend clients via WebSocket
4. WHEN a new candle period begins based on the selected timeframe, THE Chart SHALL create a new candle and shift the view to show the latest data
5. IF the WebSocket connection is lost, THEN THE System SHALL display a disconnected indicator and attempt automatic reconnection with exponential backoff
6. THE System SHALL maintain chart state during brief WebSocket disconnections and resume updates seamlessly upon reconnection

### Requirement 5: Candlestick Chart Visual Quality

**User Story:** As a trader, I want the candlestick chart to render correctly at all timeframes with proper scaling, so that I can accurately analyze price patterns.

#### Acceptance Criteria

1. THE Candlestick Chart SHALL display OHLC data with green candles for price increases and red candles for price decreases
2. THE Candlestick Chart SHALL scale the Y-axis appropriately based on the visible price range with adequate padding
3. THE Candlestick Chart SHALL render candlestick wicks and bodies with correct proportions at all timeframes
4. THE Candlestick Chart SHALL display volume bars below the price chart with colors matching their corresponding candles
5. THE Candlestick Chart SHALL display a current price line as a dashed horizontal line with a price label badge
6. THE Candlestick Chart SHALL display a professional tooltip on hover showing timestamp, open, high, low, close, and volume

### Requirement 6: Chart Performance and Stability

**User Story:** As a trader, I want the chart to remain stable and responsive when switching instruments or timeframes, so that I never experience stuck or frozen states.

#### Acceptance Criteria

1. THE Chart SHALL maintain a frame rate of at least 30 frames per second during real-time updates
2. WHEN switching cryptocurrencies, THE Chart SHALL display a brief loading state rather than showing stale or mixed data
3. THE Chart SHALL implement proper cleanup of previous data and subscriptions when changing instruments
4. THE Chart SHALL handle rapid instrument or timeframe changes gracefully without entering undefined states
5. THE System SHALL implement request cancellation for in-flight API calls when the user changes selection
6. THE Chart SHALL display an appropriate empty state with a message if no data is available for the selected instrument

### Requirement 7: Price Display and Order Form Integration

**User Story:** As a trader, I want the displayed price to update in real-time and sync with my order form, so that I can place orders at accurate prices.

#### Acceptance Criteria

1. THE TradingView Header SHALL display the current price, 24h change, 24h high, 24h low, and volume from WebSocket updates
2. THE Price Display SHALL show a visual pulse animation when the price updates (green for increase, red for decrease)
3. THE Order Form SHALL use the real-time WebSocket price for order calculations
4. THE Order Form SHALL be positioned as a compact sidebar that does not obstruct the chart view
5. THE Order Form SHALL update the estimated total in real-time as the price changes

### Requirement 8: Backend Candle Data API

**User Story:** As a frontend developer, I want a backend API that provides historical candle data for all supported timeframes, so that the chart can display complete price history.

#### Acceptance Criteria

1. THE Backend SHALL provide a REST endpoint GET /api/market/candles/:symbol that returns candle data for a specific instrument
2. THE Backend SHALL accept a query parameter for interval supporting all timeframe values (1m, 2m, 3m, 4m, 5m, 10m, 15m, 30m, 45m, 1h, 2h, 3h, 4h, 1d)
3. THE Backend SHALL aggregate ticker data from Coinbase WebSocket feed into candlestick format in real-time
4. THE Backend SHALL maintain a rolling buffer of the last 100 candles per instrument per time interval
5. WHEN historical data is not available in the buffer, THE Backend SHALL fetch historical candles from Coinbase REST API
