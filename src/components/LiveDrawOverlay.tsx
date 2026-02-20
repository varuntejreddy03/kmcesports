'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
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
  team_a_label?: string
  team_b_label?: string
  source_match_a?: number
  source_match_b?: number
}

interface RoundInfo {
  name: string
  matches: MatchInfo[]
}

type DrawPhase = 'idle' | 'spinning' | 'drawing' | 'bracket'

/* ───── Audio Player ───── */
class DrawAudioPlayer {
  private suspenseAudio: HTMLAudioElement | null = null
  private revealAudio: HTMLAudioElement | null = null
  private fanfareAudio: HTMLAudioElement | null = null
  public isUnlocked = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.suspenseAudio = new Audio('/sounds/nikitakondrashev-suspense-248067.mp3')
      this.suspenseAudio.loop = true
      this.suspenseAudio.volume = 0.5
      this.suspenseAudio.preload = 'auto'

      this.revealAudio = new Audio('/sounds/reveal.mp3')
      this.revealAudio.volume = 0.7
      this.revealAudio.preload = 'auto'

      this.fanfareAudio = new Audio('/sounds/fanfare.mp3')
      this.fanfareAudio.volume = 0.6
      this.fanfareAudio.preload = 'auto'
    }
  }

  // This MUST be called from a user interaction (click) to unlock audio in browsers
  async unlock() {
    try {
      if (this.suspenseAudio) {
        this.suspenseAudio.muted = true
        await this.suspenseAudio.play()
        this.suspenseAudio.pause()
        this.suspenseAudio.muted = false
      }
      if (this.revealAudio) {
        this.revealAudio.muted = true
        await this.revealAudio.play()
        this.revealAudio.pause()
        this.revealAudio.muted = false
      }
      this.isUnlocked = true
      return true
    } catch (err) {
      console.warn('Audio unlock failed:', err)
      return false
    }
  }

  playSuspense() {
    if (!this.isUnlocked) return
    this.suspenseAudio?.play().catch(() => { })
  }

  stopSuspense() {
    if (this.suspenseAudio) {
      this.suspenseAudio.pause()
      this.suspenseAudio.currentTime = 0
    }
  }

  playReveal() {
    if (!this.isUnlocked) return
    if (this.revealAudio) {
      this.revealAudio.currentTime = 0
      this.revealAudio.play().catch(() => { })
    }
  }

  playFanfare() {
    if (!this.isUnlocked) return
    this.fanfareAudio?.play().catch(() => { })
  }

  cleanup() {
    this.stopSuspense()
    this.suspenseAudio = null
    this.revealAudio = null
    this.fanfareAudio = null
  }
}

/* ───── UI Components ───── */
const CyberBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
  </div>
)

const Confetti = () => (
  <div className="fixed inset-0 pointer-events-none z-[110] overflow-hidden">
    {[...Array(50)].map((_, i) => (
      <div
        key={i}
        className="absolute animate-confetti-fall"
        style={{
          left: `${Math.random() * 100}%`,
          top: '-20px',
          width: `${5 + Math.random() * 10}px`,
          height: `${10 + Math.random() * 10}px`,
          backgroundColor: ['#ffd700', '#ff6b6b', '#48dbfb', '#0ea5e9', '#a855f7'][Math.floor(Math.random() * 5)],
          borderRadius: '2px',
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: `${2 + Math.random() * 2}s`,
        }}
      />
    ))}
  </div>
)

const GlowingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-40 -left-40 w-80 h-80 bg-cricket-500/20 rounded-full blur-[120px] animate-pulse" />
    <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
  </div>
)

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
  const [activeTab, setActiveTab] = useState('CSM')
  const [showInfo, setShowInfo] = useState(false)
  const [latestTeam, setLatestTeam] = useState<TeamInfo | null>(null)
  const [slotName, setSlotName] = useState('')
  const [isRevealing, setIsRevealing] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const slotIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const revealingRef = useRef(false)
  const audioRef = useRef<DrawAudioPlayer | null>(null)
  const spinningTeamsRef = useRef<TeamInfo[]>([])
  const allTeamNamesRef = useRef<string[]>([])
  const drawQueueRef = useRef<any[]>([])

  const getAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = new DrawAudioPlayer()
    return audioRef.current
  }, [])

  const handleUnmute = async () => {
    const player = getAudio()
    const success = await player.unlock()
    if (success) {
      setIsMuted(false)
      if (phase === 'spinning' || phase === 'drawing') {
        player.playSuspense()
      }
    }
  }

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
    if (slotIntervalRef.current) { clearInterval(slotIntervalRef.current); slotIntervalRef.current = null }
    revealingRef.current = false
  }

  useEffect(() => {
    fetchPersistedState()
    const channel = supabase.channel('live-draw', { config: { broadcast: { self: false } } })
    channel
      .on('broadcast', { event: 'draw_start' }, ({ payload }) => handleDrawStart(payload))
      .on('broadcast', { event: 'draw_shuffle_done' }, ({ payload }) => handleShuffleDone(payload))
      .on('broadcast', { event: 'team_drawn' }, ({ payload }) => handleTeamDrawn(payload))
      .on('broadcast', { event: 'bracket_complete' }, ({ payload }) => handleBracketComplete(payload))
      .on('broadcast', { event: 'draw_end' }, () => handleDrawEnd())
    channel.subscribe()
    return () => {
      clearTimers()
      audioRef.current?.cleanup()
      supabase.removeChannel(channel)
    }
  }, [phase]) // Dependency on phase to ensure audio state is consistent

  const fetchPersistedState = async () => {
    try {
      const { data } = await supabase.from('tournament_settings').select('draw_state').eq('sport', 'cricket').maybeSingle()
      if (data?.draw_state?.active) {
        const ds = data.draw_state
        const teams = ds.teams || []
        setActive(true); setPhase(ds.phase || 'idle'); setSpinningTeams(teams)
        spinningTeamsRef.current = teams; allTeamNamesRef.current = teams.map((t: TeamInfo) => t.name)
        setDrawnTeams(ds.drawnTeams || []); setCurrentDrawIndex(ds.currentDrawIndex || 0)
        setTotalTeams(ds.totalTeams || 0); setBracketRounds(ds.bracket || []); setByeTeams(ds.byeTeams || [])
        if (ds.phase === 'spinning' || ds.phase === 'drawing') {
          // Autoplay will likely block this, so isMuted remains true
        }
        if (ds.phase === 'spinning') {
          spinIntervalRef.current = setInterval(() => setSpinningTeams(prev => shuffleArray(prev)), 100)
        }
      }
    } catch (err) { console.error('Error fetching state:', err) }
  }

  const handleDrawStart = (payload: any) => {
    clearTimers(); setActive(true); setPhase('spinning'); setSpinningTeams(payload.teams || [])
    spinningTeamsRef.current = payload.teams || []; allTeamNamesRef.current = (payload.teams || []).map((t: any) => t.name)
    setDrawnTeams([]); setCurrentDrawIndex(0); setTotalTeams(payload.totalTeams); setBracketRounds([]); setByeTeams([]); setLatestTeam(null); setIsRevealing(false); setSlotName('')
    getAudio().playSuspense()
    spinIntervalRef.current = setInterval(() => setSpinningTeams(prev => shuffleArray(prev)), 100)
  }

  const handleShuffleDone = (payload: any) => {
    if (spinIntervalRef.current) { clearInterval(spinIntervalRef.current); spinIntervalRef.current = null }
    setPhase('drawing'); setSpinningTeams(payload.orderedTeams || [])
    spinningTeamsRef.current = payload.orderedTeams || []; setDrawnTeams([]); setCurrentDrawIndex(0)
  }

  const processQueue = () => {
    if (drawQueueRef.current.length === 0) { revealingRef.current = false; return }
    const payload = drawQueueRef.current.shift()!; revealingRef.current = true
    setIsRevealing(true); setLatestTeam(null)
    const namePool = allTeamNamesRef.current.length > 0 ? [...allTeamNamesRef.current] : spinningTeamsRef.current.map(t => t.name)
    let count = 0; const maxCycles = 14
    slotIntervalRef.current = setInterval(() => {
      count++; setSlotName(namePool[Math.floor(Math.random() * namePool.length)])
      if (count >= maxCycles) {
        clearInterval(slotIntervalRef.current!); slotIntervalRef.current = null
        setSlotName(payload.team.name); setLatestTeam(payload.team); setIsRevealing(false)
        getAudio().playReveal(); setShowConfetti(true)
        setDrawnTeams(prev => prev.some(t => t.id === payload.team.id) ? prev : [...prev, payload.team])
        setSpinningTeams(prev => {
          const filtered = prev.filter((t: TeamInfo) => t.id !== payload.team.id)
          spinningTeamsRef.current = filtered; return filtered
        })
        setCurrentDrawIndex(payload.index + 1); setTotalTeams(payload.total)
        setTimeout(() => setShowConfetti(false), 3000)
        setTimeout(() => { setLatestTeam(null); processQueue() }, 2000)
      }
    }, 80)
  }

  const handleTeamDrawn = (payload: any) => {
    drawQueueRef.current.push(payload)
    if (!revealingRef.current) processQueue()
  }

  const handleBracketComplete = (payload: any) => {
    clearTimers(); drawQueueRef.current = []; setIsRevealing(false); setPhase('bracket')
    setBracketRounds(payload.bracket); setByeTeams(payload.byeTeams || [])
    getAudio().playFanfare()
  }

  const handleDrawEnd = () => {
    clearTimers(); getAudio().stopSuspense(); setActive(false); setPhase('idle'); setIsMuted(true)
  }

  if (!active) return null

  const progressPercent = totalTeams > 0 ? (currentDrawIndex / totalTeams) * 100 : 0

  const getDeptColor = (name: string) => {
    if (name.includes('CSM')) return 'from-blue-600/30 to-cyan-600/20 text-blue-400 border-blue-500/30'
    if (name.includes('CSE')) return 'from-emerald-600/30 to-green-600/20 text-emerald-400 border-emerald-500/30'
    if (name.includes('ECE')) return 'from-orange-600/30 to-amber-600/20 text-orange-400 border-orange-500/30'
    return 'from-yellow-600/30 to-amber-600/20 text-yellow-400 border-yellow-500/40'
  }

  return (
    <div className="fixed inset-0 bg-[#020617] backdrop-blur-3xl z-[100] flex items-start justify-center overflow-y-auto p-4 md:p-8">
      {showConfetti && <Confetti />}

      {/* Audio Interaction Overlay */}
      {isMuted && (
        <div className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <button
            onClick={handleUnmute}
            className="group relative bg-[#0c1225] border border-cyan-500/30 rounded-[32px] p-8 md:p-12 text-center shadow-[0_0_50px_rgba(34,211,238,0.2)] hover:shadow-[0_0_80px_rgba(34,211,238,0.4)] transition-all transform hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-[32px] pointer-events-none" />
            <div className="text-6xl mb-6 group-hover:animate-bounce">🔊</div>
            <h3 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Live Session Started</h3>
            <p className="text-cyan-400/60 font-black text-xs uppercase tracking-[0.2em] mb-8">Tap to Join Arena \u0026 Enable Sound</p>
            <div className="bg-cyan-500 text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(34,211,238,0.5)]">ENTER ARENA</div>
          </button>
        </div>
      )}

      <div className="relative bg-[#020617] border border-white/10 rounded-[32px] md:rounded-[48px] w-full max-w-5xl min-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
        <GlowingOrbs />
        <CyberBackground />

        {/* Header Section */}
        <div className="relative z-10 p-6 md:p-12 text-center">
          <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/30 rounded-full px-5 py-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Live Draw Session</span>
          </div>

          <h2 className="text-3xl md:text-6xl font-black italic uppercase tracking-tighter text-white mb-8">
            {phase === 'spinning' && <span className="animate-pulse">🎰 SHUFFLING TEAMS</span>}
            {phase === 'drawing' && isRevealing && <span className="text-yellow-400">🥁 REVEALING...</span>}
            {phase === 'drawing' && !isRevealing && latestTeam && <span className="text-cyan-400">✨ TEAM CONFIRMED</span>}
            {phase === 'drawing' && !isRevealing && !latestTeam && <span>⚡ NEXT TEAM INCOMING</span>}
            {phase === 'bracket' && <span className="text-yellow-400">🏆 FINAL BRACKET</span>}
          </h2>

          {/* Progress Section */}
          {phase === 'drawing' && (
            <div className="max-w-md mx-auto mb-12">
              <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[1px]">
                <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(34,211,238,0.5)]" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="flex justify-between mt-3 px-1 text-[10px] font-black tracking-widest text-white/40">
                <span>{currentDrawIndex} POSITIONED</span>
                <span>{totalTeams} TOTAL TEAMS</span>
              </div>
            </div>
          )}

          {/* Main Phase Content */}
          <div className="space-y-12">
            {/* Spinning Phase */}
            {phase === 'spinning' && (
              <div className="relative py-12 flex items-center justify-center min-h-[300px]">
                <div className="absolute w-64 h-64 rounded-full border border-white/5 animate-[spin_10s_linear_infinite]" />
                <div className="absolute w-48 h-48 rounded-full border border-white/10 animate-[spin_15s_linear_infinite_reverse]" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-50">
                  {spinningTeams.slice(0, 16).map(t => (
                    <div key={t.id} className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">{t.name}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Drawing Phase */}
            {phase === 'drawing' && (
              <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 items-start">

                {/* LEFT: REVEAL CARD */}
                <div className="lg:col-span-8 flex flex-col items-center">
                  <div className="relative w-full max-w-2xl">
                    <div className={`relative bg-[#0c1225]/80 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 md:p-16 text-center transform transition-all duration-500 ${isRevealing ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />

                      {isRevealing ? (
                        <div className="py-8">
                          <div className="text-[11px] font-black text-white/30 tracking-[0.4em] mb-4">SEARCHING ARENA...</div>
                          <div className="text-4xl md:text-6xl font-black text-white/10 uppercase italic overflow-hidden h-16">{slotName}</div>
                        </div>
                      ) : latestTeam ? (
                        <div className="animate-pop-in py-8">
                          <div className="text-[11px] font-black text-cyan-400 tracking-[0.4em] mb-4">✨ SELECTION CONFIRMED ✨</div>
                          <div className="text-4xl md:text-7xl font-black text-white uppercase italic drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-8 break-words leading-tight">{latestTeam.name}</div>
                          <div className="inline-block bg-white/5 border border-white/10 rounded-2xl px-6 py-2 text-[10px] font-black text-white/60 tracking-widest">POSITION SECURED</div>
                        </div>
                      ) : (
                        <div className="py-12 opacity-20">
                          <div className="text-6xl mb-6">🏏</div>
                          <div className="text-sm font-black uppercase tracking-widest">Awaiting Command...</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT: DRAWN LIST / SIDEBAR */}
                <div className="lg:col-span-4">
                  {drawnTeams.length > 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 h-full min-h-[400px]">
                      <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                        Secured Positions
                      </h3>
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {drawnTeams.map((team, idx) => (
                          <div key={team.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-4 truncate">
                              <span className="text-[10px] font-black text-cyan-500 w-6">#{idx + 1}</span>
                              <span className="font-black text-xs uppercase text-white truncate group-hover:text-cyan-400 transition-colors">{team.name}</span>
                            </div>
                            <span className="text-[10px] opacity-20">✅</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-white/10 border-dashed rounded-[32px] p-12 text-center opacity-20 flex flex-col items-center justify-center min-h-[400px]">
                      <div className="text-4xl mb-4">⌛</div>
                      <div className="text-[10px] font-black uppercase tracking-widest leading-loose">History will<br />appear here</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bracket Phase */}
            {phase === 'bracket' && (
              <div className="animate-fade-in px-4 pb-12">
                <div className="flex gap-2 p-1 bg-white/5 rounded-3xl mb-12 flex-wrap justify-center overflow-x-auto scrollbar-hide">
                  {['CSM', 'CSE', 'ECE', 'FINALS'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-4 rounded-2xl text-[10px] font-black tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black shadow-xl scale-105' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>{tab}</button>
                  ))}
                </div>

                <div className="space-y-12 max-w-4xl mx-auto">
                  {bracketRounds.filter(round => {
                    if (activeTab === 'FINALS') return round.name.includes('Inter-Dept') || round.name.includes('Grand Final')
                    return round.name.includes(activeTab)
                  }).map((round, rIdx) => (
                    <div key={rIdx} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl border-2 bg-gradient-to-br ${getDeptColor(round.name)} font-black text-xs uppercase tracking-widest`}>
                          {round.name}
                        </div>
                        <div className="flex-1 h-[1px] bg-white/10" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {round.matches.map((m: any, mIdx: number) => (
                          <div key={mIdx} className="bg-white/5 border border-white/10 rounded-32 p-6 flex items-center gap-4 justify-between">
                            <div className="flex-1 font-black text-xs md:text-sm uppercase truncate text-right">{m.team_a?.name || m.team_a_label || 'TBD'}</div>
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-[10px] shrink-0 text-white/40">VS</div>
                            <div className="flex-1 font-black text-xs md:text-sm uppercase truncate text-left">{m.team_b?.name || m.team_b_label || 'TBD'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom controls */}
        <div className="relative z-10 p-6 flex justify-between items-center bg-black/20 backdrop-blur-md border-t border-white/5">
          <button
            onClick={() => setIsMuted(true)}
            className="flex items-center gap-2 text-[10px] font-black text-white/40 hover:text-white transition-colors"
          >
            {isMuted ? '🔇 MUTED' : '🔊 SOUND ON'}
          </button>
          <button onClick={() => setShowInfo(true)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/40 font-black hover:bg-white/10 transition-all">?</button>
        </div>
      </div>

      {showInfo && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-3xl p-8 flex items-center justify-center" onClick={() => setShowInfo(false)}>
          <div className="bg-[#0c1225] border border-white/20 rounded-[40px] p-8 md:p-12 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-3xl font-black text-white italic uppercase mb-8 border-b border-white/10 pb-4 text-center">🏆 TOURNAMENT ARCHITECTURE</h3>
            <div className="space-y-6">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                <span className="text-cyan-400 font-black text-[10px] tracking-widest block mb-1">STAGE I</span>
                <p className="font-bold text-sm text-white/80 uppercase">All-Department Qualifiers — Find your champions.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                <span className="text-yellow-400 font-black text-[10px] tracking-widest block mb-1">STAGE II</span>
                <p className="font-bold text-sm text-white/80 uppercase">Knockout Grand Finals — Only the elite survive.</p>
              </div>
            </div>
            <button onClick={() => setShowInfo(false)} className="mt-10 w-full bg-white text-black p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-cyan-400 transition-colors">ACKNOWLEDGED</button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .rounded-32 { border-radius: 32px; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34, 211, 238, 0.4); }
      `}</style>
    </div>
  )
}
