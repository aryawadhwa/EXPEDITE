import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Check, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { integrations as staticIntegrations, Integration } from "@/lib/integrationsData";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIES = [
    "All",
    "Communication & Collaboration",
    "Custom_trigger",
    "Developer Tools & Infrastructure",
    "Document & File Management",
    "Finance & Accounting",
    "HR & People Operations",
    "Marketing & Social Media",
    "Project Management & Productivity",
    "Sales & CRM",
    "Specialized Tools",
];

export function Integrations() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [integrations, setIntegrations] = useState<Integration[]>(staticIntegrations);
    const [isLoading, setIsLoading] = useState(true);
    const [connectingTool, setConnectingTool] = useState<string | null>(null);

    const api = useApi();
    const { toast } = useToast();

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const data = await api.getIntegrations();
                const connectedMap = new Map();

                if (data && data.integrations) {
                    data.integrations.forEach((conn: any) => {
                        connectedMap.set(conn.name.toLowerCase(), conn);
                    });
                }

                const mergedIntegrations = staticIntegrations.map(integration => {
                    // Check for exact match or partial match on ID/Name
                    // The backend returns names like "gmail", "slack"
                    // Our static IDs are like "gmail", "slack"
                    const key = integration.id.toLowerCase();
                    const conn = connectedMap.get(key);

                    if (conn) {
                        return {
                            ...integration,
                            status: "connected" as const,
                            connectedAs: "Connected" // Backend doesn't return email yet for all, but we can update if it does
                        };
                    }
                    return integration;
                });

                setIntegrations(mergedIntegrations);
            } catch (error) {
                console.error("Failed to fetch integrations:", error);
                toast({
                    title: "Error",
                    description: "Failed to load integration status",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchConnections();
    }, [api, toast]);

    const handleConnect = async (toolId: string, toolName: string) => {
        setConnectingTool(toolId);
        try {
            // Use current URL as redirect URL
            const currentUrl = window.location.href;

            const res = await api.connectTool(toolId, { redirect_url: currentUrl });

            if (res.redirect_url) {
                window.location.href = res.redirect_url;
            } else {
                toast({
                    title: "Configuration Required",
                    description: "No redirect URL returned. Please check backend config.",
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            toast({
                title: "Connection Failed",
                description: error.message || "Could not initiate connection",
                variant: "destructive"
            });
        } finally {
            setConnectingTool(null);
        }
    };

    const filteredIntegrations = useMemo(() => {
        return integrations.filter((integration) => {
            const matchesCategory =
                selectedCategory === "All" || integration.category === selectedCategory;
            const matchesSearch =
                integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                integration.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [searchQuery, selectedCategory, integrations]);

    return (
        <div className="flex flex-col h-full bg-background p-6 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Integrations</h1>
                <Button className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none shadow-none">
                    <Plus className="w-4 h-4 mr-2" />
                    New Custom Integration
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4 mb-8">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search integrations..."
                        className="pl-10 bg-muted/50 border-none h-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((category) => {
                        const count =
                            category === "All"
                                ? integrations.length
                                : integrations.filter((i) => i.category === category).length;

                        return (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-2",
                                    selectedCategory === category
                                        ? "bg-foreground text-background"
                                        : "bg-background border border-border text-muted-foreground hover:bg-muted"
                                )}
                            >
                                {category}
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-full text-[10px]",
                                    selectedCategory === category
                                        ? "bg-background/20 text-background"
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto pr-2 pb-10">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredIntegrations.map((integration) => (
                            <IntegrationCard
                                key={integration.id}
                                integration={integration}
                                onConnect={() => handleConnect(integration.id, integration.name)}
                                isConnecting={connectingTool === integration.id}
                            />
                        ))}

                        {filteredIntegrations.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <p>No integrations found matching your filters.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function IntegrationCard({
    integration,
    onConnect,
    isConnecting
}: {
    integration: Integration;
    onConnect: () => void;
    isConnecting: boolean;
}) {
    // Generate a fallback color based on name for the icon background
    const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

    return (
        <div className="group relative flex flex-col p-5 rounded-xl border border-border bg-card hover:border-primary/20 hover:shadow-sm transition-all h-full">
            <div className="flex justify-between items-start mb-4">
                {/* Placeholder Logo / Icon */}
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted/50 text-foreground font-bold text-sm">
                    {/* If we had real logos, we'd use <img /> here. For now, using initials or specific icons if mapped */}
                    {integration.logo ? (
                        <img src={integration.logo} alt={integration.name} className="w-6 h-6 object-contain" />
                    ) : (
                        <span>{getInitials(integration.name)}</span>
                    )}
                </div>

                <Badge variant="secondary" className="text-[10px] font-normal opacity-70">
                    {integration.category.split(' & ')[0]} {/* Shorten category for badge */}
                </Badge>
            </div>

            <div className="mb-2">
                <h3 className="font-semibold text-base mb-1">{integration.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {integration.description}
                </p>
            </div>

            <div className="mt-auto pt-4">
                {integration.status === "connected" ? (
                    <div className="flex justify-between items-center w-full">
                        <div className="h-8 px-3 w-full bg-emerald-500/10 text-emerald-600 rounded-md flex items-center justify-center text-xs font-medium gap-1.5">
                            <Check className="w-3 h-3" />
                            {integration.connectedAs || "Connected"}
                        </div>
                    </div>
                ) : integration.status === "pending" ? (
                    <div className="h-8 px-3 w-full bg-amber-500/10 text-amber-600 rounded-md flex items-center justify-center text-xs font-medium">
                        Pending
                    </div>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8 hover:bg-primary hover:text-primary-foreground group-hover:border-primary/50"
                        onClick={onConnect}
                        disabled={isConnecting}
                    >
                        {isConnecting ? (
                            <>
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                Connecting...
                            </>
                        ) : (
                            "Connect"
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}
