import { useState, useEffect } from "react"
import { formatIST } from "@/lib/dateUtils"
import { useParams, useSearchParams } from "react-router-dom"
import { api } from "@/services/api"
import { getAssetUrl } from "@/lib/utils"
import { Phone, Mail, ArrowDown, MapPin } from "lucide-react"
import BrochureSection from "@/components/public/BrochureSection"

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
  }
  seller: {
    firstName: string
    lastName: string
    id: string
    email?: string
    phone?: string
  }
  organisation: {
    name: string
    logo?: string | null
    contactEmail?: string | null
    contactPhone?: string | null
    address?: string | null
  }
  shareConfig?: {
    youtubeUrl?: string
    customTitle?: string
    customDescription?: string
    createdAt?: string
  }
  lead?: {
    phone?: string
    firstName?: string
    lastName?: string
  }
}

const THEME_CSS = `
.mag{--paper:#f8f5ef;--paper-2:#f1ece2;--ink:#15120f;--muted:#6b645b;--rule:#d8d0c2;--accent:#9a3b1f;
  background:var(--paper);color:var(--ink);font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;min-height:100vh}
.mag-serif{font-family:'Playfair Display',Georgia,'Times New Roman',serif}
.mag-kicker{font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;font-weight:600;color:var(--accent)}
.mag-rule{border:0;border-top:1px solid var(--rule)}
.mag-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;height:2.75rem;padding:0 1.25rem;font-size:.875rem;font-weight:600;letter-spacing:.02em;
  border:1px solid var(--ink);border-radius:2px;transition:background .2s,color .2s,transform .2s;cursor:pointer}
.mag-btn:disabled{opacity:.5;cursor:not-allowed}
.mag-btn:focus-visible,.mag-icon-btn:focus-visible,.mag a:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.mag-btn-solid{background:var(--ink);color:#fff}.mag-btn-solid:hover:not(:disabled){background:var(--accent);border-color:var(--accent)}
.mag-btn-ghost{background:transparent;color:var(--ink)}.mag-btn-ghost:hover:not(:disabled){background:var(--ink);color:#fff}
.mag-icon-btn{display:inline-flex;align-items:center;justify-content:center;height:2.25rem;width:2.25rem;border-radius:999px;color:#fff;background:rgba(255,255,255,.08);transition:background .2s}
.mag-icon-btn:hover{background:rgba(255,255,255,.2)}
.mag-dropcap>p:first-of-type::first-letter{font-family:'Playfair Display',Georgia,serif;float:left;font-size:4.4rem;line-height:.82;font-weight:700;padding:.35rem .6rem 0 0;color:var(--accent)}
.mag-cols{column-gap:2.75rem}
@media(min-width:768px){.mag-cols-2{columns:2}}
.mag-cols p{break-inside:avoid-column}
.mag-rise{animation:mag-rise .8s cubic-bezier(.2,.7,.2,1) both}
@keyframes mag-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.mag-rise{animation:none}}
`

function splitCopy(text?: string) {
  const clean = (text || "").replace(/\r/g, "").trim()
  if (!clean) return { lede: "", body: [] as string[] }
  const paras = clean.split(/\n{1,}/).map((p) => p.trim()).filter(Boolean)
  if (paras.length > 1) return { lede: paras[0], body: paras.slice(1) }
  if (clean.length > 280) {
    const cut = clean.slice(0, 230).search(/[.!?](?=\s)[^.!?]*$/)
    const at = cut > 80 ? cut + 1 : clean.slice(0, 200).lastIndexOf(" ")
    return { lede: clean.slice(0, at).trim(), body: [clean.slice(at).trim()] }
  }
  return { lede: clean, body: [] as string[] }
}

