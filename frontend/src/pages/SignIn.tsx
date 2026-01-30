
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    UserButton,
} from "@clerk/clerk-react";
import { ShaderGradientBackground } from "@/components/ui/shader-gradient-background";

export default function SignIn() {
    return (
        <div className="flex justify-center items-center h-screen bg-black relative">
            <ShaderGradientBackground />
            <SignInButton mode="modal">
                <button className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-full glow-lime transition-all hover:scale-105 relative z-10">
                    Sign In with Clerk
                </button>
            </SignInButton>
        </div>
    );
}
