import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApi } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Key,
  Bell,
  Shield,
  Zap,
  ExternalLink,
  Check,
  Loader2,
  Mail,
  MessageSquare,
  Github,
  FileSpreadsheet,
  Send,
  Bot,
  Search
} from "lucide-react";

// =============================================================================
// AVAILABLE INTEGRATIONS CONFIG
// =============================================================================

interface Integration {
  key: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const AVAILABLE_INTEGRATIONS: Integration[] = [
  {
    key: "gmail",
    name: "Gmail",
    icon: <Mail className="w-5 h-5" />,
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    description: "Send emails via Gmail"
  },
  {
    key: "slack",
    name: "Slack",
    icon: <MessageSquare className="w-5 h-5" />,
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    description: "Send Slack messages"
  },
  {
    key: "discord",
    name: "Discord",
    icon: <Bot className="w-5 h-5" />,
    color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    description: "Connect Discord"
  },
  {
    key: "telegram",
    name: "Telegram",
    icon: <Send className="w-5 h-5" />,
    color: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    description: "Send Telegram messages"
  },
  {
    key: "github",
    name: "GitHub",
    icon: <Github className="w-5 h-5" />,
    color: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    description: "Access GitHub repos"
  },
  {
    key: "google_sheets",
    name: "Sheets",
    icon: <FileSpreadsheet className="w-5 h-5" />,
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    description: "Read/write spreadsheets"
  },
  {
    key: "perplexity",
    name: "Perplexity",
    icon: <Search className="w-5 h-5" />,
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    description: "AI search"
  }
];

// =============================================================================
// INTEGRATION CARD COMPONENT
// =============================================================================

interface IntegrationCardProps {
  integration: Integration;
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: (key: string) => void;
}

function IntegrationCard({ integration, isConnected, isConnecting, onConnect }: IntegrationCardProps) {
  return (
    <button
      onClick={() => !isConnected && !isConnecting && onConnect(integration.key)}
      disabled={isConnected || isConnecting}
      className={`
        relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200
        ${isConnected
          ? "bg-success/10 border-success/30 cursor-default"
          : "bg-secondary/30 border-border hover:bg-secondary/60 hover:border-primary/50 hover:scale-105 cursor-pointer"
        }
        ${isConnecting ? "opacity-70 cursor-wait" : ""}
      `}
      title={isConnected ? `${integration.name} connected` : `Connect ${integration.name}`}
    >
      {/* Connected Badge */}
      {isConnected && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Icon */}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${integration.color}`}>
        {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : integration.icon}
      </div>

      {/* Name */}
      <span className={`text-xs font-medium ${isConnected ? "text-success" : "text-foreground"}`}>
        {integration.name}
      </span>

      {/* Status */}
      {isConnected && (
        <span className="text-[10px] text-success/80 mt-0.5">Connected</span>
      )}
    </button>
  );
}


export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [dailyDigestTime, setDailyDigestTime] = useState("9am");
  const [autoApprove, setAutoApprove] = useState(false);
  const [personalizationThreshold, setPersonalizationThreshold] = useState(80);
  const [dailySendingLimit, setDailySendingLimit] = useState(50);
  const [connectedTools, setConnectedTools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [connectingTool, setConnectingTool] = useState<string | null>(null);
  const api = useApi();
  const { getToken } = useAuth();

  const [assets, setAssets] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch settings on load
  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      setEmailNotifications(data.email_notifications ?? true);
      setDailyDigestTime(data.daily_digest_time ?? "9am");
      setAutoApprove(data.auto_approve_low_risk ?? false);
      setPersonalizationThreshold(data.personalization_threshold ?? 80);
      setDailySendingLimit(data.daily_sending_limit ?? 50);
    } catch (e) {
      console.error("Failed to fetch settings", e);
    }
  };

  // Save settings to backend
  const saveSettings = async (updates: Record<string, any>) => {
    setIsSaving(true);
    try {
      await api.updateSettings(updates);
    } catch (e) {
      console.error("Failed to save settings", e);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
    fetchAssets();
    fetchSettings();

    // Check if returning from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    if (connected) {
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => fetchIntegrations(), 500);
    }
  }, []);

  // ==========================================================================
  // INTEGRATION CONNECTION HANDLER
  // ==========================================================================

  const handleConnect = async (toolKey: string) => {
    setConnectingTool(toolKey);

    try {
      // Call backend to initiate OAuth
      const response = await api.connectTool(toolKey);

      if (response.redirect_url) {
        // Open OAuth in same window (will redirect back after auth)
        window.location.href = response.redirect_url;
      } else {
        // If no redirect needed (API key based), refresh list
        await fetchIntegrations();
        setConnectingTool(null);
      }
    } catch (error: any) {
      console.error(`Failed to connect ${toolKey}:`, error);
      alert(`Failed to connect ${toolKey}: ${error.message || 'Unknown error'}`);
      setConnectingTool(null);
    }
  };

  const fetchAssets = async () => {
    try {
      const data = await api.getAssets();
      console.log("Assets fetched:", data);
      setAssets(data);
    } catch (e) {
      console.error("Failed to fetch assets", e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        const res = await api.uploadAsset(e.target.files[0]);
        // Short delay to ensure mongo consistency
        if (res) {
          await fetchAssets();
          setTimeout(() => fetchAssets(), 1000);
        }
      } catch (err) {
        alert("Upload failed. Max size 10MB.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm("Delete this file?")) return;
    try {
      await api.deleteAsset(id);
      setAssets(prev => prev.filter(a => a.id !== id));
      setTimeout(() => fetchAssets(), 500);
    } catch (e) {
      console.error("Failed to delete asset", e);
    }
  };

  const fetchIntegrations = async () => {
    try {
      const data = await api.getIntegrations();
      setConnectedTools(data.integrations || []);
    } catch (e) {
      console.error("Failed to fetch integrations", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (tool: string) => {
    if (!confirm(`Are you sure you want to disconnect ${tool}?`)) return;
    try {
      await api.disconnectTool(tool);
      setConnectedTools(prev => prev.filter(i => i.name.toLowerCase() !== tool.toLowerCase()));
    } catch (e) {
      console.error("Failed to disconnect", e);
    }
  };



  return (
    <div className="h-full p-6 lg:p-8 overflow-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your AI outbound machine</p>
      </div>

      {/* API Integrations */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" />
          API Integrations
        </h2>
        <Card className="p-5 bg-card border-border space-y-6">

          {/* Available Integrations Grid */}
          <div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Available Integrations
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {AVAILABLE_INTEGRATIONS.map((integration) => {
                const isConnected = connectedTools.some(
                  (t) => t.name.toLowerCase() === integration.key.toLowerCase()
                );
                return (
                  <IntegrationCard
                    key={integration.key}
                    integration={integration}
                    isConnected={isConnected}
                    onConnect={handleConnect}
                    isConnecting={connectingTool === integration.key}
                  />
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Connected Integrations List */}
          {isLoading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">Loading integrations...</div>
          ) : connectedTools.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Connected Integrations</div>
              {connectedTools.map((tool) => (
                <div key={tool.name} className="flex items-center justify-between border border-border p-3 rounded-xl bg-secondary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center border border-border">
                      <span className="text-sm font-bold uppercase text-foreground">
                        {tool.name.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground capitalize">{tool.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {tool.connection_id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-success/10 text-success hover:bg-success/20 transition-colors">Active</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(tool.name)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center border-2 border-dashed border-border rounded-xl">
              <p className="text-sm text-muted-foreground">No integrations connected yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Click an icon above to connect an app.</p>
            </div>
          )}
        </Card>
      </section>

      {/* My Files */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-primary" />
          My Knowledge Assets
        </h2>
        <Card className="p-5 bg-card border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Mission Attachments</p>
              <p className="text-sm text-muted-foreground">Upload PDFs, Docs, or Images for agents to use.</p>
            </div>
            <div className="relative">
              <input
                type="file"
                id="asset-upload"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <Button asChild disabled={isUploading}>
                <label htmlFor="asset-upload" className="cursor-pointer gap-2">
                  {isUploading ? "Uploading..." : "Upload File"}
                </label>
              </Button>
            </div>
          </div>

          <Separator />

          {assets && assets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-secondary/10">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">doc</span>
                    </div>
                    <div className="min-w-0">
                      <a
                        href={`http://localhost:8000/api/v1/assets/${asset.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium truncate hover:text-primary hover:underline cursor-pointer block"
                      >
                        {asset.filename}
                      </a>
                      <p className="text-xs text-muted-foreground">{(asset.size_bytes / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteAsset(asset.id)} className="text-muted-foreground hover:text-destructive">
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No files uploaded yet.
            </div>
          )}
        </Card>
      </section>
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notifications
        </h2>
        <Card className="p-5 bg-card border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Get notified when agents complete tasks</p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={(checked) => {
                setEmailNotifications(checked);
                saveSettings({ email_notifications: checked });
              }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Daily Digest</p>
              <p className="text-sm text-muted-foreground">Summary of agent activities</p>
            </div>
            <Select
              value={dailyDigestTime}
              onValueChange={(value) => {
                setDailyDigestTime(value);
                saveSettings({ daily_digest_time: value });
              }}
            >
              <SelectTrigger className="w-32 bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="9am">9:00 AM</SelectItem>
                <SelectItem value="12pm">12:00 PM</SelectItem>
                <SelectItem value="6pm">6:00 PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      </section>

