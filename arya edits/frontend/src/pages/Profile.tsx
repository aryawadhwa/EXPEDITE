import { SignedIn, UserProfile } from "@clerk/clerk-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, Activity, Clock, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Profile() {
    return (
        <div className="h-full p-6 lg:p-8 overflow-auto max-w-6xl mx-auto">
            <div className="flex flex-col gap-8">

                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-serif font-bold text-white mb-2">
                            Command Profile
                        </h1>
                        <p className="text-muted-foreground font-mono text-sm">
                            OPERATOR_ID: IND-8923 // CLEARANCE: LEVEL 5
                        </p>
                    </div>
                    <Badge variant="outline" className="border-primary text-primary px-4 py-2 font-mono bg-primary/10 bio-pulse">
                        STATUS: ACTIVE
                    </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Stats Visualizer */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Identity Card */}
                        <Card className="glass-card p-6 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full bg-[#14213D] border-2 border-primary/50 flex items-center justify-center mb-4 relative">
                                    <div className="absolute inset-0 rounded-full border border-primary/20 animate-[spin_10s_linear_infinite]" />
                                    <Shield className="w-10 h-10 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-1">Operator</h2>
                                <span className="text-xs text-muted-foreground font-mono bg-[#14213D] px-2 py-1 rounded">
                                    TEAM LEAD
                                </span>
                            </div>

                            <div className="mt-6 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Reputation</span>
                                    <span className="text-success font-mono">98.2%</span>
                                </div>
                                <div className="w-full h-1 bg-[#14213D] rounded-full overflow-hidden">
                                    <div className="h-full bg-success w-[98%]" />
                                </div>
                            </div>
                        </Card>

                        {/* System Stats */}
                        <Card className="glass-card p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Terminal className="w-4 h-4 text-primary" />
                                <h3 className="font-semibold text-white text-sm uppercase tracking-wider">System Output</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-black/40 rounded-lg border border-[#14213D]">
                                    <div className="text-xs text-muted-foreground mb-1">Total Emails</div>
                                    <div className="text-2xl font-mono text-white">1,248</div>
                                </div>
                                <div className="p-3 bg-black/40 rounded-lg border border-[#14213D]">
                                    <div className="text-xs text-muted-foreground mb-1">Credits</div>
                                    <div className="text-2xl font-mono text-primary">850</div>
                                </div>
                            </div>

                            <Button className="w-full bg-[#14213D] hover:bg-[#1f3055] text-white border border-primary/20 font-mono text-xs h-9">
                                VIEW AUDIT LOGS
                            </Button>
                        </Card>
                    </div>

                    {/* Right Column: Clerk Profile Embedded */}
                    <div className="lg:col-span-2">
                        <Card className="glass-card p-1 min-h-[600px] flex items-center justify-center">
                            <SignedIn>
                                <UserProfile
                                    appearance={{
                                        variables: {
                                            colorPrimary: "#FCA311",
                                            colorBackground: "#050505",
                                            colorText: "#E5E5E5",
                                            colorTextSecondary: "#9CA3AF",
                                            fontFamily: "Inter, sans-serif",
                                            borderRadius: "0.5rem",
                                        },
                                        elements: {
                                            rootBox: "w-full h-full shadow-none",
                                            card: "shadow-none bg-transparent w-full",
                                            navbar: "hidden",
                                            headerTitle: "text-white font-serif",
                                            headerSubtitle: "text-muted-foreground",
                                            socialButtonsIconButton: "border-[#14213D] hover:bg-[#14213D]",
                                            formButtonPrimary: "bg-primary text-black hover:bg-primary/90",
                                            formFieldInput: "bg-black/50 border-[#14213D] text-white",
                                        }
                                    }}
                                />
                            </SignedIn>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
