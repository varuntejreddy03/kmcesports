'use client'

import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface TeamInfo {
  id: string
  name: string
}

interface MatchInfo {
  match_num: number
  team_a: TeamInfo | null
  team_b: TeamInfo | null
  round_name: string
  is_bye?: boolean
}

interface RoundInfo {
  name: string
  matches: MatchInfo[]
}

type DrawPhase = 'idle' | 'spinning' | 'drawing' | 'bracket' | 'picking' | 'pick_done'

export default function LiveDrawOverlay() {
  const [active, setActive] = useState(false)
  const [phase, setPhase] = useState<DrawPhase>('idle')
  const [allTeams, setAllTeams] = useState<TeamInfo[]>([])
  const [spinningTeams, setSpinningTeams] = useState<TeamInfo[]>([])
  const [drawnTeams, setDrawnTeams] = useState<TeamInfo[]>([])
  const [currentDrawIndex, setCurrentDrawIndex] = useState(0)
  const [totalTeams, setTotalTeams] = useState(0)
  const [bracketRounds, setBracketRounds] = useState<RoundInfo[]>([])
  const [byeTeams, setByeTeams] = useState<TeamInfo[]>([])

  const [pickTeams, setPickTeams] = useState<TeamInfo[]>([])
  const [pickHighlightIndex, setPickHighlightIndex] = useState(0)
  const [pickedTeam, setPickedTeam] = useState<TeamInfo | null>(null)
  const [pickPhase, setPickPhase] = useState<'idle' | 'spinning' | 'slowing' | 'done'>('idle')

  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pickIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const shuffleArray = (arr: TeamInfo[]) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const clearTimers = () => {
    if (spinIntervalRef.current) { clearInterval(spinIntervalRef.current); spinIntervalRef.current = null }
    if (pickIntervalRef.current) { clearInterval(pickIntervalRef.current); pickIntervalRef.current = null }
    if (pickTimeoutRef.current) { clearTimeout(pickTimeoutRef.current); pickTimeoutRef.current = null }
  }

  useEffect(() => {
    const channel = supabase.channel('live-draw', {
      config: { broadcast: { self: false } }
    })

    channel
      .on('broadcast', { event: 'draw_start' }, ({ payload }) => {
        clearTimers()
        setActive(true)
        setPhase('spinning')
        setAllTeams(payload.teams)
        setSpinningTeams(payload.teams)
        setDrawnTeams([])
        setCurrentDrawIndex(0)
        setTotalTeams(payload.totalTeams)
        setBracketRounds([])
        setByeTeams([])
        setPickTeams([])
        setPickedTeam(null)
        setPickPhase('idle')

        spinIntervalRef.current = setInterval(() => {
          setSpinningTeams(prev => shuffleArray(prev))
        }, 100)
      })
      .on('broadcast', { event: 'draw_shuffle_done' }, ({ payload }) => {
        if (spinIntervalRef.current) { clearInterval(spinIntervalRef.current); spinIntervalRef.current = null }
        setPhase('drawing')
        setSpinningTeams(payload.orderedTeams)
        setDrawnTeams([])
        setCurrentDrawIndex(0)
      })
      .on('broadcast', { event: 'team_drawn' }, ({ payload }) => {
        setDrawnTeams(prev => [...prev, payload.team])
        setSpinningTeams(prev => prev.filter((t: TeamInfo) => t.id !== payload.team.id))
        setCurrentDrawIndex(payload.index + 1)
        setTotalTeams(payload.total)
      })
      .on('broadcast', { event: 'bracket_complete' }, ({ payload }) => {
        setPhase('bracket')
        setBracketRounds(payload.bracket)
        setByeTeams(payload.byeTeams || [])
        setPickTeams(payload.allTeams || [])
      })
      .on('broadcast', { event: 'pick_start' }, ({ payload }) => {
        setPhase('picking')
        setPickPhase('spinning')
        setPickedTeam(null)
        setPickHighlightIndex(0)
        const teams = payload.teams
        setPickTeams(teams)

        const winnerIndex = payload.winnerIndex
        const totalSpins = payload.totalSpins
        let counter = 0

        pickIntervalRef.current = setInterval(() => {
          setPickHighlightIndex(counter % teams.length)
          counter++

          if (counter >= totalSpins - teams.length) {
            if (pickIntervalRef.current) { clearInterval(pickIntervalRef.current); pickIntervalRef.current = null }
            setPickPhase('slowing')

            let slowCounter = counter
            const remaining = totalSpins - slowCounter
            let step = 0

            const slowStep = () => {
              if (step >= remaining) {
                setPickPhase('done')
                setPickHighlightIndex(winnerIndex)
                return
              }
              setPickHighlightIndex((slowCounter + step) % teams.length)
              step++
              const delay = 150 + step * 80
              pickTimeoutRef.current = setTimeout(slowStep, delay)
            }
            slowStep()
          }
        }, 60)
      })
      .on('broadcast', { event: 'pick_result' }, ({ payload }) => {
        clearTimers()
        setPhase('pick_done')
        setPickPhase('done')
        setPickedTeam(payload.team)
        if (payload.winnerIndex !== undefined) {
          setPickHighlightIndex(payload.winnerIndex)
        }
      })
      .on('broadcast', { event: 'draw_end' }, () => {
        clearTimers()
        setActive(false)
        setPhase('idle')
      })

    channel.subscribe()

    return () => {
      clearTimers()
      supabase.removeChannel(channel)
    }
  }, [])

  if (!active) return null

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#0f172a] border border-white/10 rounded-[32px] p-6 md:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="inline-block bg-cricket-500/20 border border-cricket-500/40 rounded-full px-4 py-1.5 mb-3">
            <span className="text-[10px] font-black text-cricket-400 uppercase tracking-widest animate-pulse">
              🔴 LIVE
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tight text-white">
            {phase === 'spinning' && 'SHUFFLING TEAMS...'}
            {phase === 'drawing' && `Drawing Team ${currentDrawIndex} of ${totalTeams}...`}
            {phase === 'bracket' && 'Knockout Bracket'}
            {phase === 'picking' && '🎯 PICKING FIRST TEAM...'}
            {phase === 'pick_done' && '🎯 FIRST TEAM SELECTED!'}
          </h2>
        </div>

        {phase === 'spinning' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {spinningTeams.map((team, idx) => (
              <div
                key={`spin-${idx}-${team.id}`}
                className="bg-white/5 border border-cricket-500/40 rounded-xl p-3 text-center transition-all animate-pulse"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="font-black text-xs uppercase tracking-tight truncate text-cricket-300">{team.name}</div>
              </div>
            ))}
          </div>
        )}

        {phase === 'drawing' && (
          <div>
            {drawnTeams.length > 0 && (
              <div className="mb-4">
                <div className="text-[9px] font-black text-cricket-500 uppercase tracking-widest mb-2">Drawn</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {drawnTeams.map((team, idx) => (
                    <div key={team.id} className="bg-cricket-500/20 border border-cricket-500/30 rounded-xl p-3 text-center animate-fadeIn">
                      <div className="text-[9px] font-black text-cricket-500/60 mb-0.5">#{idx + 1}</div>
                      <div className="font-black text-xs uppercase tracking-tight truncate text-white">{team.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {spinningTeams.length > 0 && (
              <div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Remaining</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {spinningTeams.map((team) => (
                    <div key={team.id} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                      <div className="font-black text-xs uppercase tracking-tight truncate text-slate-400">{team.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {(phase === 'bracket' || phase === 'picking' || phase === 'pick_done') && (
          <div className="animate-fadeIn">
            <div className="space-y-6 mb-6">
              {bracketRounds.map((round, roundIdx) => (
                <div key={roundIdx}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-[10px] font-black text-cricket-500 uppercase tracking-widest">{round.name}</div>
                    <div className="flex-1 h-px bg-white/10"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {round.matches.map((match, matchIdx) => (
                      <div key={matchIdx} className="bg-white/5 border border-white/10 rounded-xl p-3">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                          Match {match.match_num}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 text-center">
                            <div className={`font-black text-xs uppercase tracking-tight truncate ${match.team_a ? 'text-white' : 'text-slate-600 italic'}`}>
                              {match.team_a ? match.team_a.name : (() => {
                                const prevRound = bracketRounds[roundIdx - 1]
                                if (prevRound) {
                                  const feedIdx = matchIdx * 2
                                  const feederMatch = prevRound.matches[feedIdx]
                                  if (feederMatch) return `W${feederMatch.match_num}`
                                }
                                return 'TBD'
                              })()}
                            </div>
                            {match.is_bye && match.team_a && (
                              <span className="inline-block mt-1 text-[8px] font-black text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded uppercase tracking-widest">BYE</span>
                            )}
                          </div>
                          <div className="px-2 text-slate-600 font-black text-[10px]">VS</div>
                          <div className="flex-1 text-center">
                            <div className={`font-black text-xs uppercase tracking-tight truncate ${match.team_b ? 'text-white' : 'text-slate-600 italic'}`}>
                              {match.team_b ? match.team_b.name : (() => {
                                const prevRound = bracketRounds[roundIdx - 1]
                                if (prevRound) {
                                  const feedIdx = matchIdx * 2 + 1
                                  const feederMatch = prevRound.matches[feedIdx]
                                  if (feederMatch) return `W${feederMatch.match_num}`
                                }
                                return 'TBD'
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {byeTeams.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4 text-center">
                <div className="text-[9px] font-black text-yellow-500 uppercase tracking-widest mb-1">
                  Teams with Bye (Advance to Next Round)
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                  {byeTeams.map((t) => (
                    <span key={t.id} className="text-xs font-black text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-lg">{t.name}</span>
                  ))}
                </div>
              </div>
            )}

            {(phase === 'picking' || phase === 'pick_done') && (
              <div className="mt-6 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">🎯 First Team Selection</div>
                  <div className="flex-1 h-px bg-yellow-500/20"></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                  {pickTeams.map((team, idx) => {
                    const isHighlighted = (pickPhase === 'spinning' || pickPhase === 'slowing') && idx === pickHighlightIndex
                    const isWinner = pickPhase === 'done' && pickedTeam?.id === team.id
                    const isDimmed = pickPhase === 'done' && pickedTeam?.id !== team.id

                    return (
                      <div
                        key={team.id}
                        className={`border rounded-xl p-3 text-center transition-all duration-150 ${
                          isWinner
                            ? 'bg-cricket-500 border-cricket-400 scale-110 shadow-[0_0_30px_rgba(34,197,94,0.5)]'
                            : isHighlighted
                            ? 'bg-yellow-500/30 border-yellow-500/60 scale-105'
                            : isDimmed
                            ? 'bg-white/[0.02] border-white/5 opacity-30'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className={`font-black text-xs uppercase tracking-tight truncate ${
                          isWinner ? 'text-white' : isHighlighted ? 'text-yellow-300' : isDimmed ? 'text-slate-600' : ''
                        }`}>
                          {team.name}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {pickPhase === 'done' && pickedTeam && (
                  <div className="text-center mb-4 animate-fadeIn">
                    <div className="bg-cricket-500/20 border-2 border-cricket-500 rounded-2xl p-6 inline-block">
                      <div className="text-[10px] font-black text-cricket-400 uppercase tracking-widest mb-2">First Team</div>
                      <div className="text-2xl md:text-3xl font-black uppercase italic tracking-tight text-white">{pickedTeam.name}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
