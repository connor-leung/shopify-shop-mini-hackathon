import React, { useEffect } from 'react'
import { GameResults } from './ConnectionsGame'

interface ConnectionsResultsProps {
  results: GameResults
  onPlayAgain: () => void
  onBackHome?: () => void
}

interface LifetimeStats {
  gamesPlayed: number
  gamesWon: number
  totalTime: number // seconds
  totalMistakes: number
  totalGuesses: number
}

function loadStats(): LifetimeStats {
  const stored = localStorage.getItem('connections-stats')
  if (stored) return JSON.parse(stored)
  return { gamesPlayed: 0, gamesWon: 0, totalTime: 0, totalMistakes: 0, totalGuesses: 0 }
}

function saveStats(stats: LifetimeStats) {
  localStorage.setItem('connections-stats', JSON.stringify(stats))
}

export default function ConnectionsResults({ results, onPlayAgain, onBackHome }: ConnectionsResultsProps) {
  const { won, mistakes, elapsedSeconds, totalGuesses, solvedCategories } = results

  // Persist lifetime stats once on mount
  useEffect(() => {
    const stats = loadStats()
    stats.gamesPlayed += 1
    if (won) stats.gamesWon += 1
    stats.totalTime += elapsedSeconds
    stats.totalMistakes += mistakes
    stats.totalGuesses += totalGuesses
    saveStats(stats)
  }, [])

  const shareText = `Shopify Connections – ${won ? 'Won' : 'Lost'} in ${elapsedSeconds}s with ${mistakes} mistakes. Can you beat me?`

  const lifetime = loadStats()

  return (
    <div className="pt-12 px-4 pb-8 max-w-xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">{won ? 'You Win! 🎉' : 'Game Over'}</h1>

      <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
        <p className="mb-1"><strong>Time:</strong> {elapsedSeconds}s</p>
        <p className="mb-1"><strong>Mistakes:</strong> {mistakes}</p>
        <p className="mb-1"><strong>Total Guesses:</strong> {totalGuesses}</p>
        <p className="mb-2"><strong>Solved Categories:</strong></p>
        <ul className="list-disc list-inside ml-4">
          {solvedCategories.map((c) => (
            <li key={c.category}>{c.difficulty} – {c.category}</li>
          ))}
        </ul>
      </div>

      {/* Share */}
      <button
        onClick={() => navigator.clipboard.writeText(shareText)}
        className="w-full mb-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Copy Results & Share
      </button>

      {/* Play again */}
      <button
        onClick={onPlayAgain}
        className="w-full mb-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Play Again
      </button>

      {onBackHome && (
        <button className="text-sm text-blue-600 underline" onClick={onBackHome}>Back Home</button>
      )}

      {/* Lifetime */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4 text-left">
        <h2 className="font-semibold mb-2">Lifetime Stats</h2>
        <p className="mb-1"><strong>Games Played:</strong> {lifetime.gamesPlayed}</p>
        <p className="mb-1"><strong>Games Won:</strong> {lifetime.gamesWon}</p>
        <p className="mb-1"><strong>Average Time:</strong> {lifetime.gamesPlayed ? Math.round(lifetime.totalTime / lifetime.gamesPlayed) : 0}s</p>
        <p className="mb-1"><strong>Total Mistakes:</strong> {lifetime.totalMistakes}</p>
        <p className="mb-1"><strong>Total Guesses:</strong> {lifetime.totalGuesses}</p>
      </div>
    </div>
  )
}
