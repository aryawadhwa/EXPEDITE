import { SignedIn, useUser, useClerk } from "@clerk/clerk-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Mail, Calendar, User, Shield, ExternalLink, Smartphone, MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Profile() {
    const { user } = useUser();
    const { openUserProfile } = useClerk();
    const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');

    const subscriptionPlans = [
        {
            name: "Free",
            price: { USD: 0, INR: 0 },
            credits: 500,
            badge: "LIMITED - First 100 Users",
            features: [
                "500 credits",
                "Basic AI agents",
                "Email support",
                "Community access",
            ],
            current: true,
        },
        {
            name: "Premium",
            price: { USD: 4.99, INR: 499 },
            credits: 2500,
            badge: "POPULAR",
            features: [
                "2,500 credits/month",
                "Advanced AI agents",
                "Priority email support",
                "Custom workflows",
                "Analytics dashboard",
            ],
            current: false,
        },
        {
            name: "Pro",
            price: { USD: 9.99, INR: 999 },
            credits: 5000,
            badge: "BEST VALUE",
            features: [
                "5,000 credits/month",
                "All Premium features",
                "50 workflow automations",
                "Priority call support",
                "Dedicated account manager",
                "API access",
            ],
            current: false,
        },
    ];

    if (!user) return null;

    return (
        <div className="h-full p-6 lg:p-8 overflow-auto max-w-7xl mx-auto">
            <div className="flex flex-col gap-8">

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <span>My Account</span>
                            <span>/</span>
                            <span className="text-white">Profile</span>
                        </div>
                    </div>
                </div>

                {/* Custom Profile Layout */}
                <div className="grid grid-cols-1 gap-8">
                    {/* Header Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-[#0A0A0A] border border-white/5 p-8 flex flex-col md:flex-row items-center md:items-end gap-6">
                        {/* Grid Pattern Background */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none"
                            style={{
                                backgroundImage: 'linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)',
                                backgroundSize: '40px 40px'
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />

                        <div className="relative z-10">
                            <div className="relative inline-block">
                                <img
                                    src={user.imageUrl}
                                    alt={user.fullName || "User"}
                                    className="w-32 h-32 rounded-full border-4 border-[#0A0A0A] shadow-xl object-cover"
                                />
                                <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-1 rounded-full border-4 border-[#0A0A0A]">
                                    <Check className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 flex-1 text-center md:text-left translate-y-[-10px]">
                            <h1 className="text-3xl font-bold text-white mb-1 flex items-center justify-center md:justify-start gap-2">
                                {user.fullName}
                            </h1>
                            <p className="text-zinc-400 font-medium">{user.primaryEmailAddress?.emailAddress}</p>
                        </div>

                        <div className="relative z-10 flex gap-3">
                            <Button onClick={() => openUserProfile()} variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Manage Account
                            </Button>
                        </div>
                    </div>

                    {/* Personal Details Card */}
                    <Card className="bg-[#0A0A0A] border-white/5 p-0 overflow-hidden rounded-2xl">
                        <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                            <h3 className="text-lg font-semibold text-white">Personal details</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                <div>
                                    <label className="text-sm text-zinc-500 block mb-1">Full Name</label>
                                    <div className="text-zinc-200 font-medium">{user.fullName || "Not set"}</div>
                                </div>
                                <div>
                                    <label className="text-sm text-zinc-500 block mb-1">Email</label>
                                    <div className="text-zinc-200 font-medium">{user.primaryEmailAddress?.emailAddress}</div>
                                </div>
                                <div>
                                    <label className="text-sm text-zinc-500 block mb-1">User ID</label>
                                    <div className="text-zinc-200 font-medium font-mono text-sm">{user.id}</div>
                                </div>
                                <div>
                                    <label className="text-sm text-zinc-500 block mb-1">Joined Date</label>
                                    <div className="text-zinc-200 font-medium">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-zinc-500 block mb-1">Last Active</label>
                                    <div className="text-zinc-200 font-medium">
                                        {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-zinc-500 block mb-1">Authentication Method</label>
                                    <div className="flex gap-2">
                                        {user.externalAccounts.length > 0 ? (
                                            user.externalAccounts.map(acc => (
                                                <Badge key={acc.id} variant="secondary" className="bg-white/10 text-zinc-300 hover:bg-white/20 capitalize">
                                                    {acc.providerTitle || "External"}
                                                </Badge>
                                            ))
                                        ) : (
                                            <Badge variant="secondary" className="bg-white/10 text-zinc-300">
                                                Email/Password
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>


                <div className="mt-8 pb-10">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Subscription Plans</h2>
                            <p className="text-muted-foreground text-sm">Choose the plan that fits your needs</p>
                        </div>
                        <div className="flex items-center gap-2 bg-[#14213D] rounded-lg p-1">
                            <Button
                                size="sm"
                                variant={currency === 'USD' ? 'default' : 'ghost'}
                                onClick={() => setCurrency('USD')}
                                className={currency === 'USD' ? 'bg-primary text-black' : 'text-muted-foreground hover:text-white'}
                            >
                                USD
                            </Button>
                            <Button
                                size="sm"
                                variant={currency === 'INR' ? 'default' : 'ghost'}
                                onClick={() => setCurrency('INR')}
                                className={currency === 'INR' ? 'bg-primary text-black' : 'text-muted-foreground hover:text-white'}
                            >
                                INR
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {subscriptionPlans.map((plan) => (
                            <Card
                                key={plan.name}
                                className={`glass-card p-6 relative overflow-hidden flex flex-col ${plan.current ? 'border-2 border-primary ring-1 ring-primary/50' : ''
                                    }`}
                            >
                                {plan.current && (
                                    <Badge className="absolute top-4 right-4 bg-primary text-black hover:bg-primary/90">
                                        CURRENT
                                    </Badge>
                                )}

                                <div className="mb-4">
                                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                                    <Badge variant="outline" className="text-xs border-primary/40 text-primary bg-primary/5">
                                        {plan.badge}
                                    </Badge>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-white">
                                            {currency === 'USD' ? '$' : '\u20B9'}{plan.price[currency]}
                                        </span>
                                        {plan.price[currency] > 0 && (
                                            <span className="text-muted-foreground text-sm">/month</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-primary font-mono mt-1">
                                        {plan.credits.toLocaleString()} credits
                                    </p>
                                </div>

                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                            <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    className={`w-full ${plan.current
                                        ? 'bg-[#14213D] hover:bg-[#1f3055] border border-primary/20 text-muted-foreground'
                                        : 'bg-primary hover:bg-primary/90 text-black font-semibold'
                                        }`}
                                    disabled={plan.current}
                                >
                                    {plan.current ? 'Current Plan' : `Upgrade to ${plan.name}`}
                                </Button>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
