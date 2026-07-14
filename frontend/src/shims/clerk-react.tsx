import { type ReactNode } from "react";

type AuthResult = {
  getToken: () => Promise<string>;
  userId: string;
  isLoaded: boolean;
  isSignedIn: boolean;
};

export function useAuth(): AuthResult {
  return {
    getToken: async () => "expedite-local-dev",
    userId: "arya-local",
    isLoaded: true,
    isSignedIn: true,
  };
}

export function useUser() {
  return {
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: "arya-local",
      firstName: "Arya",
      lastName: "Wadhwa",
      primaryEmailAddress: { emailAddress: "arya@local.dev" },
      imageUrl: "",
    },
  };
}

export function useClerk() {
  return {
    signOut: async () => undefined,
    openUserProfile: () => undefined,
  };
}

export function ClerkProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function SignedIn({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function SignedOut({ children }: { children: ReactNode }) {
  return null;
}

export function RedirectToSignIn() {
  return null;
}

export function SignInButton({ children }: { children?: ReactNode }) {
  return <>{children ?? null}</>;
}

export function UserButton() {
  return null;
}

export function SignIn() {
  return null;
}

export function SignUp() {
  return null;
}
