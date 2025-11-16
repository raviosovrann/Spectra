import { useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Bar,
} from 'recharts'

interface CandleData {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface CandlestickChartProps {
  data?: CandleData[]
  height?: number
}

// Generate mock candlestick data
const generateMockData = (): CandleData[] => {
  const data: CandleData[] = []
  let basePrice = 43000
  const now = Date.now()

  for (let i = 60; i >= 0; i--) {
    const time = new Date(now - i * 60 * 60 * 1000)
    const open = basePrice + (Math.random() - 0.5) * 1000
    const close = open + (Math.random() - 0.5) * 2000
    const high = Math.max(open, close) + Math.random() * 500
    const low = Math.min(open, close) - Math.random() * 500
    const volume = Math.random() * 1000000

    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      open,
      high,
      low,
      close,
      volume,
    })

    basePrice = close
  }

  return data
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomCandlestick = (props: any) => {
  const { x, width, open, close, high, low } = props
  const isGreen = close > open
  const color = isGreen ? '#22c55e' : '#ef4444'
  const bodyHeight = Math.abs(close - open)
  const bodyY = Math.min(close, open)

  return (
    <g>
      {/* Wick (high-low line) */}
      <line
        x1={x + width / 2}
        y1={high}
        x2={x + width / 2}
        y2={low}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body (open-close rectangle) */}
      <rect
        x={x}
        y={bodyY}
        width={width}
        height={bodyHeight || 1}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  )
}

export default function CandlestickChart({ data, height = 400 }: CandlestickChartProps) {
  const chartData = useMemo(() => data || generateMockData(), [data])

  // Transform data for candlestick rendering
  const transformedData = useMemo(() => {
    return chartData.map((candle, index) => ({
      ...candle,
      index,
      // Calculate Y positions for custom candlestick
      openY: candle.open,
      closeY: candle.close,
      highY: candle.high,
      lowY: candle.low,
    }))
  }, [chartData])

  const minPrice = Math.min(...chartData.map((d) => d.low))
  const maxPrice = Math.max(...chartData.map((d) => d.high))
  const priceRange = maxPrice - minPrice
  const yDomain = [minPrice - priceRange * 0.1, maxPrice + priceRange * 0.1]

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={transformedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis
            dataKey="time"
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={{ stroke: '#475569' }}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="price"
            domain={yDomain}
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={{ stroke: '#475569' }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <YAxis
            yAxisId="volume"
            orientation="right"
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={{ stroke: '#475569' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '12px',
            }}
            labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: '8px' }}
            itemStyle={{ color: '#cbd5e1', fontSize: '13px' }}
            formatter={(value: number, name: string) => {
              if (name === 'volume') {
                return [`${(value / 1000).toFixed(0)}K`, 'Volume']
              }
              return [`$${value.toLocaleString()}`, name.charAt(0).toUpperCase() + name.slice(1)]
            }}
          />
          {/* Volume bars */}
          <Bar
            yAxisId="volume"
            dataKey="volume"
            fill="url(#volumeGradient)"
            opacity={0.5}
            radius={[4, 4, 0, 0]}
          />
          {/* Candlesticks using custom shape */}
          <Bar
            yAxisId="price"
            dataKey="closeY"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            shape={(props: any) => {
              const candle = transformedData[props.index]
              return (
                <CustomCandlestick
                  {...props}
                  open={candle.openY}
                  close={candle.closeY}
                  high={candle.highY}
                  low={candle.lowY}
                />
              )
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
