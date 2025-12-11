"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { message } from "@/lib/constraint";
import { AuthForm } from "@/components/widget/AuthForm";
import CommonPageContainer from "@/components/layout/CommonPageContainer";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signUp.email({
        email,
        password,
        name: email.split("@")[0], // Use email prefix as default name
        callbackURL: "/profile",
      });

      if (result.error) {
        setError(result.error.message || message.register.error);
        setIsLoading(false);
        return;
      }

      // Success - redirect will be handled by Better Auth
      router.push("/profile");
    } catch (err: any) {
      setError(err?.message || message.register.error);
      setIsLoading(false);
    }
  };

  return (
    <CommonPageContainer>
      <AuthForm
        mode="register"
        onSubmit={handleSubmit}
        error={error}
        isLoading={isLoading}
      />
    </CommonPageContainer>
  );
}
