import { useState, useEffect, useMemo } from "react"
import { formatIST } from "@/lib/dateUtils"
import { useParams, useSearchParams } from "react-router-dom"
import { api } from "@/services/api"
import { getAssetUrl } from "@/lib/utils"
import { Phone, Mail, ArrowDown, MapPin, Plus, Check } from "lucide-react"
import BrochureSection from "@/components/public/BrochureSection"
import CollageGallery from "@/components/public/CollageGallery"
import type { ProductPageConfig } from "@/services/productService"

interface SharedProductData {
  product: {
    id: string
    name: string
    description?: string
    basePrice: number
    currency: string
    category?: string
    imageUrl?: string
    brochureUrl?: string
    sku?: string
    unit?: string
    minQuantity?: number
    tags?: string[]
    validUntil?: string
    isCustom?: boolean
    pageConfig?: Partial<ProductPageConfig> | null
  }
  seller: { firstName: string; lastName: string; id: string; email?: string; phone?: string }
  organisation: { name: string; logo?: string | null; contactEmail?: string | null; contactPhone?: string | null; address?: string | null }
  shareConfig?: { youtubeUrl?: string; customTitle?: string; customDescription?: string; createdAt?: string }
  lead?: { phone?: string; firstName?: string; lastName?: string }
}

// Plus Jakarta Sans is loaded globally from index.html. Only three weights are used here: 400, 500, 600.
const THEME_CSS = `
.pp{--ink:#0f172a;--muted:#64748b;--line:#e2e8f0;--bg:#f8fafc;--surface:#ffffff;--surface-2:#f1f5f9;--accent:#4f46e5;--on-accent:#ffffff;
  --accent-soft:color-mix(in srgb,var(--accent) 10%,white);--accent-line:color-mix(in srgb,var(--accent) 28%,white);
  background:var(--bg);color:var(--ink);font-family:'Plus Jakarta Sans',system-ui,-apple-system,'Segoe UI',sans-serif;font-weight:400;
  -webkit-font-smoothing:antialiased;min-height:100vh;line-height:1.6}
.pp *{box-sizing:border-box}
.pp h1,.pp h2,.pp h3,.pp .pp-display{font-family:inherit;font-weight:600;letter-spacing:-.025em;line-height:1.12}
.pp-kicker{font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:var(--accent)}
.pp-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;height:2.9rem;padding:0 1.4rem;font-size:.9rem;font-weight:500;
  border:1px solid transparent;border-radius:999px;transition:background .2s,color .2s,border-color .2s,transform .15s;cursor:pointer;text-decoration:none;white-space:nowrap}
.pp-btn:active:not(:disabled){transform:scale(.98)}
.pp-btn:disabled{opacity:.5;cursor:not-allowed}
.pp-btn:focus-visible,.pp-icon-btn:focus-visible,.pp a:focus-visible,.pp summary:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.pp-btn-solid{background:var(--accent);color:var(--on-accent)}
.pp-btn-solid:hover:not(:disabled){background:color-mix(in srgb,var(--accent) 86%,black)}
.pp-btn-ghost{background:var(--surface);color:var(--ink);border-color:var(--line)}
.pp-btn-ghost:hover:not(:disabled){border-color:var(--ink)}
.pp-btn-light{background:#fff;color:var(--ink)}.pp-btn-light:hover{background:var(--accent-soft)}
.pp-btn-outline-light{background:transparent;color:var(--on-accent);border-color:color-mix(in srgb,var(--on-accent) 55%,transparent)}
.pp-btn-outline-light:hover{background:var(--on-accent);color:var(--accent)}
.pp-icon-btn{display:inline-flex;align-items:center;justify-content:center;height:2.25rem;width:2.25rem;border-radius:999px;color:#fff;background:rgba(255,255,255,.1);transition:background .2s}
.pp-icon-btn:hover{background:rgba(255,255,255,.22)}
.pp-card{background:var(--surface);border:1px solid var(--line);border-radius:1.25rem}
.pp-faq summary{list-style:none;cursor:pointer}.pp-faq summary::-webkit-details-marker{display:none}
.pp-faq[open] .pp-faq-icon{transform:rotate(45deg)}
.pp-faq-icon{transition:transform .2s}
.pp-rise{animation:pp-rise .7s cubic-bezier(.2,.7,.2,1) both}
@keyframes pp-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.pp-rise{animation:none}.pp *{transition:none!important}}
`

function paragraphs(text?: string) {
  return (text || "").replace(/\r/g, "").split(/\n{1,}/).map((p) => p.trim()).filter(Boolean)
}

