import { useEffect, useState } from 'react'
import { WHEEL_CATEGORIES } from '../game/wheel'

const SEGMENT_ANGLE = 360 / WHEEL_CATEGORIES.length
const SEGMENT_HALF = SEGMENT_ANGLE / 2
const SVG_SIZE = 320
const CENTER = SVG_SIZE / 2
const RADIUS = CENTER - 16
const LABEL_RADIUS = RADIUS * 0.62
const MIN_FULL_SPINS = 5

const SEGMENT_COLORS = [
  '#10b981',
  '#06b6d4',
  '#a78bfa',
  '#f472b6',
  '#fbbf24',
] as const

function polar(thetaDeg: number, r: number): [number, number] {
  const theta = (thetaDeg * Math.PI) / 180
  return [CENTER + r * Math.sin(theta), CENTER - r * Math.cos(theta)]
}

function segmentPath(index: number): string {
  const start = index * SEGMENT_ANGLE - SEGMENT_HALF
  const end = index * SEGMENT_ANGLE + SEGMENT_HALF
  const [x1, y1] = polar(start, RADIUS)
  const [x2, y2] = polar(end, RADIUS)
  return `M ${CENTER} ${CENTER} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${RADIUS} ${RADIUS} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
}

// Pointer is fixed at the top. Rotating the wheel by R degrees clockwise puts
// segment N at the pointer when (N * SEGMENT_ANGLE + R) ≡ 0 (mod 360),
// i.e. R ≡ (360 - N * SEGMENT_ANGLE) mod 360. We add 5 full spins on top so
// the animation feels like a real wheel.
function rotationForSegment(currentRotation: number, segmentIndex: number): number {
  const targetMod = ((360 - segmentIndex * SEGMENT_ANGLE) % 360 + 360) % 360
  const currentMod = ((currentRotation % 360) + 360) % 360
  const angleDelta = (targetMod - currentMod + 360) % 360
  return currentRotation + MIN_FULL_SPINS * 360 + angleDelta
}

interface WheelProps {
  targetIndex: number
  durationMs: number
  onSpinComplete: () => void
}

export function Wheel({ targetIndex, durationMs, onSpinComplete }: WheelProps) {
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    // RAF defers the rotation change to a frame after the initial commit so the
    // CSS transition has a stable starting value to interpolate from.
    const handle = requestAnimationFrame(() => {
      setRotation((prev) => rotationForSegment(prev, targetIndex))
    })
    return () => cancelAnimationFrame(handle)
  }, [targetIndex])

  return (
    <div className="relative mx-auto h-80 w-80">
      <div
        aria-hidden
        className="absolute left-1/2 top-0 z-10 h-6 w-5 -translate-x-1/2"
        style={{
          background: 'rgb(248 250 252)',
          clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
          filter: 'drop-shadow(0 2px 4px rgb(0 0 0 / 0.5))',
        }}
      />
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="h-full w-full drop-shadow-2xl"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: `transform ${durationMs}ms cubic-bezier(0.18, 0.74, 0.24, 1)`,
        }}
        onTransitionEnd={onSpinComplete}
      >
        {WHEEL_CATEGORIES.map((cat, i) => {
          const [lx, ly] = polar(i * SEGMENT_ANGLE, LABEL_RADIUS)
          return (
            <g key={cat.id}>
              <path
                d={segmentPath(i)}
                fill={SEGMENT_COLORS[i]}
                stroke="rgb(15 23 42 / 0.6)"
                strokeWidth={2}
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgb(15 23 42)"
                fontSize={16}
                fontWeight={700}
              >
                {cat.short}
              </text>
            </g>
          )
        })}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={20}
          fill="rgb(15 23 42)"
          stroke="white"
          strokeWidth={2}
        />
      </svg>
    </div>
  )
}
