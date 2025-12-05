/**
 * CandlestickChart Component
 * 
 * Professional candlestick chart using lightweight-charts library.
 * Provides interactive zooming, panning, and proper OHLC rendering.
 */

import { useEffect, useRef, useMemo } from 'react'
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, Time, CandlestickSeries } from 'lightweight-charts'
import type { CandleData as ExternalCandleData } from '../../hooks/useInstrumentData'

interface CandlestickChartProps {
  symbol?: string
  interval?: string
  height?: number | string
  candles?: ExternalCandleData[]
  currentPrice?: number
  isLoading?: boolean
  onIntervalChange?: (interval: string) => void
}

export default function CandlestickChart({ 
  symbol: _symbol, 
  interval: _interval, 
  height = 400,
  candles: externalCandles,
  currentPrice: externalCurrentPrice,
  isLoading,
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)

  // Prepare data for lightweight-charts
  const { candleData } = useMemo(() => {
    if (!externalCandles || externalCandles.length === 0) {
      return { candleData: [] }
    }

    // Assume backend sends sorted data to improve performance
    // const sortedCandles = [...externalCandles].sort((a, b) => a.timestamp - b.timestamp)

    const cData = externalCandles.map(candle => {
      // Convert timestamp to seconds if it's in milliseconds
      const time = (candle.timestamp > 1e12 ? Math.floor(candle.timestamp / 1000) : candle.timestamp) as Time
      return {
        time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }
    })

    return { candleData: cData }
  }, [externalCandles])

  // Update last candle with current price if available
  const { finalCandleData } = useMemo(() => {
    if (candleData.length === 0) return { finalCandleData: [] }
    if (!externalCurrentPrice || externalCurrentPrice <= 0) return { finalCandleData: candleData }

    const lastCandle = candleData[candleData.length - 1]
    
    // Only update if the current price is different or we want to show live movement
    // For a real app, we might want to check if the current time is still within the last candle's interval
    // But for simplicity, we'll just update the close price of the last candle
    
    const updatedLastCandle = {
      ...lastCandle,
      close: externalCurrentPrice,
      high: Math.max(lastCandle.high, externalCurrentPrice),
      low: Math.min(lastCandle.low, externalCurrentPrice),
    }

    const newCandleData = [...candleData]
    newCandleData[newCandleData.length - 1] = updatedLastCandle

    return { finalCandleData: newCandleData }
  }, [candleData, externalCurrentPrice])

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#131722' }, // Exact TradingView Dark Theme background
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2a2e39' }, // Exact TradingView grid color
        horzLines: { color: '#2a2e39' },
      },
      width: chartContainerRef.current.clientWidth,
      height: typeof height === 'number' ? height : 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#2a2e39',
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: '#758696',
          style: 3,
          labelBackgroundColor: '#758696',
        },
        horzLine: {
          width: 1,
          color: '#758696',
          style: 3,
          labelBackgroundColor: '#758696',
        },
      },
    })

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#089981', // TradingView Green
      downColor: '#f23645', // TradingView Red
      borderVisible: false,
      wickUpColor: '#089981',
      wickDownColor: '#f23645',
    })

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [height])

  // Update Data
  useEffect(() => {
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData(finalCandleData)
    }
  }, [finalCandleData])

  // Handle initial view and resets when symbol/interval changes
  const prevSymbolRef = useRef<string | undefined>(undefined)
  const prevIntervalRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (chartRef.current && externalCandles && externalCandles.length > 0) {
      const hasSymbolChanged = prevSymbolRef.current !== _symbol
      const hasIntervalChanged = prevIntervalRef.current !== _interval
      
      if (hasSymbolChanged || hasIntervalChanged) {
        // If symbol or interval changed, reset view
        // If we have a lot of data, don't fit content (which squeezes everything), 
        // but show the most recent candles
        if (externalCandles.length > 1000) {
          chartRef.current.timeScale().setVisibleLogicalRange({
            from: externalCandles.length - 200,
            to: externalCandles.length,
          })
        } else {
          chartRef.current.timeScale().fitContent()
        }
        prevSymbolRef.current = _symbol
        prevIntervalRef.current = _interval
      }
    }
  }, [externalCandles, _symbol, _interval])

  // Handle dynamic resizing if container size changes
  useEffect(() => {
    if (!chartRef.current || !chartContainerRef.current) return
    
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || !entries[0].contentRect) return
      const { width, height: newHeight } = entries[0].contentRect
      chartRef.current?.applyOptions({ 
        width, 
        height: typeof height === 'number' ? height : newHeight 
      })
    })

    resizeObserver.observe(chartContainerRef.current)
    return () => resizeObserver.disconnect()
  }, [height])

  return (
    <div className="relative w-full" style={{ height: typeof height === 'string' ? height : `${height}px` }}>
      <div 
        ref={chartContainerRef} 
        className="w-full h-full relative overflow-hidden rounded-lg border border-dark-700"
      />
      
      {((!externalCandles || externalCandles.length === 0) && isLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-900/80 z-10 rounded-lg">
          <div className="text-dark-400">Loading chart data...</div>
        </div>
      )}

      {(!externalCandles || externalCandles.length === 0) && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-900/80 z-10 rounded-lg">
          <div className="text-dark-400">No data available</div>
        </div>
      )}
    </div>
  )
}