function getEmbedUrl(url?: string) {
  if (!url) return null
  const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)
  return m && m[2].length === 11 ? `https://www.youtube.com/embed/${m[2]}` : null
}

/** White text on dark accents, dark text on light ones. */
function onAccent(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.62 ? "#0f172a" : "#ffffff"
}

/** Renders a text block: lines starting with "- " become a bullet list, everything else paragraphs. */
function RichText({ text }: { text: string }) {
  const blocks: { list: boolean; lines: string[] }[] = []
  text.replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean).forEach((line) => {
    const isItem = /^[-•*]\s+/.test(line)
    const last = blocks[blocks.length - 1]
    const clean = line.replace(/^[-•*]\s+/, "")
    if (last && last.list === isItem) last.lines.push(clean)
    else blocks.push({ list: isItem, lines: [clean] })
  })
  return (
    <div className="space-y-4 text-[1.02rem] leading-[1.75] text-[var(--ink)]/85">
      {blocks.map((b, i) => b.list ? (
        <ul key={i} className="space-y-2.5">
          {b.lines.map((l, k) => (
            <li key={k} className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-[var(--accent)]" /><span>{l}</span></li>
          ))}
        </ul>
      ) : b.lines.map((l, k) => <p key={`${i}-${k}`}>{l}</p>))}
    </div>
  )
}

function SectionHead({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <div className="mb-6 sm:mb-8">
      {kicker && <p className="pp-kicker">{kicker}</p>}
      <h2 className="mt-2 text-[1.75rem] sm:text-4xl">{title}</h2>
    </div>
  )
}

