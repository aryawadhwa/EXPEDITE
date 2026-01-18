
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    UserButton,
} from "@clerk/clerk-react";

export default function SignUp() {
    return (
        <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
            <SignUpButton mode="modal">
                <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                    Sign Up with Clerk
                </button>
            </SignUpButton>
        </div>
    );
}
