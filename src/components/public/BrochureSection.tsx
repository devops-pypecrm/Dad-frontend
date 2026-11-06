import { useCallback, useEffect, useRef, useState } from "react"
// The legacy build runs on older Android WebViews / Safari. The worker is bundled by Vite
// (`?worker`) so it is served as a normal .js asset — loading the raw .mjs worker file failed in
// production because the web server sent it as application/octet-stream.
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs"
import type { PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs"
import PdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?worker"
import { Download, Maximize2, Minus, Plus, X, Loader2 } from "lucide-react"

pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker()

type Kind = "loading" | "pdf" | "image" | "unknown"

/** Brochure URLs are usually /api/documents/<id>/download (no extension), so ask the server what it is. */
function useBrochureKind(url: string): Kind {
  const [kind, setKind] = useState<Kind>("loading")
  useEffect(() => {
    let cancelled = false
    const clean = url.split("?")[0].toLowerCase()
    if (clean.endsWith(".pdf")) { setKind("pdf"); return }
    if (/\.(png|jpe?g|webp|gif|avif|svg)$/.test(clean)) { setKind("image"); return }
    const ctl = new AbortController()
    fetch(url, { method: "GET", signal: ctl.signal })
      .then((r) => {
        const type = (r.headers.get("content-type") || "").toLowerCase()
        ctl.abort() // only the headers are needed
        if (cancelled) return
        setKind(type.includes("pdf") ? "pdf" : type.startsWith("image/") ? "image" : "unknown")
      })
      .catch(() => { if (!cancelled) setKind("unknown") })
    return () => { cancelled = true; ctl.abort() }
  }, [url])
  return kind
}

function usePdf(url: string, enabled: boolean) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const task = pdfjs.getDocument({ url })
    task.promise
      .then((d) => { if (cancelled) { d.destroy(); return } setDoc(d) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true; task.destroy() }
  }, [url, enabled])
  return { doc, error }
}

function PdfPage({ doc, pageNumber, width, aspect, scrollRoot, onCurrent }: {
  doc: PDFDocumentProxy
  pageNumber: number
  width: number
  aspect: number
  scrollRoot: React.RefObject<HTMLDivElement | null>
  onCurrent: (n: number) => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [near, setNear] = useState(false)
  const [height, setHeight] = useState<number | null>(null)

  // Render only pages that are near the viewport.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setNear(true) }, { root: scrollRoot.current, rootMargin: "900px 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [scrollRoot])

  // Report which page sits in the middle of the reader.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) onCurrent(pageNumber) }, { root: scrollRoot.current, rootMargin: "-45% 0px -45% 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [scrollRoot, pageNumber, onCurrent])

  useEffect(() => {
    if (!near || width <= 0) return
    let cancelled = false
    let task: ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]> | null = null
    ;(async () => {
      const page = await doc.getPage(pageNumber)
      if (cancelled) return
      const base = page.getViewport({ scale: 1 })
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const scale = width / base.width
      const viewport = page.getViewport({ scale: scale * dpr })
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      canvas.style.width = `${viewport.width / dpr}px`
      canvas.style.height = `${viewport.height / dpr}px`
      setHeight(viewport.height / dpr)
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      task = page.render({ canvasContext: ctx, viewport })
      try { await task.promise } catch { /* cancelled */ }
    })()
    return () => { cancelled = true; task?.cancel() }
  }, [near, width, doc, pageNumber])

  return (
    <div ref={wrapRef} className="bg-white shadow-[0_1px_2px_rgba(0,0,0,.08),0_8px_28px_-10px_rgba(0,0,0,.25)]" style={{ width, height: height ?? width * aspect }}>
      <canvas ref={canvasRef} className="block" aria-label={`Brochure page ${pageNumber}`} />
    </div>
  )
}

function PdfReader({ doc, zoom, onPage }: { doc: PDFDocumentProxy; zoom: number; onPage: (n: number) => void }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [boxWidth, setBoxWidth] = useState(0)
  const [aspect, setAspect] = useState(1.414)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setBoxWidth(el.clientWidth))
    ro.observe(el)
    setBoxWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    doc.getPage(1).then((p) => { if (!cancelled) { const v = p.getViewport({ scale: 1 }); setAspect(v.height / v.width) } })
    return () => { cancelled = true }
  }, [doc])

  const pad = boxWidth < 640 ? 12 : 28
  const pageWidth = Math.max(240, Math.floor((boxWidth - pad * 2) * zoom))

  return (
    <div ref={rootRef} className="h-full w-full overflow-auto overscroll-contain">
      <div className="mx-auto flex w-max min-w-full flex-col items-center gap-4" style={{ padding: pad }}>
        {Array.from({ length: doc.numPages }, (_, i) => (
          <PdfPage key={i} doc={doc} pageNumber={i + 1} width={pageWidth} aspect={aspect} scrollRoot={rootRef} onCurrent={onPage} />
        ))}
      </div>
    </div>
  )
}

