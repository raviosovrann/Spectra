import styled, { keyframes } from 'styled-components'

interface LoaderProps {
  text?: string
  fullScreen?: boolean
  size?: 'small' | 'medium' | 'large'
}

const Loader = ({ text, fullScreen = false, size = 'medium' }: LoaderProps) => {
  const sizeMap = {
    small: 48,
    medium: 80,
    large: 120
  }
  const hexSize = sizeMap[size]

  const HexContent = () => (
    <HexagonLoader size={hexSize}>
      <svg viewBox="0 0 100 100" className="hexagon-svg">
        <defs>
          <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {/* Outer hexagon border - rotating dash */}
        <polygon 
          className="hex-outer"
          points="50,3 94,27 94,73 50,97 6,73 6,27" 
        />
        {/* Inner hexagon - pulsing fill */}
        <polygon 
          className="hex-inner"
          points="50,15 82,32 82,68 50,85 18,68 18,32" 
        />
        {/* Center dot */}
        <circle className="hex-center" cx="50" cy="50" r="8" />
      </svg>
    </HexagonLoader>
  )

  if (fullScreen) {
    return (
      <FullScreenWrapper>
        <div className="loader-container">
          <HexContent />
          {text && <p className="loader-text">{text}</p>}
        </div>
      </FullScreenWrapper>
    )
  }

  return (
    <InlineWrapper>
      <HexContent />
      {text && <p className="loader-text-inline">{text}</p>}
    </InlineWrapper>
  )
}

const pulse = keyframes`
  0%, 100% { 
    opacity: 0.3;
    transform: scale(0.92);
  }
  50% { 
    opacity: 0.8;
    transform: scale(1);
  }
`

const dashRotate = keyframes`
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -340; }
`

const centerPulse = keyframes`
  0%, 100% { 
    opacity: 0.5;
    r: 4;
  }
  50% { 
    opacity: 1;
    r: 7;
  }
`

const FullScreenWrapper = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 15vh;
  background: rgba(10, 10, 15, 0.95);
  backdrop-filter: blur(8px);
  z-index: 9999;

  .loader-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
  }

  .loader-text {
    color: #a0a0b0;
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 0.5px;
  }
`

const InlineWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding-top: 20px;

  .loader-text-inline {
    color: #a0a0b0;
    font-size: 14px;
    font-weight: 500;
  }
`

const HexagonLoader = styled.div<{ size: number }>`
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  position: relative;

  .hexagon-svg {
    width: 100%;
    height: 100%;
    overflow: visible;
    filter: url(#glow);
  }

  .hex-outer {
    fill: none;
    stroke: url(#hexGradient);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 40 20;
    animation: ${dashRotate} 2s linear infinite;
    transform-origin: center;
  }

  .hex-inner {
    fill: rgba(99, 102, 241, 0.12);
    stroke: rgba(139, 92, 246, 0.3);
    stroke-width: 1;
    animation: ${pulse} 1.8s ease-in-out infinite;
    transform-origin: center;
  }

  .hex-center {
    fill: url(#hexGradient);
    animation: ${centerPulse} 1.8s ease-in-out infinite;
  }
`

export default Loader