export default function SharedProductPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const leadId = searchParams.get("leadId")
  const [data, setData] = useState<SharedProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [logoBroken, setLogoBroken] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(leadId ? `/share/${slug}?leadId=${leadId}` : `/share/${slug}`)
        setData(response.data)
      } catch (err: unknown) {
        setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to load product")
      } finally {
        setLoading(false)
      }
    }
    if (slug) fetchProduct()
  }, [slug, leadId])

  useEffect(() => {
    if (data?.product) document.title = `${data.shareConfig?.customTitle || data.product.name} · ${data.organisation?.name || ""}`.trim()
  }, [data])

  const cfg = useMemo(() => {
    const c = data?.product?.pageConfig || {}
    return {
      gallery: c.gallery || [],
      highlights: c.highlights || [],
      details: c.details || [],
      sections: c.sections || [],
      faqs: c.faqs || [],
      priceLabel: c.priceLabel || "",
      showPrice: c.showPrice !== false,
      ctaTitle: c.ctaTitle || "",
      ctaText: c.ctaText || "",
      accent: c.accentColor && /^#[0-9a-fA-F]{6}$/.test(c.accentColor) ? c.accentColor : "#4f46e5",
    }
  }, [data])

  const themeVars = { "--accent": cfg.accent, "--on-accent": onAccent(cfg.accent) } as React.CSSProperties

  if (loading) return (
    <div className="pp flex items-center justify-center" style={themeVars}><style>{THEME_CSS}</style>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
    </div>
  )

  if (error) return (
    <div className="pp flex flex-col items-center justify-center gap-3 px-4 text-center" style={themeVars}><style>{THEME_CSS}</style>
      <p className="pp-kicker">404</p>
      <h1 className="text-4xl">This page is no longer available</h1>
      <p className="text-[var(--muted)]">{error}</p>
    </div>
  )

  if (!data || !data.product) return null

  const { product, seller, organisation, shareConfig, lead } = data
  const title = shareConfig?.customTitle || product.name
  const copy = paragraphs(shareConfig?.customDescription || product.description)
  const lede = copy[0] || ""
  const body = copy.slice(1)
  const embedUrl = getEmbedUrl(shareConfig?.youtubeUrl)
  const logoUrl = organisation?.logo && !logoBroken ? getAssetUrl(organisation.logo) : ""
  const orgName = organisation?.name || ""
  const sellerName = `${seller?.firstName || ""} ${seller?.lastName || ""}`.trim()
  const callNumber = seller?.phone || organisation?.contactPhone || ""
  const mailAddress = seller?.email || organisation?.contactEmail || ""
  const preparedFor = lead?.firstName ? `${lead.firstName}${lead.lastName ? ` ${lead.lastName}` : ""}` : ""
  const showPrice = cfg.showPrice && !product.isCustom && product.basePrice > 0
  const price = new Intl.NumberFormat("en-IN", { style: "currency", currency: product.currency || "INR", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(product.basePrice)
  const issued = shareConfig?.createdAt ? formatIST(shareConfig.createdAt, "d MMMM yyyy") : ""
  const heroImage = product.imageUrl ? getAssetUrl(product.imageUrl) : ""
  const brochureUrl = product.brochureUrl ? getAssetUrl(product.brochureUrl) : ""
  const gallery = cfg.gallery.map((g) => ({ ...g, url: getAssetUrl(g.url) }))
  const enquireHref = mailAddress ? `mailto:${mailAddress}?subject=${encodeURIComponent(`Enquiry: ${title}`)}` : callNumber ? `tel:${callNumber}` : ""

  const facts: { label: string; value: string }[] = [
    ...cfg.details,
    product.unit && product.unit !== "unit" && showPrice ? { label: "Sold per", value: product.unit } : null,
    product.minQuantity && product.minQuantity > 1 ? { label: "Minimum order", value: String(product.minQuantity) } : null,
    product.sku ? { label: "Reference", value: product.sku } : null,
    product.validUntil ? { label: "Offer valid until", value: formatIST(product.validUntil, "d MMM yyyy") } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  const hasAbout = body.length > 0 || (product.tags && product.tags.length > 0)

  return (
    <div className="pp" style={themeVars}>
      <style>{THEME_CSS}</style>

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <div className="flex min-w-0 items-center">
            {logoUrl ? (
              <img src={logoUrl} alt={orgName} onError={() => setLogoBroken(true)} className="max-h-9 w-auto max-w-[180px] object-contain sm:max-h-10 sm:max-w-[240px]" />
            ) : (
              <span className="truncate text-lg font-semibold tracking-tight">{orgName || "Product"}</span>
            )}
          </div>
          {enquireHref && (
            <a href={enquireHref} className="pp-btn pp-btn-solid !h-10 !px-5">{mailAddress ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />} Enquire</a>
          )}
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-[var(--accent-soft)]">
          <div className={`mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-8 sm:py-20 ${heroImage ? "lg:grid-cols-[1.1fr_1fr] lg:gap-14" : ""}`}>
            <div className="pp-rise">
              <div className="flex flex-wrap items-center gap-2">
                {product.category && <span className="rounded-full border border-[var(--accent-line)] bg-white px-3 py-1 text-xs font-medium text-[var(--accent)]">{product.category}</span>}
                {preparedFor && <span className="text-xs text-[var(--muted)]">Prepared for {preparedFor}</span>}
              </div>
              <h1 className="mt-5 text-[2.35rem] sm:text-6xl">{title}</h1>
              {lede && <p className={`mt-5 max-w-2xl text-lg leading-relaxed text-[var(--ink)]/75 ${heroImage ? "" : "sm:text-xl"}`}>{lede}</p>}

              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-5">
                {showPrice && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[.12em] text-[var(--muted)]">{cfg.priceLabel || "Starting at"}</p>
                    <p className="text-3xl font-semibold tracking-tight sm:text-4xl">{price}</p>
                  </div>
                )}
                {sellerName && (
                  <div className={showPrice ? "border-l border-[var(--accent-line)] pl-8" : ""}>
                    <p className="text-xs font-medium uppercase tracking-[.12em] text-[var(--muted)]">Presented by</p>
                    <p className="text-base font-medium">{sellerName}{orgName && <span className="font-normal text-[var(--muted)]"> · {orgName}</span>}</p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {enquireHref && <a href={enquireHref} className="pp-btn pp-btn-solid">{mailAddress ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />} Enquire now</a>}
                {brochureUrl && <a href="#brochure" className="pp-btn pp-btn-ghost"><ArrowDown className="h-4 w-4" /> View brochure</a>}
                {callNumber && mailAddress && <a href={`tel:${callNumber}`} className="pp-btn pp-btn-ghost"><Phone className="h-4 w-4" /> Call</a>}
              </div>
            </div>

            {heroImage && (
              <div className="pp-rise overflow-hidden rounded-[1.75rem] bg-white shadow-[0_24px_60px_-24px_rgba(15,23,42,.35)]" style={{ animationDelay: ".1s" }}>
                <img src={heroImage} alt={title} className="max-h-[520px] w-full object-cover" />
              </div>
            )}
          </div>
        </section>

        {/* Key details */}
        {facts.length > 0 && (
          <section className="relative z-10 mx-auto max-w-6xl px-4 sm:px-8">
            <dl className="pp-card -mt-8 grid grid-cols-2 gap-px overflow-hidden bg-[var(--line)] shadow-[0_12px_32px_-18px_rgba(15,23,42,.25)] sm:grid-cols-3 lg:grid-cols-4">
              {facts.map((f) => (
                <div key={f.label} className="bg-white px-4 py-4 sm:px-5 sm:py-5">
                  <dt className="text-xs font-medium uppercase tracking-[.1em] text-[var(--muted)]">{f.label}</dt>
                  <dd className="mt-1 text-[.95rem] font-medium leading-snug">{f.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* About */}
        {hasAbout && (
          <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-8 sm:pt-20">
            <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:gap-14">
              <SectionHead kicker="About" title="Overview" />
              <div>
                {body.length > 0 && <RichText text={body.join("\n")} />}
                {product.tags && product.tags.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {product.tags.map((t) => <span key={t} className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs text-[var(--muted)]">{t}</span>)}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Highlights */}
        {cfg.highlights.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-8 sm:pt-20">
            <SectionHead kicker="Why choose this" title="Highlights" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cfg.highlights.map((h, i) => (
                <div key={i} className="pp-card p-5 sm:p-6">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]">{i + 1}</span>
                  <h3 className="mt-4 text-lg">{h.title}</h3>
                  {h.text && <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{h.text}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gallery */}
        {gallery.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-8 sm:pt-20">
            <SectionHead kicker="Gallery" title="A closer look" />
            <CollageGallery images={gallery} />
          </section>
        )}

        {/* Video */}
        {embedUrl && (
          <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-8 sm:pt-20">
            <SectionHead kicker="Watch" title="See it in action" />
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
              <iframe className="h-full w-full" src={embedUrl} title="Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          </section>
        )}

        {/* Custom sections */}
        {cfg.sections.map((s, i) => (
          <section key={i} className="mx-auto max-w-6xl px-4 pt-14 sm:px-8 sm:pt-20">
            <div className="grid gap-6 border-t border-[var(--line)] pt-10 lg:grid-cols-[320px_1fr] lg:gap-14">
              <h2 className="text-[1.6rem] sm:text-3xl">{s.title}</h2>
              <RichText text={s.body} />
            </div>
          </section>
        ))}

        {/* Brochure */}
        {brochureUrl && (
          <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-8 sm:pt-20">
            <BrochureSection url={brochureUrl} title={title} />
          </div>
        )}

        {/* FAQ */}
        {cfg.faqs.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-8 sm:pt-20">
            <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:gap-14">
              <SectionHead kicker="FAQ" title="Questions, answered" />
              <div className="space-y-3">
                {cfg.faqs.map((f, i) => (
                  <details key={i} className="pp-faq pp-card px-5 py-4">
                    <summary className="flex items-center justify-between gap-4 text-[1.02rem] font-medium">
                      <span>{f.q}</span>
                      <Plus className="pp-faq-icon h-5 w-5 shrink-0 text-[var(--accent)]" />
                    </summary>
                    <p className="mt-3 whitespace-pre-line text-[.97rem] leading-relaxed text-[var(--muted)]">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Contact */}
        <section className="px-4 pb-14 pt-14 sm:px-8 sm:pb-20 sm:pt-20">
          <div className="mx-auto grid max-w-6xl gap-8 rounded-[1.75rem] bg-[var(--accent)] px-6 py-10 text-[var(--on-accent)] sm:px-12 sm:py-14 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <h2 className="text-3xl sm:text-[2.6rem]">{cfg.ctaTitle || (sellerName ? `Talk to ${seller.firstName}` : "Ready to take the next step?")}</h2>
              <p className="mt-3 max-w-lg opacity-85">{cfg.ctaText || "Questions about details, availability or the next steps? A direct reply is one message away."}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              {callNumber && <a href={`tel:${callNumber}`} className="pp-btn pp-btn-light"><Phone className="h-4 w-4" /> Call {sellerName || "us"}</a>}
              {mailAddress && <a href={`mailto:${mailAddress}?subject=${encodeURIComponent(`Enquiry: ${title}`)}`} className="pp-btn pp-btn-outline-light"><Mail className="h-4 w-4" /> Send an email</a>}
              {!callNumber && !mailAddress && <p className="text-sm opacity-80">Reply to the message this link came in and we'll get right back to you.</p>}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--ink)]">{orgName}</p>
            {organisation?.address && <p className="flex items-start gap-1.5"><MapPin className="mt-0.5 h-3 w-3 shrink-0" />{organisation.address}</p>}
          </div>
          <p>{issued ? `Shared on ${issued}. ` : ""}Details and availability are subject to change.</p>
        </div>
      </footer>
    </div>
  )
}