function ImageReader({ url, zoom, alt }: { url: string; zoom: number; alt: string }) {
  return (
    <div className="h-full w-full overflow-auto overscroll-contain">
      <div className="mx-auto flex w-max min-w-full justify-center p-3 sm:p-7">
        <img src={url} alt={alt} style={{ width: `${zoom * 100}%`, maxWidth: "none", minWidth: "240px" }} className="h-auto bg-white shadow-[0_8px_28px_-10px_rgba(0,0,0,.25)]" />
      </div>
    </div>
  )
}

export default function BrochureSection({ url, title }: { url: string; title: string }) {
  const kind = useBrochureKind(url)
  const { doc, error } = usePdf(url, kind === "pdf")
  const [open, setOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [page, setPage] = useState(1)
  const [downloading, setDownloading] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const onPage = useCallback((n: number) => setPage(n), [])

  const download = async () => {
    setDownloading(true)
    try {
      const r = await fetch(url)
      if (!r.ok) throw new Error("download failed")
      const blob = await r.blob()
      const ext = blob.type.includes("pdf") ? "pdf" : (blob.type.split("/")[1] || "pdf").replace("jpeg", "jpg").replace("svg+xml", "svg")
      const name = `${title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "product"}-brochure.${ext}`
      const a = document.createElement("a")
      const objectUrl = URL.createObjectURL(blob)
      a.href = objectUrl
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000)
    } catch {
      window.location.href = url // direct link as a last resort
    } finally {
      setDownloading(false)
    }
  }

  // Full-screen reader: Esc to close, lock page scroll, focus the close button.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    closeRef.current?.focus()
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey) }
  }, [open])

  const total = doc?.numPages
  const failed = kind === "unknown" || error

  const body = (z: number) => kind === "image"
    ? <ImageReader url={url} zoom={z} alt={`${title} brochure`} />
    : doc ? <PdfReader doc={doc} zoom={z} onPage={onPage} /> : null

  return (
    <section id="brochure" className="scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pp-kicker">The Brochure</p>
          <h2 className="pp-display mt-2 text-3xl font-semibold leading-tight sm:text-4xl">Read it here, or keep a copy</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {!failed && (
            <button type="button" onClick={() => setOpen(true)} disabled={kind === "loading" || (kind === "pdf" && !doc)} className="pp-btn pp-btn-ghost">
              <Maximize2 className="h-4 w-4" /> Full screen
            </button>
          )}
          <button type="button" onClick={download} disabled={downloading} className="pp-btn pp-btn-solid">
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download brochure
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]" style={{ height: "min(78vh, 860px)" }}>
        {failed ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="pp-display text-xl">This brochure can't be previewed on your device.</p>
            <p className="text-sm text-[var(--muted)]">You can still download it and open it in any PDF or image viewer.</p>
          </div>
        ) : kind === "loading" || (kind === "pdf" && !doc) ? (
          <div className="flex h-full items-center justify-center text-[var(--muted)]"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : body(1)}
        {total && total > 1 && !failed && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--ink)]/85 px-3 py-1 text-xs font-medium tabular-nums text-white">
            {page} / {total}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#14110f]" role="dialog" aria-modal="true" aria-label={`${title} brochure`}>
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5 text-white sm:px-5">
            <p className="pp-display min-w-0 truncate text-base sm:text-lg">{title}</p>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {total && total > 1 && <span className="hidden text-xs tabular-nums text-white/70 sm:inline">Page {page} of {total}</span>}
              <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.25).toFixed(2)))} className="pp-icon-btn"><Minus className="h-4 w-4" /></button>
              <span className="w-11 text-center text-xs tabular-nums text-white/80">{Math.round(zoom * 100)}%</span>
              <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} className="pp-icon-btn"><Plus className="h-4 w-4" /></button>
              <button type="button" aria-label="Download brochure" onClick={download} className="pp-icon-btn"><Download className="h-4 w-4" /></button>
              <button ref={closeRef} type="button" aria-label="Close full screen" onClick={() => setOpen(false)} className="pp-icon-btn"><X className="h-5 w-5" /></button>
            </div>
          </div>
          <div className="min-h-0 flex-1 bg-[#2a2622]">{body(zoom)}</div>
        </div>
      )}
    </section>
  )
}
