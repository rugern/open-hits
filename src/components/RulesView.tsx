import { Link } from 'react-router-dom'

export function RulesView() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-6">
      <header className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black tracking-tight">
          Open <span className="text-emerald-400">Hits</span>
        </h1>
        <Link
          to="/"
          className="whitespace-nowrap rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
        >
          ← Back
        </Link>
      </header>

      <div className="mt-10 space-y-12">
        <RuleSection
          eyebrow="One person"
          title="Host"
          summary="Picks the music and runs the wheel. Spotify Premium required."
          steps={[
            'Tap "Start as host" on the landing page and connect your Spotify account.',
            'Pick a playlist. Songs from it will play in random order during the game.',
            'Choose which Spotify device to play through (phone, desktop, smart speaker).',
            'Each round: tap the wheel to spin. Music starts when it lands. The category — artist, title, exact year, year ±3, or decade — decides what players have to guess.',
            'You can participate as a guesser by using the "Bingo" button in the header.',
            'When the table is ready, tap "Reveal" to show the song info. Tap "Continue" for the next round.',
          ]}
        />

        <RuleSection
          eyebrow="Everyone else"
          title="Player"
          summary="Plays along on their own phone with a bingo card. No Spotify needed."
          steps={[
            'Open the same site and tap "Join game". You get a 5×5 bingo card with five colored categories (5 squares each).',
            'Each round, listen to the host\'s song and try to guess whatever the wheel landed on. Type your answer into the input below the card without revealing your answer just yet.',
            'When everyone\'s ready to compare, rotate your phone to landscape. Your typed guess fills the screen so the table can read it from across the room.',
            'After the host reveals the answer, if you guessed correctly tap the matching color to mark it.',
            'When you have marked 5 squares in a row, column, or diagonal, you yell BINGO loud enough for the neighbours to hear it, and you have won!',
          ]}
        />
      </div>
    </main>
  )
}

function RuleSection({
  eyebrow,
  title,
  summary,
  steps,
}: {
  eyebrow: string
  title: string
  summary: string
  steps: string[]
}) {
  return (
    <section>
      <p className="text-xs uppercase tracking-wide text-slate-500">{eyebrow}</p>
      <h2 className="mt-1 text-3xl font-black tracking-tight">{title}</h2>
      <p className="mt-2 text-slate-300">{summary}</p>
      <ol className="mt-6 space-y-3 text-slate-200">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="font-mono text-emerald-400">{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
