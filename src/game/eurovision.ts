export type EurovisionStatus =
  | 'final'
  | 'DNQ'
  | 'DNS'
  | 'DSQ'
  | 'cancelled'
  | 'no-placement'

export interface EurovisionPlacement {
  rank: number | null
  status: EurovisionStatus
  semiFinalRank?: number
}

export interface EurovisionEntry {
  country: string
  artist: string
  song: string
  year: number
  placement: EurovisionPlacement
}

export interface EurovisionMatch {
  country: string
  year: number
  placement: EurovisionPlacement
}

export async function fetchEurovisionData(): Promise<EurovisionEntry[]> {
  const url = `${import.meta.env.BASE_URL}eurovision.json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`eurovision_fetch_${res.status}`)
  return (await res.json()) as EurovisionEntry[]
}

// Lowercase, strip diacritics, drop parenthetical/bracketed segments and
// " - suffix" tails (covers "Tattoo (Eurovision Version)" -> "tattoo",
// "Euphoria - Radio Edit" -> "euphoria"), then strip non-alphanumerics
// and collapse whitespace.
export function normalizeForMatch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s*[(\[][^)\]]*[)\]]\s*/g, ' ')
    .replace(/\s+-\s+.*$/, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function findEurovisionMatch(
  trackName: string,
  trackArtists: string[],
  entries: EurovisionEntry[],
): EurovisionMatch | null {
  const songNorm = normalizeForMatch(trackName)
  if (!songNorm) return null
  const artistNorms = trackArtists.map(normalizeForMatch).filter(Boolean)
  for (const entry of entries) {
    if (normalizeForMatch(entry.song) !== songNorm) continue
    const entryArtistNorm = normalizeForMatch(entry.artist)
    if (!entryArtistNorm) continue
    const overlap = artistNorms.some(
      (a) =>
        a === entryArtistNorm ||
        a.includes(entryArtistNorm) ||
        entryArtistNorm.includes(a),
    )
    if (overlap) {
      return {
        country: entry.country,
        year: entry.year,
        placement: entry.placement,
      }
    }
  }
  return null
}

export function formatPlacement(p: EurovisionPlacement): string {
  if (p.status === 'final' && p.rank != null) return `${ordinal(p.rank)} place`
  if (p.status === 'DNQ') return 'Did not qualify'
  if (p.status === 'DNS') return 'Not yet competed'
  if (p.status === 'DSQ') return 'Disqualified'
  if (p.status === 'cancelled') return 'Contest cancelled'
  return 'No final ranking'
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  const suffix = s[(v - 20) % 10] ?? s[v] ?? s[0]
  return `${n}${suffix}`
}
