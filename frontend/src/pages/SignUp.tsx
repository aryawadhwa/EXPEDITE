
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    UserButton,
} from "@clerk/clerk-react";
import { ShaderGradientBackground } from "@/components/ui/shader-gradient-background";

export default function SignUp() {
    return (
        <div className="flex justify-center items-center h-screen bg-black relative">
            <ShaderGradientBackground />
            <SignUpButton mode="modal">
                <button className="bg-lime hover:bg-lime/90 text-black font-bold py-3 px-6 rounded-full glow-lime transition-all hover:scale-105 relative z-10">
                    Sign Up with Clerk
                </button>
            </SignUpButton>
        </div>
    );
}
