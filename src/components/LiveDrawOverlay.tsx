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

type DrawPhase = 'idle' | 'spinning' | 'drawing' | 'bracket'

const Confetti = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[110] overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: ['#ffd700', '#ff0000', '#00ff00', '#0000ff', '#ff00ff'][Math.floor(Math.random() * 5)],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  )
}

export default function LiveDrawOverlay() {
  const [active, setActive] = useState(false)
  const [phase, setPhase] = useState<DrawPhase>('idle')
  const [spinningTeams, setSpinningTeams] = useState<TeamInfo[]>([])
  const [drawnTeams, setDrawnTeams] = useState<TeamInfo[]>([])
  const [currentDrawIndex, setCurrentDrawIndex] = useState(0)
  const [totalTeams, setTotalTeams] = useState(0)
  const [bracketRounds, setBracketRounds] = useState<RoundInfo[]>([])
  const [byeTeams, setByeTeams] = useState<TeamInfo[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [activeTab, setActiveTab] = useState('CSM') // Default to CSM
  const [showInfo, setShowInfo] = useState(false)

  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
  }

  useEffect(() => {
    fetchPersistedState()

    const channel = supabase.channel('live-draw', {
      config: { broadcast: { self: false } }
    })

    channel
      .on('broadcast', { event: 'draw_start' }, ({ payload }) => {
        handleDrawStart(payload)
      })
      .on('broadcast', { event: 'draw_shuffle_done' }, ({ payload }) => {
        handleShuffleDone(payload)
      })
      .on('broadcast', { event: 'team_drawn' }, ({ payload }) => {
        handleTeamDrawn(payload)
      })
      .on('broadcast', { event: 'bracket_complete' }, ({ payload }) => {
        handleBracketComplete(payload)
      })
      .on('broadcast', { event: 'draw_end' }, () => {
        handleDrawEnd()
      })

    channel.subscribe()

    return () => {
      clearTimers()
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchPersistedState = async () => {
    try {
      const { data } = await supabase
        .from('tournament_settings')
        .select('draw_state')
        .eq('sport', 'cricket')
        .maybeSingle()

      if (data?.draw_state?.active) {
        const ds = data.draw_state
        setActive(true)
        setPhase(ds.phase || 'idle')
        setSpinningTeams(ds.teams || [])
        setDrawnTeams(ds.drawnTeams || [])
        setCurrentDrawIndex(ds.currentDrawIndex || 0)
        setTotalTeams(ds.totalTeams || 0)
        setBracketRounds(ds.bracket || [])
        setByeTeams(ds.byeTeams || [])

        if (ds.phase === 'spinning') {
          spinIntervalRef.current = setInterval(() => {
            setSpinningTeams(prev => shuffleArray(prev))
          }, 100)
        }
      }
    } catch (err) {
      console.error('Error fetching persisted draw state:', err)
    }
  }

  const handleDrawStart = (payload: any) => {
    clearTimers()
    setActive(true)
    setPhase('spinning')
    setSpinningTeams(payload.teams)
    setDrawnTeams([])
    setCurrentDrawIndex(0)
    setTotalTeams(payload.totalTeams)
    setBracketRounds([])
    setByeTeams([])

    spinIntervalRef.current = setInterval(() => {
      setSpinningTeams(prev => shuffleArray(prev))
    }, 100)
  }

  const handleShuffleDone = (payload: any) => {
    if (spinIntervalRef.current) { clearInterval(spinIntervalRef.current); spinIntervalRef.current = null }
    setPhase('drawing')
    setSpinningTeams(payload.orderedTeams)
    setDrawnTeams([])
    setCurrentDrawIndex(0)
  }

  const handleTeamDrawn = (payload: any) => {
    setDrawnTeams(prev => [...prev, payload.team])
    setSpinningTeams(prev => prev.filter((t: TeamInfo) => t.id !== payload.team.id))
    setCurrentDrawIndex(payload.index + 1)
    setTotalTeams(payload.total)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }

  const handleBracketComplete = (payload: any) => {
    setPhase('bracket')
    setBracketRounds(payload.bracket)
    setByeTeams(payload.byeTeams || [])
  }

  const handleDrawEnd = () => {
    clearTimers()
    setActive(false)
    setPhase('idle')
  }

  if (!active) return null

  return (
    <div className="fixed inset-0 bg-[#020617]/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fadeIn">
      {showConfetti && <Confetti />}
      <div className="bg-[#0a0f1a] border border-white/10 rounded-[40px] p-6 md:p-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cricket-500 to-transparent opacity-50"></div>
        <div className="text-center mb-6 relative">
          <div className="inline-block bg-cricket-500/20 border border-cricket-500/40 rounded-full px-4 py-1.5 mb-3">
            <span className="text-[10px] font-black text-cricket-400 uppercase tracking-widest animate-pulse">
              🔴 LIVE
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tight text-white">
            {phase === 'spinning' && 'SHUFFLING TEAMS...'}
            {phase === 'drawing' && `Drawing Team ${currentDrawIndex} of ${totalTeams}...`}
            {phase === 'bracket' && 'Knockout Bracket'}
          </h2>

          {/* Info Button */}
          {/* Info Button */}
          <div className="absolute right-0 top-0">
            <button
              onClick={() => setShowInfo(true)}
              className="bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-all border border-white/10"
            >
              <span className="font-bold text-xs">?</span>
            </button>
          </div>
        </div>

        {/* Info Modal */}
        {showInfo && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#0a0f1a] border border-white/10 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl relative">
              <button
                onClick={() => setShowInfo(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              >
                ✕
              </button>

              <div className="text-center mb-6">
                <h3 className="text-xl font-black text-cricket-500 uppercase tracking-widest mb-1">Tournament Format</h3>
                <div className="h-0.5 w-12 bg-cricket-500/50 mx-auto rounded-full"></div>
              </div>

              <div className="space-y-6 text-sm text-slate-300">
                <div>
                  <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-2 border-l-2 border-cricket-500 pl-2">Stage 1: Dept Qualifiers</h4>
                  <ul className="space-y-2 ml-2">
                    <li className="flex justify-between">
                      <span>CSM (8 Teams)</span>
                      <span className="text-white font-mono opacity-60">QF → SF → Final</span>
                    </li>
                    <li className="flex justify-between">
                      <span>CSE (5 Teams)</span>
                      <span className="text-white font-mono opacity-60">Elim → SF → Final</span>
                    </li>
                    <li className="flex justify-between">
                      <span>ECE (2 Teams)</span>
                      <span className="text-white font-mono opacity-60">Final Match</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-2 border-l-2 border-cricket-500 pl-2">Stage 2: Grand Finals</h4>
                  <p className="opacity-80">The 3 Department Winners compete in a final knockout stage to determine the champion.</p>
                </div>

                <div className="bg-white/5 rounded-lg p-3 border border-white/10 mt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-blue-400">ℹ️</span>
                    <span className="font-bold text-white text-xs uppercase tracking-wide">Fair Play System</span>
                  </div>
                  <p className="text-xs opacity-70 leading-relaxed">
                    All matchups are generated using a <strong>secure randomized draw algorithm</strong>. Team positions and pairings are completely shuffled to ensure fair competition.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {phase === 'spinning' && (
          <div className="relative h-[300px] w-full flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-cricket-500/10 to-transparent pointer-events-none"></div>
            {/* The Vortex */}
            <div className="relative w-full h-full">
              {spinningTeams.slice(0, 12).map((team, idx) => (
                <div
                  key={`vortex-${idx}-${team.id}`}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-vortex"
                  style={{
                    animationDelay: `${idx * 0.25}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                >
                  <div
                    className="whitespace-nowrap font-black text-sm md:text-xl uppercase italic tracking-tighter text-cricket-400 opacity-80"
                    style={{ transform: `translateX(${Math.cos(idx) * 120}px) translateY(${Math.sin(idx) * 120}px)` }}
                  >
                    {team.name}
                  </div>
                </div>
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border-2 border-cricket-500/20 animate-pulse bg-cricket-500/5"></div>
              </div>
            </div>
          </div>
        )}

        {phase === 'drawing' && (
          <div className="animate-pop-in">
            <div className="relative h-24 bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col animate-slot text-center">
                  {/* Ticker of names */}
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="py-2">
                      {spinningTeams.map((t, tidx) => (
                        <div key={`${i}-${tidx}`} className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-white opacity-20 py-2">
                          {t.name}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 pointer-events-none border-y-4 border-cricket-500/30 flex items-center justify-center bg-gradient-to-b from-[#0f172a] via-transparent to-[#0f172a]">
                <div className="w-full h-px bg-cricket-500/50"></div>
              </div>
            </div>
            {drawnTeams.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Validated Squads</div>
                  <div className="flex-1 h-px bg-white/10"></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {drawnTeams.map((team, idx) => (
                    <div
                      key={team.id}
                      className="bg-cricket-500/10 border border-cricket-500/20 rounded-2xl p-4 text-center animate-pop-in relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                        <span className="text-2xl font-black italic">#{idx + 1}</span>
                      </div>
                      <div className="text-[9px] font-black text-cricket-500 uppercase tracking-widest mb-1">Entry #{idx + 1}</div>
                      <div className="font-black text-xs md:text-sm uppercase italic tracking-tight truncate text-white">{team.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {spinningTeams.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Awaiting Draw</div>
                  <div className="flex-1 h-px bg-white/5"></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {spinningTeams.map((team) => (
                    <div key={team.id} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                      <div className="font-black text-xs uppercase tracking-tight truncate text-slate-400">{team.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'bracket' && (
          <div className="animate-fadeIn">
            {/* Bracket Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {['CSM', 'CSE', 'ECE', 'FINALS'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab
                    ? 'bg-cricket-500 text-white shadow-lg'
                    : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-6 mb-6">
              {bracketRounds
                .filter(round => {
                  if (activeTab === 'FINALS') return round.name.includes('Inter-Dept') || round.name.includes('Grand Final')
                  if (activeTab === 'CSM') return round.name.includes('CSM')
                  if (activeTab === 'CSE') return round.name.includes('CSE')
                  if (activeTab === 'ECE') return round.name.includes('ECE')
                  // Only fallback to showing all if tab is unexpected, or random draw (no dept name)
                  if (!round.name.includes('CSM') && !round.name.includes('CSE') && !round.name.includes('ECE') && !round.name.includes('Inter-Dept') && !round.name.includes('Grand')) return true
                  return false
                })
                .map((round, roundIdx) => (
                  <div key={roundIdx} className="animate-fadeIn">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-[10px] font-black text-cricket-500 uppercase tracking-widest">
                        {(round.matches[0] as any)?.group ? <span className="text-white/80 mr-2">{(round.matches[0] as any).group}</span> : null}
                        {round.name}
                      </div>
                      <div className="flex-1 h-px bg-white/10"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {round.matches.map((match: any, matchIdx) => (
                        <div key={matchIdx} className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Match {match.match_num < 10 ? `0${match.match_num}` : match.match_num}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 text-center">
                              <div className={`font-black text-xs uppercase tracking-tight truncate ${match.team_a ? 'text-white' : 'text-slate-600 italic'}`}>
                                {match.team_a?.name || match.team_a_label || (match.source_match_a ? `Winner of Match ${match.source_match_a}` : (() => {
                                  // Complex generic logic for non-specific brackets might be broken by filtering rounds index-wise
                                  // But inter-dept has specific labels/source matches, so we rely on those!
                                  const prevRound = bracketRounds[roundIdx - 1] // Warning: roundIdx here is from filter map? No, map arg.
                                  // Actually, standard random draw won't work well with this generic logic if filtered. 
                                  // But inter-dept uses source_match_a significantly. 
                                  // Let's keep TBD fallback but rely on source_match.
                                  return 'TBD'
                                })())}
                              </div>
                              {match.is_bye && (
                                <span className="inline-block mt-1 text-[8px] font-black text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded uppercase tracking-widest">BYE</span>
                              )}
                            </div>
                            <div className="px-2 text-slate-600 font-black text-[10px]">VS</div>
                            <div className="flex-1 text-center">
                              <div className={`font-black text-xs uppercase tracking-tight truncate ${match.team_b ? 'text-white' : 'text-slate-600 italic'}`}>
                                {match.team_b?.name || match.team_b_label || (match.source_match_b ? `Winner of Match ${match.source_match_b}` : (() => {
                                  return 'TBD'
                                })())}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              {/* Show empty state if no matches for tab */}
              {bracketRounds.filter(round => {
                if (activeTab === 'FINALS') return round.name.includes('Inter-Dept') || round.name.includes('Grand Final')
                if (activeTab === 'CSM') return round.name.includes('CSM')
                if (activeTab === 'CSE') return round.name.includes('CSE')
                if (activeTab === 'ECE') return round.name.includes('ECE')
                return false
              }).length === 0 && bracketRounds.length > 0 && (activeTab === 'CSM' || activeTab === 'CSE' || activeTab === 'ECE' || activeTab === 'FINALS') && (
                  <div className="text-center py-8 text-slate-500 text-xs font-bold uppercase tracking-widest">
                    No matches scheduled for this stage
                  </div>
                )}
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
          </div>
        )}
      </div>
    </div>
  )
}
