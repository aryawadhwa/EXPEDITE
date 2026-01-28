import { SignedIn, UserProfile } from "@clerk/clerk-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Profile() {
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

    return (
        <div className="h-full p-6 lg:p-8 overflow-auto max-w-7xl mx-auto">
            <div className="flex flex-col gap-8">

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-serif font-bold text-white mb-2">
                            Profile & Subscription
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Manage your account and subscription
                        </p>
                    </div>
                </div>

                <Card className="glass-card p-0 w-full overflow-hidden">
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
                                    rootBox: "w-full shadow-none",
                                    card: "shadow-none bg-transparent w-full max-w-none rounded-none border-none",
                                    scrollBox: "w-full max-w-none p-6",
                                    page: "w-full max-w-none",
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
