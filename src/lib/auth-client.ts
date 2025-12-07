// lib/auth-client.ts
"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// the commonly used hooks
export const { useSession, signIn, signOut, signUp } = authClient;
