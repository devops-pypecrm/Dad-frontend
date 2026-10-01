import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Sparkles, KeyRound } from "lucide-react";

interface AiSettings {
  provider: string;
  model: string;
  enabled: boolean;
  apiKeyMasked: string;
  hasApiKey: boolean;
}

const PROVIDER_DEFAULT_MODEL: Record<string, string> = {
  gemini: "gemini-2.0-flash",
  groq: "llama-3.1-8b-instant",
};

const PROVIDER_KEY_LINKS: Record<string, string> = {
  gemini: "https://aistudio.google.com/apikey",
  groq: "https://console.groq.com/keys",
};

export default function AiIntegrationPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<AiSettings>({
    queryKey: ["super-admin", "ai-settings"],
    queryFn: async () => {
      const res = await api.get("/super-admin/ai-settings");
      return res.data;
    },
  });

  const [provider, setProvider] = useState("gemini");
  const [model, setModel] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (settings && !hydrated) {
      setProvider(settings.provider || "gemini");
      setModel(settings.model || PROVIDER_DEFAULT_MODEL[settings.provider || "gemini"]);
      setEnabled(!!settings.enabled);
      setHydrated(true);
    }
  }, [settings, hydrated]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.put("/super-admin/ai-settings", { provider, model, enabled, apiKey });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "ai-settings"] });
      setApiKey("");
      toast.success("AI integration settings saved");
    },
    onError: () => {
      toast.error("Failed to save AI settings");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen text-foreground">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-indigo-400" /> AI Integration
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure the AI provider used for AI-generated insights (User Trend, Business Trend). Keys are encrypted
          at rest and never displayed in full after saving.
        </p>
      </div>

      <Card className="max-w-2xl bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-indigo-400" /> Provider Configuration
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Free-tier keys are available from Google AI Studio (Gemini) or Groq Console.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2">
            <Label className="text-foreground">Provider</Label>
            <Select
              value={provider}
              onValueChange={(val) => {
                setProvider(val);
                setModel(PROVIDER_DEFAULT_MODEL[val] || "");
              }}
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Google Gemini</SelectItem>
                <SelectItem value="groq">Groq</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Get a free key at{" "}
              <a
                href={PROVIDER_KEY_LINKS[provider]}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                {PROVIDER_KEY_LINKS[provider]}
              </a>
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="model" className="text-foreground">Model</Label>
            <Input
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-background border-border text-foreground"
              placeholder={PROVIDER_DEFAULT_MODEL[provider]}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="apiKey" className="text-foreground">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-background border-border text-foreground"
              placeholder={settings?.hasApiKey ? settings.apiKeyMasked : "Paste your API key"}
            />
            <p className="text-xs text-muted-foreground">
              {settings?.hasApiKey
                ? "A key is already saved. Leave blank to keep it, or paste a new one to replace it."
                : "No key configured yet — insights will fall back to computed (non-AI) summaries."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <Label className="text-foreground cursor-pointer" onClick={() => setEnabled(!enabled)}>
              Enable AI-generated insights
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="max-w-2xl flex justify-end">
        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
