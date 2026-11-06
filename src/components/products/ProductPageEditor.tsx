import { useRef, useState } from "react"
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAssetUrl } from "@/lib/utils"
import { uploadBrochure, type ProductPageConfig } from "@/services/productService"

interface Props {
  value: ProductPageConfig
  onChange: (next: ProductPageConfig) => void
}

/** Reads the natural size of an image file so the public collage can lay it out without waiting for it to load. */
function measure(file: File): Promise<{ w?: number; h?: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url) }
    img.onerror = () => { resolve({}); URL.revokeObjectURL(url) }
    img.src = url
  })
}

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list
  const next = list.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function RowActions({ index, length, onMove, onRemove }: { index: number; length: number; onMove: (to: number) => void; onRemove: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></Button>
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === length - 1} onClick={() => onMove(index + 1)} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></Button>
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onRemove} aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></Button>
    </div>
  )
}

export function ProductPageEditor({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const set = (patch: Partial<ProductPageConfig>) => onChange({ ...value, ...patch })

  const addImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const room = 24 - value.gallery.length
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, Math.max(room, 0))
    if (picked.length === 0) { toast.error("Choose image files (up to 24 in total)"); return }
    setUploading(true)
    const added: ProductPageConfig["gallery"] = []
    for (const file of picked) {
      try {
        const [{ w, h }, res] = await Promise.all([measure(file), uploadBrochure(file)])
        added.push({ url: res.url, w, h })
      } catch (e) {
        toast.error(`${file.name}: ${(e as Error).message || "upload failed"}`)
      }
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ""
    if (added.length) onChange({ ...value, gallery: [...value.gallery, ...added] })
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-sm font-semibold">Shareable page content</p>
      <p className="mb-3 text-xs text-muted-foreground">Everything here appears on the public link you send to customers or students. Leave a tab empty and that section is simply hidden.</p>

      <Tabs defaultValue="gallery">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="highlights">Highlights</TabsTrigger>
          <TabsTrigger value="details">Key details</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
        </TabsList>

        {/* Gallery */}
        <TabsContent value="gallery" className="space-y-3">
          <p className="text-xs text-muted-foreground">Add photos in any size or shape — they are arranged into a neat, full-width collage automatically. Drag order = order shown (use the arrows).</p>
          {value.gallery.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {value.gallery.map((g, i) => (
                <div key={g.url + i} className="space-y-1 rounded-md border bg-background p-1.5">
                  <img src={getAssetUrl(g.url)} alt="" className="h-20 w-full rounded object-cover" />
                  <Input value={g.caption || ""} placeholder="Caption (optional)" className="h-7 text-xs" maxLength={160}
                    onChange={(e) => set({ gallery: value.gallery.map((x, k) => (k === i ? { ...x, caption: e.target.value } : x)) })} />
                  <div className="flex justify-end">
                    <RowActions index={i} length={value.gallery.length} onMove={(to) => set({ gallery: move(value.gallery, i, to) })} onRemove={() => set({ gallery: value.gallery.filter((_, k) => k !== i) })} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addImages(e.target.files)} />
          <Button type="button" variant="outline" size="sm" disabled={uploading || value.gallery.length >= 24} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
            {uploading ? "Uploading…" : `Add images (${value.gallery.length}/24)`}
          </Button>
        </TabsContent>

        {/* Highlights */}
        <TabsContent value="highlights" className="space-y-2">
          <p className="text-xs text-muted-foreground">Short selling points shown as cards — e.g. "UGC-approved", "100% placement support", "Free shipping".</p>
          {value.highlights.map((h, i) => (
            <div key={i} className="flex items-start gap-2 rounded-md border bg-background p-2">
              <div className="grid flex-1 gap-1.5">
                <Input value={h.title} placeholder="Title" maxLength={100} onChange={(e) => set({ highlights: value.highlights.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)) })} />
                <Input value={h.text || ""} placeholder="One line of detail (optional)" maxLength={400} onChange={(e) => set({ highlights: value.highlights.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)) })} />
              </div>
              <RowActions index={i} length={value.highlights.length} onMove={(to) => set({ highlights: move(value.highlights, i, to) })} onRemove={() => set({ highlights: value.highlights.filter((_, k) => k !== i) })} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" disabled={value.highlights.length >= 12} onClick={() => set({ highlights: [...value.highlights, { title: "", text: "" }] })}><Plus className="mr-2 h-4 w-4" />Add highlight</Button>
        </TabsContent>

        {/* Key details */}
        <TabsContent value="details" className="space-y-2">
          <p className="text-xs text-muted-foreground">Quick facts as label / value pairs — e.g. Duration · 2 years, Mode · Online, Eligibility · Any graduate, Warranty · 1 year.</p>
          {value.details.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={d.label} placeholder="Label" maxLength={60} className="w-2/5" onChange={(e) => set({ details: value.details.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) })} />
              <Input value={d.value} placeholder="Value" maxLength={160} onChange={(e) => set({ details: value.details.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)) })} />
              <RowActions index={i} length={value.details.length} onMove={(to) => set({ details: move(value.details, i, to) })} onRemove={() => set({ details: value.details.filter((_, k) => k !== i) })} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" disabled={value.details.length >= 16} onClick={() => set({ details: [...value.details, { label: "", value: "" }] })}><Plus className="mr-2 h-4 w-4" />Add detail</Button>
        </TabsContent>

        {/* Sections */}
        <TabsContent value="sections" className="space-y-2">
          <p className="text-xs text-muted-foreground">Free-form content blocks with a heading — e.g. Curriculum, Eligibility, Admission process, Fee structure, What's in the box.</p>
          {value.sections.map((s, i) => (
            <div key={i} className="flex items-start gap-2 rounded-md border bg-background p-2">
              <div className="grid flex-1 gap-1.5">
                <Input value={s.title} placeholder="Heading" maxLength={100} onChange={(e) => set({ sections: value.sections.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)) })} />
                <Textarea value={s.body} placeholder="Text. Start a line with '- ' to make a bullet list." rows={4} maxLength={4000} onChange={(e) => set({ sections: value.sections.map((x, k) => (k === i ? { ...x, body: e.target.value } : x)) })} />
              </div>
              <RowActions index={i} length={value.sections.length} onMove={(to) => set({ sections: move(value.sections, i, to) })} onRemove={() => set({ sections: value.sections.filter((_, k) => k !== i) })} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" disabled={value.sections.length >= 10} onClick={() => set({ sections: [...value.sections, { title: "", body: "" }] })}><Plus className="mr-2 h-4 w-4" />Add section</Button>
        </TabsContent>

        {/* FAQs */}
        <TabsContent value="faqs" className="space-y-2">
          <p className="text-xs text-muted-foreground">Answer the questions people always ask before they enquire.</p>
          {value.faqs.map((f, i) => (
            <div key={i} className="flex items-start gap-2 rounded-md border bg-background p-2">
              <div className="grid flex-1 gap-1.5">
                <Input value={f.q} placeholder="Question" maxLength={200} onChange={(e) => set({ faqs: value.faqs.map((x, k) => (k === i ? { ...x, q: e.target.value } : x)) })} />
                <Textarea value={f.a} placeholder="Answer" rows={3} maxLength={1500} onChange={(e) => set({ faqs: value.faqs.map((x, k) => (k === i ? { ...x, a: e.target.value } : x)) })} />
              </div>
              <RowActions index={i} length={value.faqs.length} onMove={(to) => set({ faqs: move(value.faqs, i, to) })} onRemove={() => set({ faqs: value.faqs.filter((_, k) => k !== i) })} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" disabled={value.faqs.length >= 15} onClick={() => set({ faqs: [...value.faqs, { q: "", a: "" }] })}><Plus className="mr-2 h-4 w-4" />Add FAQ</Button>
        </TabsContent>

        {/* Style */}
        <TabsContent value="style" className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-md border bg-background p-2.5">
            <div>
              <Label className="text-sm">Show price on the page</Label>
              <p className="text-xs text-muted-foreground">Turn off for programs where fees are discussed in person.</p>
            </div>
            <Switch checked={value.showPrice} onCheckedChange={(v) => set({ showPrice: v })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Price label</Label>
              <Input value={value.priceLabel || ""} maxLength={40} placeholder="Starting at" onChange={(e) => set({ priceLabel: e.target.value })} />
              <p className="mt-1 text-xs text-muted-foreground">e.g. "Program fee", "Total fee", "From".</p>
            </div>
            <div>
              <Label>Accent colour</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={value.accentColor || "#4f46e5"} onChange={(e) => set({ accentColor: e.target.value })} className="h-9 w-12 cursor-pointer rounded border bg-background p-1" aria-label="Accent colour" />
                <Input value={value.accentColor || ""} placeholder="#4f46e5" maxLength={7} onChange={(e) => set({ accentColor: e.target.value })} />
              </div>
            </div>
          </div>
          <div>
            <Label>Closing call-to-action heading</Label>
            <Input value={value.ctaTitle || ""} maxLength={120} placeholder="Ready to take the next step?" onChange={(e) => set({ ctaTitle: e.target.value })} />
          </div>
          <div>
            <Label>Closing call-to-action text</Label>
            <Textarea value={value.ctaText || ""} maxLength={300} rows={2} placeholder="Talk to our counsellor about eligibility, fees and the admission process." onChange={(e) => set({ ctaText: e.target.value })} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
