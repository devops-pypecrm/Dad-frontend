import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { connectGoogleAds } from "@/services/googleAdsService"

export default function GoogleAdsCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      setStatus('error')
      toast.error('Google Ads connection was cancelled or denied.')
      setTimeout(() => navigate('/settings/integrations'), 2000)
      return
    }

    if (!code) {
      setStatus('error')
      toast.error('No authorization code received.')
      setTimeout(() => navigate('/settings/integrations'), 2000)
      return
    }

    // Exchange code for tokens
    connectGoogleAds(code, searchParams.get("state") || "")
      .then(() => {
        setStatus('success')
        toast.success('Google Ads connected successfully!')
        setTimeout(() => navigate('/settings/integrations'), 1500)
      })
      .catch(() => {
        setStatus('error')
        toast.error('Failed to connect Google Ads. Please try again.')
        setTimeout(() => navigate('/settings/integrations'), 2000)
      })
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-500" />
            <h2 className="text-lg font-semibold">Connecting Google Ads...</h2>
            <p className="text-sm text-muted-foreground">Please wait while we complete the setup.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
            <h2 className="text-lg font-semibold text-green-700">Google Ads Connected!</h2>
            <p className="text-sm text-muted-foreground">Redirecting to settings...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 mx-auto text-red-500" />
            <h2 className="text-lg font-semibold text-red-700">Connection Failed</h2>
            <p className="text-sm text-muted-foreground">Redirecting to settings...</p>
          </>
        )}
      </div>
    </div>
  )
}
