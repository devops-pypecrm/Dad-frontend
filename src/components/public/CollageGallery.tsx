import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

export interface GalleryImage { url: string; caption?: string; w?: number; h?: number }

const GAP = 6

/**
 * Splits `ratios` (width / height of each image, in order) into `rows` consecutive rows so that the
 * rows' total aspect ratios are as even as possible. Rows with equal total ratio end up with equal
 * heights once scaled to the container width — that is what makes the collage a clean rectangle.
 */
function partition(ratios: number[], rows: number): number[][] {
  const n = ratios.length
  const k = Math.max(1, Math.min(rows, n))
  const total = ratios.reduce((a, b) => a + b, 0)
  const target = total / k
  const prefix = [0]
  ratios.forEach((r) => prefix.push(prefix[prefix.length - 1] + r))
  const cost = (i: number, j: number) => (prefix[j] - prefix[i] - target) ** 2

  const dp: number[][] = Array.from({ length: k + 1 }, () => Array(n + 1).fill(Infinity))
  const cut: number[][] = Array.from({ length: k + 1 }, () => Array(n + 1).fill(0))
  dp[0][0] = 0
  for (let r = 1; r <= k; r++) {
    for (let j = r; j <= n; j++) {
      for (let i = r - 1; i < j; i++) {
        const c = dp[r - 1][i] + cost(i, j)
        if (c < dp[r][j]) { dp[r][j] = c; cut[r][j] = i }
      }
    }
  }
  const out: number[][] = []
  let j = n
  for (let r = k; r >= 1; r--) {
    const i = cut[r][j]
    out.unshift(ratios.slice(i, j).map((_, idx) => i + idx))
    j = i
  }
  return out
}

export default function CollageGallery({ images }: { images: GalleryImage[] }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [measured, setMeasured] = useState<Record<string, number>>({})
  const [lightbox, setLightbox] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  // Images saved without stored dimensions are measured from the loaded file.
  useEffect(() => {
    images.forEach((g) => {
      if ((g.w && g.h) || measured[g.url]) return
      const img = new Image()
      img.onload = () => setMeasured((m) => ({ ...m, [g.url]: img.naturalWidth / img.naturalHeight }))
      img.onerror = () => setMeasured((m) => ({ ...m, [g.url]: 1.5 }))
      img.src = g.url
    })
  }, [images, measured])

  const ratios = useMemo(
    () => images.map((g) => {
      const r = g.w && g.h ? g.w / g.h : measured[g.url] || 1.5
      return Math.min(Math.max(r, 0.5), 2.6) // keep extreme panoramas/tall shots from dominating a row
    }),
    [images, measured]
  )

  const rows = useMemo(() => {
    if (width <= 0 || images.length === 0) return []
    const targetHeight = width < 520 ? 150 : width < 900 ? 210 : 270
    const sum = ratios.reduce((a, b) => a + b, 0)
    const wanted = Math.max(1, Math.round((sum * targetHeight) / width))
    return partition(ratios, wanted)
  }, [width, ratios, images.length])

  const close = useCallback(() => setLightbox(null), [])
  const step = useCallback((d: number) => setLightbox((i) => (i === null ? i : (i + d + images.length) % images.length)), [images.length])

  useEffect(() => {
    if (lightbox === null) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      else if (e.key === "ArrowLeft") step(-1)
      else if (e.key === "ArrowRight") step(1)
    }
    window.addEventListener("keydown", onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey) }
  }, [lightbox, close, step])

  if (images.length === 0) return null

  return (
    <>
      <div ref={boxRef} className="w-full overflow-hidden rounded-2xl" style={{ display: "flex", flexDirection: "column", gap: GAP }}>
        {rows.map((row, ri) => {
          const rowRatio = row.reduce((a, idx) => a + ratios[idx], 0)
          const height = (width - GAP * (row.length - 1)) / rowRatio
          return (
            <div key={ri} style={{ display: "flex", gap: GAP, height }}>
              {row.map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightbox(idx)}
                  className="group relative block overflow-hidden bg-[var(--surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  style={{ width: height * ratios[idx], height, flex: "0 0 auto" }}
                  aria-label={images[idx].caption || `Open photo ${idx + 1}`}
                >
                  <img
                    src={images[idx].url}
                    alt={images[idx].caption || ""}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  {images[idx].caption && (
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-8 text-left text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {images[idx].caption}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )
        })}
      </div>

      {lightbox !== null && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="Photo gallery" onClick={close}>
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm tabular-nums text-white/70">{lightbox + 1} / {images.length}</span>
            <button type="button" aria-label="Close gallery" onClick={close} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"><X className="h-5 w-5" /></button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-14" onClick={(e) => e.stopPropagation()}>
            <button type="button" aria-label="Previous photo" onClick={() => step(-1)} className="absolute left-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-4"><ChevronLeft className="h-6 w-6" /></button>
            <img src={images[lightbox].url} alt={images[lightbox].caption || ""} className="max-h-full max-w-full object-contain" />
            <button type="button" aria-label="Next photo" onClick={() => step(1)} className="absolute right-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-4"><ChevronRight className="h-6 w-6" /></button>
          </div>
          <p className="min-h-[3rem] px-4 py-3 text-center text-sm text-white/80" onClick={(e) => e.stopPropagation()}>{images[lightbox].caption || ""}</p>
        </div>
      )}
    </>
  )
}