function getEmbedUrl(url?: string) {
  if (!url) return null
  const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)
  return m && m[2].length === 11 ? `https://www.youtube.com/embed/${m[2]}` : null
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

  if (loading) return (
    <div className="mag flex items-center justify-center"><style>{THEME_CSS}</style>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent" />
    </div>
  )

  if (error) return (
    <div className="mag flex flex-col items-center justify-center gap-3 px-4 text-center"><style>{THEME_CSS}</style>
      <p className="mag-kicker">404</p>
      <h1 className="mag-serif text-4xl font-semibold">This page is no longer available</h1>
      <p className="text-[var(--muted)]">{error}</p>
    </div>
  )

  if (!data || !data.product) return null

  const { product, seller, organisation, shareConfig, lead } = data
  const title = shareConfig?.customTitle || product.name
  const { lede, body } = splitCopy(shareConfig?.customDescription || product.description)
  const embedUrl = getEmbedUrl(shareConfig?.youtubeUrl)
  const logoUrl = organisation?.logo && !logoBroken ? getAssetUrl(organisation.logo) : ""
  const orgName = organisation?.name || ""
  const sellerName = `${seller?.firstName || ""} ${seller?.lastName || ""}`.trim()
  const callNumber = seller?.phone || organisation?.contactPhone || ""
  const mailAddress = seller?.email || organisation?.contactEmail || ""
  const preparedFor = lead?.firstName ? `${lead.firstName}${lead.lastName ? ` ${lead.lastName}` : ""}` : ""
  const price = new Intl.NumberFormat("en-IN", { style: "currency", currency: product.currency || "INR", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(product.basePrice)
  const issued = shareConfig?.createdAt ? formatIST(shareConfig.createdAt, "d MMMM yyyy") : ""
  const heroImage = product.imageUrl ? getAssetUrl(product.imageUrl) : ""
  const brochureUrl = product.brochureUrl ? getAssetUrl(product.brochureUrl) : ""

  const facts: { label: string; value: string }[] = [
    product.category ? { label: "Category", value: product.category } : null,
    product.unit ? { label: "Sold per", value: product.unit } : null,
    product.minQuantity && product.minQuantity > 1 ? { label: "Minimum order", value: String(product.minQuantity) } : null,
    product.sku ? { label: "Reference", value: product.sku } : null,
    product.validUntil ? { label: "Offer valid until", value: formatIST(product.validUntil, "d MMM yyyy") } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="mag">
      <style>{THEME_CSS}</style>

      {/* Masthead */}
      <header className="border-b-[3px] border-double border-[var(--ink)]/80 bg-[var(--paper)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-8 sm:py-5">
          <div className="flex min-w-0 items-center">
            {logoUrl ? (
              <img src={logoUrl} alt={orgName} onError={() => setLogoBroken(true)} className="max-h-10 w-auto max-w-[200px] object-contain sm:max-h-12 sm:max-w-[260px]" />
            ) : (
              <span className="mag-serif truncate text-xl font-bold tracking-tight sm:text-2xl">{orgName || "Product Brief"}</span>
            )}
          </div>
          <div className="hidden text-right sm:block">
            <p className="mag-kicker">Product Brief</p>
            {issued && <p className="mt-0.5 text-xs text-[var(--muted)]">{issued}</p>}
          </div>
        </div>
      </header>

      <main>
        {/* Cover */}
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-8 sm:pb-14 sm:pt-16">
          <div className="mag-rise max-w-4xl">
            <p className="mag-kicker">{product.category || "Featured"}{preparedFor ? ` — Prepared for ${preparedFor}` : ""}</p>
            <h1 className="mag-serif mt-4 text-[2.5rem] font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">{title}</h1>
            {lede && <p className="mag-serif mt-6 max-w-3xl text-xl italic leading-relaxed text-[var(--ink)]/80 sm:text-2xl">{lede}</p>}
          </div>

          <div className="mag-rise mt-8 flex flex-wrap items-center gap-x-8 gap-y-5 border-y border-[var(--rule)] py-5" style={{ animationDelay: ".12s" }}>
            <div>
              <p className="text-[.68rem] font-semibold uppercase tracking-[.2em] text-[var(--muted)]">Starting at</p>
              <p className="mag-serif text-3xl font-bold sm:text-4xl">{price}</p>
            </div>
            {sellerName && (
              <div className="border-l border-[var(--rule)] pl-8">
                <p className="text-[.68rem] font-semibold uppercase tracking-[.2em] text-[var(--muted)]">Presented by</p>
                <p className="text-base font-medium">{sellerName}<span className="text-[var(--muted)]"> · {orgName}</span></p>
              </div>
            )}
            <div className="ml-auto flex flex-wrap gap-2">
              {brochureUrl && <a href="#brochure" className="mag-btn mag-btn-solid no-underline"><ArrowDown className="h-4 w-4" /> View brochure</a>}
              {mailAddress && <a href={`mailto:${mailAddress}?subject=${encodeURIComponent(`Enquiry: ${title}`)}`} className="mag-btn mag-btn-ghost no-underline"><Mail className="h-4 w-4" /> Enquire</a>}
            </div>
          </div>

          {heroImage && (
            <figure className="mag-rise mt-8" style={{ animationDelay: ".2s" }}>
              <div className="overflow-hidden bg-[var(--paper-2)]">
                <img src={heroImage} alt={title} className="max-h-[620px] w-full object-cover" />
              </div>
              <figcaption className="mt-2 text-xs italic text-[var(--muted)]">{product.name}{orgName ? ` — ${orgName}` : ""}</figcaption>
            </figure>
          )}
        </section>

        {/* Story + sidebar */}
        {(body.length > 0 || facts.length > 0 || (product.tags && product.tags.length > 0)) && (
          <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-8 sm:pb-16">
            <div className="grid gap-10 lg:grid-cols-[1fr_300px] lg:gap-14">
              <div>
                {body.length > 0 && (
                  <div className={`mag-dropcap mag-cols text-[1.05rem] leading-[1.8] text-[var(--ink)]/90 ${body.join("").length > 700 ? "mag-cols-2" : ""}`}>
                    {body.map((p, i) => <p key={i} className="mb-5">{p}</p>)}
                  </div>
                )}
              </div>
              <aside className="lg:sticky lg:top-6 lg:self-start">
                <div className="border-t-2 border-[var(--ink)] pt-4">
                  <p className="mag-kicker">At a glance</p>
                  <dl className="mt-3 divide-y divide-[var(--rule)]">
                    {facts.map((f) => (
                      <div key={f.label} className="flex items-baseline justify-between gap-4 py-2.5">
                        <dt className="text-xs uppercase tracking-wider text-[var(--muted)]">{f.label}</dt>
                        <dd className="text-right text-sm font-medium">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {product.tags && product.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {product.tags.map((t) => <span key={t} className="border border-[var(--rule)] px-2 py-0.5 text-xs text-[var(--muted)]">{t}</span>)}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </section>
        )}

        {/* Video */}
        {embedUrl && (
          <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-8 sm:pb-16">
            <p className="mag-kicker">In motion</p>
            <h2 className="mag-serif mb-5 mt-2 text-3xl font-semibold sm:text-4xl">See it in action</h2>
            <div className="aspect-video w-full overflow-hidden bg-black">
              <iframe className="h-full w-full" src={embedUrl} title="Product video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          </section>
        )}

        {/* Brochure */}
        {brochureUrl && (
          <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-8 sm:pb-20">
            <hr className="mag-rule mb-10" />
            <BrochureSection url={brochureUrl} title={title} />
          </div>
        )}

        {/* Contact */}
        <section className="bg-[var(--ink)] text-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-8 sm:py-16 md:grid-cols-[1.3fr_1fr] md:items-center">
            <div>
              <p className="mag-kicker !text-[#e4a186]">Let's talk</p>
              <h2 className="mag-serif mt-3 text-3xl font-semibold leading-tight sm:text-5xl">{sellerName ? `Speak with ${seller.firstName}` : `Speak with ${orgName}`}</h2>
              <p className="mt-3 max-w-md text-white/70">Questions on pricing, availability or a tailored offer? A direct reply is one message away.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              {callNumber && <a href={`tel:${callNumber}`} className="mag-btn no-underline !border-white !bg-white !text-[var(--ink)] hover:!bg-[#e4a186] hover:!border-[#e4a186]"><Phone className="h-4 w-4" /> Call {sellerName || "us"}</a>}
              {mailAddress && <a href={`mailto:${mailAddress}?subject=${encodeURIComponent(`Enquiry: ${title}`)}`} className="mag-btn no-underline !border-white/60 !bg-transparent !text-white hover:!bg-white hover:!text-[var(--ink)]"><Mail className="h-4 w-4" /> Send an email</a>}
              {!callNumber && !mailAddress && <p className="text-sm text-white/60">Reply to the message this link came in and we'll get right back to you.</p>}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[var(--paper)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="space-y-1">
            <p className="mag-serif text-sm font-semibold text-[var(--ink)]">{orgName}</p>
            {organisation?.address && <p className="flex items-start gap-1.5"><MapPin className="mt-0.5 h-3 w-3 shrink-0" />{organisation.address}</p>}
          </div>
          <p>Prices and availability are subject to change.</p>
        </div>
      </footer>
    </div>
  )
}
