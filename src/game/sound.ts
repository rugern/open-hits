// Carnival-wheel "tick" sounds, scheduled along the same cubic-bezier easing
// the Wheel's CSS transition uses, so the tick rate visibly matches the wheel
// decelerating to a stop.

let audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext | null {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    return audioCtx
  }
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Ctor) return null
  audioCtx = new Ctor()
  if (audioCtx.state === 'suspended') void audioCtx.resume()
  return audioCtx
}

// Cubic-bezier(0.18, 0.74, 0.24, 1) — same easing the Wheel uses.
const P1X = 0.18
const P1Y = 0.74
const P2X = 0.24
const P2Y = 1.0

function bez(t: number, c1: number, c2: number): number {
  const omt = 1 - t
  return 3 * omt * omt * t * c1 + 3 * omt * t * t * c2 + t * t * t
}

const LUT_SAMPLES = 200
const LUT: { time: number; progress: number }[] = (() => {
  const lut: { time: number; progress: number }[] = []
  for (let i = 0; i <= LUT_SAMPLES; i++) {
    const t = i / LUT_SAMPLES
    lut.push({ time: bez(t, P1X, P2X), progress: bez(t, P1Y, P2Y) })
  }
  return lut
})()

// Returns normalized time (0..1) at which the easing reaches `progress`.
function timeAtProgress(progress: number): number {
  if (progress <= 0) return 0
  if (progress >= 1) return 1
  let lo = 0
  let hi = LUT.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (LUT[mid]!.progress < progress) lo = mid + 1
    else hi = mid
  }
  if (lo === 0) return LUT[0]!.time
  const prev = LUT[lo - 1]!
  const curr = LUT[lo]!
  const span = curr.progress - prev.progress
  if (span === 0) return prev.time
  const frac = (progress - prev.progress) / span
  return prev.time + frac * (curr.time - prev.time)
}

// One tick per this many degrees of rotation. 30° → 12 ticks per turn,
// roughly matches a real carnival wheel's peg density.
const TICK_ANGLE_DEG = 30

// Schedules tick sounds for an upcoming wheel spin. Returns a cancel function
// that aborts any not-yet-played ticks (e.g. on unmount).
export function scheduleSpinTicks(
  durationMs: number,
  distanceDeg: number,
): () => void {
  const ctx = getAudioCtx()
  if (!ctx) return () => {}

  const distance = Math.abs(distanceDeg)
  if (distance === 0 || durationMs <= 0) return () => {}

  const tickCount = Math.floor(distance / TICK_ANGLE_DEG)
  const sources: AudioScheduledSourceNode[] = []
  const now = ctx.currentTime

  for (let i = 1; i <= tickCount; i++) {
    const progress = (i * TICK_ANGLE_DEG) / distance
    if (progress > 1) break
    const normalizedTime = timeAtProgress(progress)
    const startTime = now + (normalizedTime * durationMs) / 1000

    // A short percussive "thock". Triangle wave is gentler than square; quick
    // exponential decay gives a peg-against-pointer transient.
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1200, startTime)
    osc.frequency.exponentialRampToValueAtTime(700, startTime + 0.02)

    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(0.18, startTime + 0.001)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.035)

    osc.connect(gain).connect(ctx.destination)
    osc.start(startTime)
    osc.stop(startTime + 0.05)

    sources.push(osc)
  }

  return () => {
    for (const src of sources) {
      try {
        src.stop()
      } catch {
        // Already stopped or the schedule passed; nothing to do.
      }
    }
  }
}
