import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CheckCircle2, Loader2, Unplug, ExternalLink, Copy, RefreshCw, TrendingUp, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { API_URL } from "@/config"
import {
  getGoogleAdsStatus, getGoogleAdsAuthUrl, getGoogleAdsAccounts, selectGoogleAdsAccount,
  getGoogleAdsConversionActions, regenerateGoogleAdsKey, disconnectGoogleAds,
} from "@/services/googleAdsService"

const copy = (text: string, label: string) => { navigator.clipboard?.writeText(text); toast.success(`${label} copied`) }

export function GoogleAdsConnect() {
  const qc = useQueryClient()
  const [picked, setPicked] = useState("")
  const refresh = () => qc.invalidateQueries({ queryKey: ["google-ads-status"] })

  const { data: status, isLoading } = useQuery({ queryKey: ["google-ads-status"], queryFn: getGoogleAdsStatus })
  const connected = !!status?.connected
  const hasAccount = !!status?.customerId

  const { data: accounts } = useQuery({ queryKey: ["google-ads-accounts"], queryFn: getGoogleAdsAccounts, enabled: connected && !status?.needsReconnect })
  const { data: actions } = useQuery({ queryKey: ["google-ads-actions"], queryFn: getGoogleAdsConversionActions, enabled: connected && hasAccount, retry: false })

  const connect = useMutation({
    mutationFn: async () => { window.location.href = (await getGoogleAdsAuthUrl()).authUrl },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Could not start Google Ads connection"),
  })
  const select = useMutation({
    mutationFn: selectGoogleAdsAccount,
    onSuccess: () => { refresh(); qc.invalidateQueries({ queryKey: ["google-ads-actions"] }); toast.success("Saved") },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Could not save"),
  })
  const regen = useMutation({ mutationFn: regenerateGoogleAdsKey, onSuccess: () => { refresh(); toast.success("New key generated. Update it in Google Ads.") } })
  const disconnect = useMutation({
    mutationFn: disconnectGoogleAds,
    onSuccess: () => { refresh(); toast.success("Google Ads disconnected") },
    onError: () => toast.error("Failed to disconnect"),
  })

  if (isLoading) return <Card className="rounded-[10px]"><CardContent className="py-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card>

  const webhookUrl = `${API_URL}/api/google-ads/lead-webhook`
  const customerFor = (id: string) => accounts?.accounts.find(a => a.id === id)

  return (
    <Card className={`rounded-[10px] ${connected ? "border-green-200 dark:border-green-800" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-white border border-border flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#4285F4]" />
            </div>
            <div>
              <CardTitle className="text-base">Google Ads</CardTitle>
              <CardDescription className="text-xs">Lead form leads, campaign reporting and won-deal conversions</CardDescription>
            </div>
          </div>
          {connected ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1"><CheckCircle2 className="w-3 h-3" />Connected</Badge>
          ) : <Badge variant="outline" className="text-muted-foreground">Not Connected</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!connected ? (
          <>
            <p className="text-sm text-muted-foreground">Connect your Google Ads account to receive Lead Form leads, see campaign spend and send won deals back to Google.</p>
            {status && !status.platformConfigured && (
              <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Google Ads is not set up on the server yet.</p>
            )}
            <Button onClick={() => connect.mutate()} disabled={connect.isPending || !status?.platformConfigured} className="gap-2">
              {connect.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}Connect Google Ads
            </Button>
          </>
        ) : (
          <>
            {status?.needsReconnect && (
              <div className="p-3 rounded-[8px] border border-amber-200 bg-amber-50 text-sm text-amber-800 flex items-center justify-between gap-2">
                <span>Google access expired or was revoked. Reconnect to continue.</span>
                <Button size="sm" onClick={() => connect.mutate()}>Reconnect</Button>
              </div>
            )}
            <div className="text-sm">Signed in as <span className="font-medium">{status?.email || "Google user"}</span></div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Google Ads account</label>
              <div className="flex gap-2">
                <select className="flex-1 h-9 rounded-md border border-input bg-background px-2 text-sm" value={picked || status?.customerId || ""} onChange={e => setPicked(e.target.value)}>
                  <option value="">Select an account…</option>
                  {accounts?.accounts.filter(a => !a.isManager).map(a => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
                </select>
                <Button size="sm" disabled={!picked || select.isPending} onClick={() => {
                  const a = customerFor(picked)
                  const mcc = accounts?.accounts.find(x => x.isManager)
                  select.mutate({ customerId: picked, customerName: a?.name, loginCustomerId: mcc?.id })
                }}>Save</Button>
              </div>
            </div>

            {hasAccount && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Conversion action for won deals</label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm" value={status?.conversionActionId || ""}
                  onChange={e => select.mutate({ customerId: status!.customerId!, customerName: status?.customerName, loginCustomerId: status?.loginCustomerId, conversionActionId: e.target.value })}>
                  <option value="">None (don't send conversions)</option>
                  {actions?.actions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                {status?.lastConversion && (
                  <p className={`text-xs ${status.lastConversion.ok ? "text-green-600" : "text-destructive"}`}>
                    Last upload: {status.lastConversion.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2 rounded-[8px] border border-border p-3">
              <p className="text-xs font-medium">Lead Form webhook (paste into Google Ads → Lead form → Lead delivery)</p>
              <div className="flex items-center gap-2 text-xs"><span className="w-16 text-muted-foreground">URL</span><code className="flex-1 truncate bg-muted px-2 py-1 rounded">{webhookUrl}</code>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(webhookUrl, "URL")}><Copy className="w-3.5 h-3.5" /></Button></div>
              <div className="flex items-center gap-2 text-xs"><span className="w-16 text-muted-foreground">Key</span><code className="flex-1 truncate bg-muted px-2 py-1 rounded">{status?.webhookKey}</code>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => status?.webhookKey && copy(status.webhookKey, "Key")}><Copy className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" title="Generate a new key" onClick={() => regen.mutate()}><RefreshCw className="w-3.5 h-3.5" /></Button></div>
              <p className="text-[11px] text-muted-foreground">
                {status?.lastLeadAt ? `Last lead received ${new Date(status.lastLeadAt).toLocaleString()}.` : status?.lastTestAt ? `Test received ${new Date(status.lastTestAt).toLocaleString()}.` : "Use “Send test data” in Google Ads to verify. Nothing received yet."}
              </p>
            </div>

            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5" onClick={() => disconnect.mutate()} disabled={disconnect.isPending}>
              {disconnect.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unplug className="w-3.5 h-3.5" />}Disconnect Google Ads
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
