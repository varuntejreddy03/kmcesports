'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMatches()

    const channel = supabase
      .channel('matches-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        fetchMatches()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select(`
        *,
        team_a:teams!team_a_id(id, name),
        team_b:teams!team_b_id(id, name),
        winner:teams!winner_id(id, name)
      `)
      .order('round', { ascending: true })
      .order('match_number', { ascending: true })

    if (data) setMatches(data)
    setLoading(false)
  }

  const getRoundName = (round: number, allMatches: any[]) => {
    const roundMatches = allMatches.filter(m => m.round === round)
    const count = roundMatches.length
    if (round === 0) return 'Play-in Round'
    if (count === 1) return 'Final'
    if (count === 2) return 'Semifinals'
    if (count <= 4) return 'Quarterfinals'
    return `Round of ${count * 2}`
  }

  const groupedByRound = matches.reduce((acc: Record<number, any[]>, match) => {
    const round = match.round ?? 0
    if (!acc[round]) acc[round] = []
    acc[round].push(match)
    return acc
  }, {})

  const sortedRounds = Object.keys(groupedByRound)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1a]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between">
          <Link href="/" className="text-lg md:text-xl font-black tracking-tighter">
            <span className="text-cricket-500">KMCE</span>Cricket
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors min-h-[44px] flex items-center">
              ← Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-20 md:pt-24 pb-16 px-3 md:px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <div className="text-cricket-500 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] mb-3 md:mb-4">Tournament</div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              Match <span className="text-cricket-500">Schedule & Results</span>
            </h1>
            <p className="text-slate-500 text-xs md:text-sm mt-3 max-w-lg mx-auto">
              Follow the knockout bracket from Play-in to Final
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="text-4xl animate-pulse mb-4">🏏</div>
              <div className="text-slate-500 text-sm">Loading matches...</div>
            </div>
          ) : matches.length === 0 ? (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl md:rounded-[40px] py-12 md:py-20 text-center px-4">
              <div className="text-5xl md:text-6xl mb-4 md:mb-6 opacity-20">🏏</div>
              <h3 className="text-lg md:text-2xl font-black text-slate-400 uppercase tracking-widest mb-2">Schedule Coming Soon</h3>
              <p className="text-slate-600 text-xs md:text-sm max-w-md mx-auto">
                Tournament fixtures will be announced once team registrations close. Stay tuned!
              </p>
            </div>
          ) : (
            <div className="space-y-10 md:space-y-16">
              {sortedRounds.map((round) => {
                const roundMatches = groupedByRound[round]
                const roundName = getRoundName(round, matches)
                const isFinal = roundName === 'Final'

                return (
                  <div key={round}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`px-4 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest ${isFinal ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        round === 0 ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30' :
                          'bg-cricket-500/20 text-cricket-400 border border-cricket-500/30'
                        }`}>
                        {roundName}
                      </div>
                      <div className="flex-1 h-px bg-white/5"></div>
                      <div className="text-[10px] text-slate-600 font-bold">{roundMatches.length} {roundMatches.length === 1 ? 'Match' : 'Matches'}</div>
                    </div>

                    <div className={`grid gap-4 md:gap-6 ${isFinal ? 'grid-cols-1 max-w-lg mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
                      {roundMatches.map((match: any) => {
                        const isCompleted = match.status === 'completed'
                        const winnerIsA = match.winner_id && match.winner_id === match.team_a?.id
                        const winnerIsB = match.winner_id && match.winner_id === match.team_b?.id

                        return (
                          <div key={match.id} className={`relative border rounded-2xl md:rounded-3xl p-5 md:p-6 transition-all ${isCompleted ? 'bg-white/[0.03] border-white/10' :
                            isFinal ? 'bg-yellow-500/5 border-yellow-500/20' :
                              'bg-white/5 border-white/10 hover:bg-white/[0.08]'
                            }`}>
                            {isCompleted && (
                              <div className="absolute top-3 right-3 px-2 py-0.5 bg-green-500/20 text-green-400 text-[9px] font-black uppercase tracking-widest rounded-full">
                                Completed
                              </div>
                            )}
                            {!isCompleted && !match.team_a && !match.team_b && (
                              <div className="absolute top-3 right-3 px-2 py-0.5 bg-slate-500/20 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-full">
                                Upcoming
                              </div>
                            )}

                            <div className="flex justify-between items-center mb-4 md:mb-5">
                              <div className="flex flex-col gap-1">
                                <div className="text-[10px] md:text-xs font-black text-cricket-400 bg-cricket-500/10 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full inline-block w-fit">
                                  {match.match_date ? new Date(match.match_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'}
                                </div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                                  Match Pair
                                </div>
                              </div>
                              <div className="text-[10px] md:text-xs font-bold text-slate-500">
                                {match.match_time ? `${match.match_time.slice(0, 5)} IST` : ''}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 md:gap-4 mb-3">
                              <div className={`flex-1 text-center min-w-0 py-2 px-2 rounded-xl ${winnerIsA ? 'bg-cricket-500/10 border border-cricket-500/20' : ''}`}>
                                <div className={`text-sm md:text-lg font-black uppercase truncate ${winnerIsA ? 'text-cricket-400' : winnerIsB ? 'text-slate-600' : 'text-white'
                                  }`}>
                                  {match.team_a?.name || 'TBA'}
                                </div>
                                {winnerIsA && <div className="text-[9px] text-cricket-500 font-black mt-1">🏆 WINNER</div>}
                              </div>
                              <div className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-[10px] md:text-xs font-black flex-shrink-0 ${isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-cricket-600/20 text-cricket-500'
                                }`}>
                                {isCompleted ? '✓' : 'VS'}
                              </div>
                              <div className={`flex-1 text-center min-w-0 py-2 px-2 rounded-xl ${winnerIsB ? 'bg-cricket-500/10 border border-cricket-500/20' : ''}`}>
                                <div className={`text-sm md:text-lg font-black uppercase truncate ${winnerIsB ? 'text-cricket-400' : winnerIsA ? 'text-slate-600' : 'text-white'
                                  }`}>
                                  {match.team_b?.name || 'TBA'}
                                </div>
                                {winnerIsB && <div className="text-[9px] text-cricket-500 font-black mt-1">🏆 WINNER</div>}
                              </div>
                            </div>

                            {match.result_margin && (
                              <div className="text-center text-[10px] md:text-xs font-bold text-slate-400 mb-3">
                                Won by {match.result_margin}
                              </div>
                            )}

                            <div className="text-center text-[10px] md:text-xs font-bold text-slate-500 pt-3 border-t border-white/5 truncate">
                              📍 {match.venue || 'Main Ground'}
                            </div>

                            {match.score_link && (
                              <div className="mt-3 pt-3 border-t border-white/5 text-center">
                                <a
                                  href={match.score_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1.5 px-4 py-2 bg-cricket-500/20 hover:bg-cricket-500/40 text-cricket-400 hover:text-cricket-300 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all min-h-[40px] ${!isCompleted ? 'animate-pulse' : ''}`}
                                >
                                  📊 {isCompleted ? 'Scorecard' : 'Live Score'}
                                </a>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
