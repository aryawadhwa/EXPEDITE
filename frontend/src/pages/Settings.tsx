import { useState, useEffect, useCallback } from "react";
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
  Bell,
  Shield,
  Zap,
  ExternalLink,
  Check
} from "lucide-react";






export default function Settings() {
  // Interfaces to avoid 'any'
  interface Asset {
    id: string;
    filename: string;
    size_bytes: number;
  }

  interface UserSettings {
    email_notifications?: boolean;
    daily_digest_time?: string;
    auto_approve_low_risk?: boolean;
    personalization_threshold?: number;
    daily_sending_limit?: number;
  }

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [dailyDigestTime, setDailyDigestTime] = useState("9am");
  const [autoApprove, setAutoApprove] = useState(false);
  const [personalizationThreshold, setPersonalizationThreshold] = useState(80);
  const [dailySendingLimit, setDailySendingLimit] = useState(50);
  const [isSaving, setIsSaving] = useState(false);

  const api = useApi();
  // removed unused getToken

  const [assets, setAssets] = useState<Asset[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch settings on load
  const fetchSettings = useCallback(async () => {
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
  }, [api]);

  // Save settings to backend
  const saveSettings = async (updates: UserSettings) => {
    setIsSaving(true);
    try {
      await api.updateSettings(updates);
    } catch (e) {
      console.error("Failed to save settings", e);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchAssets = useCallback(async () => {
    try {
      const data = await api.getAssets();
      console.log("Assets fetched:", data);
      setAssets(data);
    } catch (e) {
      console.error("Failed to fetch assets", e);
    }
  }, [api]);

  useEffect(() => {
    fetchAssets();
    fetchSettings();
  }, [fetchAssets, fetchSettings]);

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







  return (
    <div className="h-full p-6 lg:p-8 overflow-auto max-w-4xl bg-black/50 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 mt-1">Configure your AI outbound machine</p>
      </div>

      {/* My Files */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-primary" />
          My Knowledge Assets
        </h2>
        <Card className="p-5 bg-zinc-900/50 backdrop-blur-md border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Mission Attachments</p>
              <p className="text-sm text-zinc-400">Upload PDFs, Docs, or Images for agents to use.</p>
            </div>
            <div className="relative">
              <input
                type="file"
                id="asset-upload"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <Button asChild disabled={isUploading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <label htmlFor="asset-upload" className="cursor-pointer gap-2">
                  {isUploading ? "Uploading..." : "Upload File"}
                </label>
              </Button>
            </div>
          </div>

          <Separator className="bg-white/10" />

          {assets && assets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-black/20 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">doc</span>
                    </div>
                    <div className="min-w-0">
                      <a
                        href={`http://localhost:8000/api/v1/assets/${asset.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium truncate text-zinc-300 hover:text-white cursor-pointer block"
                      >
                        {asset.filename}
                      </a>
                      <p className="text-xs text-zinc-500">{(asset.size_bytes / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteAsset(asset.id)} className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10">
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-zinc-500 border border-dashed border-white/10 rounded-lg bg-white/5">
              No files uploaded yet.
            </div>
          )}
        </Card>
      </section>
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notifications
        </h2>
        <Card className="p-5 bg-zinc-900/50 backdrop-blur-md border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Email Notifications</p>
              <p className="text-sm text-zinc-400">Get notified when agents complete tasks</p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={(checked) => {
                setEmailNotifications(checked);
                saveSettings({ email_notifications: checked });
              }}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <Separator className="bg-white/10" />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Daily Digest</p>
              <p className="text-sm text-zinc-400">Summary of agent activities</p>
            </div>
            <Select
              value={dailyDigestTime}
              onValueChange={(value) => {
                setDailyDigestTime(value);
                saveSettings({ daily_digest_time: value });
              }}
            >
              <SelectTrigger className="w-32 bg-black/40 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white">
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
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          AI Behavior
        </h2>
        <Card className="p-5 bg-zinc-900/50 backdrop-blur-md border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Auto-Approve Low-Risk Emails</p>
              <p className="text-sm text-zinc-400">Skip review for high-confidence drafts</p>
            </div>
            <Switch
              checked={autoApprove}
              onCheckedChange={(checked) => {
                setAutoApprove(checked);
                saveSettings({ auto_approve_low_risk: checked });
              }}
               className="data-[state=checked]:bg-primary"
            />
          </div>

          <Separator className="bg-white/10" />

          <div>
            <Label className="text-white">Personalization Threshold</Label>
            <p className="text-sm text-zinc-400 mb-2">
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
              <SelectTrigger className="w-full bg-black/40 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white">
                <SelectItem value="70">70% - More Volume</SelectItem>
                <SelectItem value="80">80% - Balanced</SelectItem>
                <SelectItem value="90">90% - Higher Quality</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-white/10" />

          <div>
            <Label className="text-white">Sending Limits</Label>
            <p className="text-sm text-zinc-400 mb-2">
              Maximum emails per day per domain
            </p>
            <Input
              type="number"
              value={dailySendingLimit}
              onChange={(e) => setDailySendingLimit(parseInt(e.target.value) || 50)}
              onBlur={() => saveSettings({ daily_sending_limit: dailySendingLimit })}
              className="bg-black/40 border-white/10 text-white"
            />
          </div>
        </Card>
      </section>

      {/* Security */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Security
        </h2>
        <Card className="p-5 bg-zinc-900/50 backdrop-blur-md border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Two-Factor Authentication</p>
              <p className="text-sm text-zinc-400">Add an extra layer of security</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 bg-white/5 border-white/10 text-green-400 hover:bg-white/10 hover:text-green-300">
              <Check className="w-3.5 h-3.5" />
              Enabled
            </Button>
          </div>
        </Card>
      </section>
    </div >
  );
}
