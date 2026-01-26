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
  Check
} from "lucide-react";

export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [connectedTools, setConnectedTools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const api = useApi();
  const { getToken } = useAuth();

  useEffect(() => {
    fetchIntegrations();
  }, []);

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
        <Card className="p-5 bg-card border-border space-y-4">


          {/* Dynamic Connected Integrations */}
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
              <p className="text-sm text-muted-foreground">No custom integrations connected.</p>
              <p className="text-xs text-muted-foreground mt-1">Ask the Agent in a mission chat to "Connect [Tool]" to add it here.</p>
            </div>
          )}
        </Card>
      </section>

      {/* Notifications */}
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
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Daily Digest</p>
              <p className="text-sm text-muted-foreground">Summary of agent activities</p>
            </div>
            <Select defaultValue="9am">
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
              onCheckedChange={setAutoApprove}
            />
          </div>

          <Separator />

          <div>
            <Label className="text-foreground">Personalization Threshold</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Minimum personalization score required
            </p>
            <Select defaultValue="80">
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
              defaultValue={50}
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
    </div>
  );
}
