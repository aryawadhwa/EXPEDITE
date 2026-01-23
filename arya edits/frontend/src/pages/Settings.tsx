import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  return (
    <div className="h-full p-6 lg:p-8 overflow-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your AI expedite machine</p>
      </div>

      {/* API Integrations */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" />
          API Integrations
        </h2>
        <Card className="p-5 bg-card border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0A66C2]/20 flex items-center justify-center">
                <span className="text-sm font-bold text-[#0A66C2]">in</span>
              </div>
              <div>
                <p className="font-medium text-foreground">LinkedIn Sales Navigator</p>
                <p className="text-sm text-muted-foreground">Prospect discovery and enrichment</p>
              </div>
            </div>
            <Badge className="bg-success/10 text-success">Connected</Badge>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <span className="text-sm font-bold text-purple-400">Ap</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Apollo.io</p>
                <p className="text-sm text-muted-foreground">Contact data enrichment</p>
              </div>
            </div>
            <Badge className="bg-success/10 text-success">Connected</Badge>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <span className="text-sm font-bold text-orange-400">Hu</span>
              </div>
              <div>
                <p className="font-medium text-foreground">HubSpot CRM</p>
                <p className="text-sm text-muted-foreground">Sync prospects and activities</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Connect
            </Button>
          </div>
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
