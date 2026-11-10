import { useCallback, useEffect, useRef, useState } from 'react'
import { Bot, Mic, Send, Sparkles, Volume2, VolumeX, MessageSquare, AudioLines, Trash2, Square, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, getUserInfo, isOrgAdmin } from '@/lib/utils'
import { API_URL } from '@/config'
import { api } from '@/services/api'

interface Msg { id: number; role: 'user' | 'assistant'; text: string }

const SUGGESTIONS = [
  'How many leads came in this month?',
  'Summarise my pipeline by stage',
  'How many follow-ups are overdue?',
  'How does lead assignment work?',
]

const SR: any = typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null
const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window

const plain = (t: string) => t.replace(/\*\*/g, '').replace(/^[-*]\s+/gm, '').replace(/^\d+\.\s+/gm, '').replace(/[#`_]/g, '')

function Bold({ line }: { line: string }) {
  return <>{line.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>)}</>
}
function Rich({ text }: { text: string }) {
  return <>{text.split('\n').map((l, i) => {
    const t = l.trim()
    const o = t.match(/^(\d+)\.\s+(.*)/); const b = t.match(/^[-*]\s+(.*)/)
    if (o) return <div key={i} className="flex gap-1.5"><span className="text-muted-foreground">{o[1]}.</span><span><Bold line={o[2]} /></span></div>
    if (b) return <div key={i} className="flex gap-1.5"><span className="text-muted-foreground">•</span><span><Bold line={b[1]} /></span></div>
    return t ? <div key={i}><Bold line={l} /></div> : <div key={i} className="h-1.5" />
  })}</>
}

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking'

export default function Assistant() {
  const allowed = isOrgAdmin(getUserInfo())
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [voiceMode, setVoiceMode] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [muted, setMuted] = useState(false)
  const [interim, setInterim] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Refs so long-lived speech callbacks always see current values.
  const msgsRef = useRef<Msg[]>([]); msgsRef.current = msgs
  const voiceRef = useRef(false); voiceRef.current = voiceMode
  const mutedRef = useRef(false); mutedRef.current = muted
  const phaseRef = useRef<Phase>('idle'); phaseRef.current = phase
  const recRef = useRef<any>(null)
  const abortRef = useRef<AbortController | null>(null)
  const queueRef = useRef<string[]>([])
  const streamDoneRef = useRef(true)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null) // keep a reference: Chrome can GC an utterance mid-speech
  const voiceObjRef = useRef<SpeechSynthesisVoice | null>(null)
  const sendRef = useRef<(t: string, v?: boolean) => void>(() => {})

  useEffect(() => { api.get('/ai/assistant/warm').catch(() => {}) }, []) // have the CRM numbers ready before the first question
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [msgs, interim, phase])

  // ---- speech output -------------------------------------------------------
  useEffect(() => {
    if (!canSpeak) return
    const pick = () => {
      const vs = window.speechSynthesis.getVoices()
      if (!vs.length) return
      const lang = (navigator.language || 'en-US').toLowerCase()
      const same = vs.filter((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2)))
      voiceObjRef.current = same.find((v) => /google|natural|neural|samantha|siri/i.test(v.name)) || same[0] || vs[0]
    }
    pick(); window.speechSynthesis.addEventListener('voiceschanged', pick)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pick)
  }, [])

  const startListening = useCallback(() => {
    if (!SR || phaseRef.current === 'listening') return
    const r = new SR()
    r.lang = navigator.language || 'en-US'; r.interimResults = true; r.continuous = false
    let finalText = ''
    r.onstart = () => { setPhase('listening'); setInterim('') }
    r.onresult = (e: any) => {
      let i = ''
      for (let k = e.resultIndex; k < e.results.length; k++) {
        const t = e.results[k][0].transcript
        if (e.results[k].isFinal) finalText += t; else i += t
      }
      setInterim(finalText + i)
    }
    r.onerror = () => { /* onend follows */ }
    r.onend = () => {
      setInterim('')
      if (recRef.current !== r) return
      if (finalText.trim()) sendRef.current(finalText.trim(), true)
      else if (voiceRef.current && phaseRef.current === 'listening') setTimeout(() => voiceRef.current && phaseRef.current !== 'thinking' && phaseRef.current !== 'speaking' && (setPhase('idle'), startListening()), 300)
      else if (phaseRef.current === 'listening') setPhase('idle')
    }
    recRef.current = r
    try { r.start() } catch { setPhase('idle') }
  }, [])

  const stopListening = useCallback(() => { const r = recRef.current; recRef.current = null; try { r?.abort() } catch { /* noop */ } if (phaseRef.current === 'listening') setPhase('idle'); setInterim('') }, [])

  const afterSpeech = useCallback(() => {
    if (voiceRef.current) { setPhase('idle'); setTimeout(() => voiceRef.current && startListening(), 250) } else setPhase('idle')
  }, [startListening])

  const pump = useCallback(() => {
    if (!canSpeak) return
    const next = queueRef.current.shift()
    if (!next) { if (streamDoneRef.current && phaseRef.current === 'speaking') afterSpeech(); return }
    const u = new SpeechSynthesisUtterance(plain(next))
    if (voiceObjRef.current) { u.voice = voiceObjRef.current; u.lang = voiceObjRef.current.lang } else u.lang = navigator.language || 'en-US'
    u.rate = 1.05
    u.onend = () => pump()
    u.onerror = () => pump()
    utterRef.current = u
    setPhase('speaking')
    window.speechSynthesis.speak(u)
  }, [afterSpeech])

  const stopSpeaking = useCallback(() => { queueRef.current = []; if (canSpeak) window.speechSynthesis.cancel() }, [])

  /** Browsers only allow speech after a user gesture; a silent utterance on the click unlocks it. */
  const unlockSpeech = () => { if (!canSpeak) return; const u = new SpeechSynthesisUtterance(' '); u.volume = 0; window.speechSynthesis.speak(u) }

  // ---- sending (streamed) ----------------------------------------------------
  const send = useCallback(async (text: string, viaVoice = false) => {
    const t = text.trim(); if (!t) return
    abortRef.current?.abort(); stopSpeaking(); stopListening()
    const history = msgsRef.current.map(({ role, text }) => ({ role, text }))
    const aid = Date.now() + 1
    setMsgs((p) => [...p, { id: Date.now(), role: 'user', text: t }, { id: aid, role: 'assistant', text: '' }])
    setInput(''); setPhase('thinking')
    const speakIt = (viaVoice || voiceRef.current) && !mutedRef.current && canSpeak
    streamDoneRef.current = false
    const ctrl = new AbortController(); abortRef.current = ctrl
    let full = '', pending = ''
    const flushSentences = (final: boolean) => {
      if (!speakIt) return
      const parts = pending.split(/(?<=[.!?:])\s+|\n+/)
      const keep = final ? '' : parts.pop() ?? ''
      parts.filter((s) => s.trim()).forEach((s) => queueRef.current.push(s))
      pending = keep
      if (final && keep.trim()) queueRef.current.push(keep)
      if (queueRef.current.length && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) pump()
    }
    try {
      const token = (() => { try { return JSON.parse(localStorage.getItem('userInfo') || '{}').token } catch { return '' } })()
      const res = await fetch(`${API_URL}/api/ai/assistant/stream`, {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: t, history, voice: viaVoice || voiceRef.current }),
      })
      if (!res.ok || !res.body) throw new Error(String(res.status))
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = ''
      for (;;) {
        const { value, done } = await reader.read(); if (done) break
        buf += dec.decode(value, { stream: true })
        let i: number
        while ((i = buf.indexOf('\n\n')) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 2)
          if (!line.startsWith('data:')) continue
          const j = JSON.parse(line.slice(5))
          if (j.t) { full += j.t; pending += j.t; setMsgs((p) => p.map((m) => m.id === aid ? { ...m, text: full } : m)); flushSentences(false) }
        }
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      const msg = String(e?.message) === '403' ? 'The AI Assistant is only available to admins.' : "I couldn't reach the assistant right now — please try again."
      if (!full) { full = msg; pending = msg; setMsgs((p) => p.map((m) => m.id === aid ? { ...m, text: msg } : m)) }
    }
    streamDoneRef.current = true
    flushSentences(true)
    if (speakIt && queueRef.current.length === 0 && !window.speechSynthesis.speaking) afterSpeech()
    else if (!speakIt) { if (voiceRef.current) afterSpeech(); else setPhase('idle') }
  }, [pump, stopSpeaking, stopListening, afterSpeech])
  sendRef.current = send

  const startVoice = () => { unlockSpeech(); setVoiceMode(true); voiceRef.current = true; startListening() }
  const endVoice = () => { setVoiceMode(false); voiceRef.current = false; stopListening(); stopSpeaking(); abortRef.current?.abort(); setPhase('idle') }
  const orbClick = () => {
    unlockSpeech()
    if (phase === 'listening') stopListening()
    else if (phase === 'speaking' || phase === 'thinking') { abortRef.current?.abort(); stopSpeaking(); streamDoneRef.current = true; setPhase('idle'); setTimeout(startListening, 150) }
    else startListening()
  }
  useEffect(() => () => { abortRef.current?.abort(); try { recRef.current?.abort() } catch { /* noop */ } if (canSpeak) window.speechSynthesis.cancel() }, [])

  if (!allowed) return <div className="p-8 text-sm text-muted-foreground">The AI Assistant is available to admins only.</div>

  const lastAssistant = [...msgs].reverse().find((m) => m.role === 'assistant')
  const phaseLabel = { idle: 'Tap the orb to talk', listening: 'Listening…', thinking: 'Thinking…', speaking: 'Speaking — tap to interrupt' }[phase]

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Header — same pattern as other module pages */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))]"><Sparkles className="h-6 w-6" /></div>
          <div className="min-w-0">
            <h1 className="font-poppins text-2xl font-bold tracking-tight text-foreground sm:text-3xl">AI Assistant</h1>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">Ask about your leads, pipeline and follow-ups — by text or voice</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {msgs.length > 0 && <Button variant="outline" className="h-9 gap-2 rounded-[10px] text-sm" onClick={() => { abortRef.current?.abort(); stopSpeaking(); setMsgs([]); setPhase('idle') }}><Trash2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Clear</span></Button>}
          {canSpeak && <Button variant="outline" size="icon" className="h-9 w-9 rounded-[10px]" title={muted ? 'Unmute voice replies' : 'Mute voice replies'} onClick={() => { setMuted((m) => !m); stopSpeaking() }}>{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</Button>}
          <Button className={cn('h-9 gap-2 rounded-[10px] text-sm', voiceMode ? 'bg-[hsl(var(--chart-5))] text-white hover:bg-[hsl(var(--chart-5))]/90' : '')} variant={voiceMode ? 'default' : 'outline'} onClick={voiceMode ? endVoice : startVoice} disabled={!SR} title={SR ? '' : 'Voice needs Chrome, Edge or Safari'}>
            {voiceMode ? <><MessageSquare className="h-4 w-4" />Switch to chat</> : <><AudioLines className="h-4 w-4" />Voice mode</>}
          </Button>
        </div>
      </div>

      <div className="finance-card flex h-[calc(100vh-15rem)] min-h-[420px] flex-col overflow-hidden p-0">
        {voiceMode ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <button onClick={orbClick} aria-label="Voice control" className="relative grid h-36 w-36 place-items-center">
              <span className={cn('absolute inset-0 rounded-full bg-[hsl(var(--chart-5))]/15', phase !== 'idle' && 'animate-ping')} />
              <span className={cn('absolute inset-3 rounded-full bg-[hsl(var(--chart-5))]/25 transition-transform', phase === 'speaking' && 'animate-pulse', phase === 'listening' && 'scale-110')} />
              <span className="relative grid h-20 w-20 place-items-center rounded-full bg-[hsl(var(--chart-5))] text-white shadow-lg shadow-[hsl(var(--chart-5))]/30">
                {phase === 'speaking' ? <Square className="h-6 w-6" /> : phase === 'thinking' ? <Sparkles className="h-7 w-7 animate-spin" /> : <Mic className="h-7 w-7" />}
              </span>
            </button>
            <p className="text-sm font-medium text-foreground">{phaseLabel}</p>
            <div className="min-h-[5rem] max-w-xl space-y-2 text-sm">
              {interim && <p className="text-muted-foreground">“{interim}”</p>}
              {!interim && lastAssistant?.text && <p className="line-clamp-5 leading-relaxed text-foreground/90">{plain(lastAssistant.text)}</p>}
              {!interim && !lastAssistant && <p className="text-muted-foreground">Ask something like “How many leads came in this month?”</p>}
            </div>
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
            {msgs.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))]"><Bot className="h-7 w-7" /></div>
                <div><p className="font-semibold text-foreground">How can I help?</p><p className="mt-1 text-sm text-muted-foreground">Answers come from your live CRM data.</p></div>
                <div className="flex max-w-xl flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition hover:border-[hsl(var(--chart-5))]/50 hover:bg-[hsl(var(--chart-5))]/5">{s}</button>)}
                </div>
              </div>
            )}
            {msgs.map((m) => (
              <div key={m.id} className={cn('flex items-end gap-2.5', m.role === 'user' && 'flex-row-reverse')}>
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', m.role === 'user' ? 'bg-muted text-muted-foreground' : 'bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))]')}>
                  {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn('max-w-[80%] space-y-0.5 rounded-2xl px-4 py-2.5 text-sm leading-relaxed', m.role === 'user' ? 'rounded-br-sm bg-[hsl(var(--chart-5))] text-white' : 'rounded-bl-sm border border-border bg-card text-foreground')}>
                  {m.role === 'user' ? m.text : m.text ? <Rich text={m.text} /> : (
                    <span className="flex gap-1 py-1">{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: `${i * 0.12}s` }} />)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!voiceMode && (
          <form className="flex items-center gap-2 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); send(input) }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything about your CRM…" disabled={phase === 'thinking'}
              className="h-11 flex-1 rounded-[10px] border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--chart-5))]/30 disabled:opacity-60" />
            {SR && <Button type="button" variant="outline" size="icon" className="h-11 w-11 rounded-[10px]" title="Talk" onClick={startVoice}><Mic className="h-4 w-4" /></Button>}
            <Button type="submit" size="icon" className="h-11 w-11 rounded-[10px] bg-[hsl(var(--chart-5))] text-white hover:bg-[hsl(var(--chart-5))]/90" disabled={!input.trim() || phase === 'thinking'}><Send className="h-4 w-4" /></Button>
          </form>
        )}
      </div>
    </div>
  )
}
