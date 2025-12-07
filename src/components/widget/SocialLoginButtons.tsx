"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";
import { Github, Chrome } from "lucide-react";
import { buttons } from "@/lib/constraint";

export function SocialLoginButtons() {
  const handleSocialLogin = async (provider: "google" | "github") => {
    try {
      await signIn.social({
        provider,
        callbackURL: "/profile",
      });
    } catch (error) {
      console.error(`Failed to sign in with ${provider}:`, error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleSocialLogin("google")}
      >
        <Chrome className="mr-2 h-4 w-4" />
        {buttons.continueWithGoogle}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleSocialLogin("github")}
      >
        <Github className="mr-2 h-4 w-4" />
        {buttons.continueWithGitHub}
      </Button>
    </div>
  );
}