      {/* AI Behavior */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          AI Behavior
        </h2>
        <Card className="p-5 bg-card border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Auto-Approve Low-Risk Emails</p>
              <p className="text-sm text-muted-foreground">Skip review for high-confidence drafts</p>
            </div>
            <Switch
              checked={autoApprove}
              onCheckedChange={(checked) => {
                setAutoApprove(checked);
                saveSettings({ auto_approve_low_risk: checked });
              }}
            />
          </div>

          <Separator />

          <div>
            <Label className="text-foreground">Personalization Threshold</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Minimum personalization score required
            </p>
            <Select
              value={String(personalizationThreshold)}
              onValueChange={(value) => {
                const num = parseInt(value);
                setPersonalizationThreshold(num);
                saveSettings({ personalization_threshold: num });
              }}
            >
              <SelectTrigger className="w-full bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="70">70% - More Volume</SelectItem>
                <SelectItem value="80">80% - Balanced</SelectItem>
                <SelectItem value="90">90% - Higher Quality</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div>
            <Label className="text-foreground">Sending Limits</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Maximum emails per day per domain
            </p>
            <Input
              type="number"
              value={dailySendingLimit}
              onChange={(e) => setDailySendingLimit(parseInt(e.target.value) || 50)}
              onBlur={() => saveSettings({ daily_sending_limit: dailySendingLimit })}
              className="bg-secondary border-transparent"
            />
          </div>
        </Card>
      </section>

      {/* Security */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Security
        </h2>
        <Card className="p-5 bg-card border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Check className="w-3.5 h-3.5 text-success" />
              Enabled
            </Button>
          </div>
        </Card>
      </section>
    </div >
  );
}
