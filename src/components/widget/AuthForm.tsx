"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SocialLoginButtons } from "./SocialLoginButtons";
import {
  message,
  labels,
  placeholders,
  buttons,
  common,
  form,
} from "@/lib/constraint";

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit: (email: string, password: string) => Promise<void>;
  error?: string | null;
  isLoading?: boolean;
}

export function AuthForm({ mode, onSubmit, error, isLoading }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validation
    if (!email || !password) {
      setLocalError(message.validation.required);
      return;
    }

    if (mode === "register") {
      if (password !== confirmPassword) {
        setLocalError(message.validation.passwordMismatch);
        return;
      }
      if (password.length < 8) {
        setLocalError(message.validation.passwordLength);
        return;
      }
    }

    try {
      await onSubmit(email, password);
    } catch (err) {
      // Error is handled by parent component
      console.error("Auth error:", err);
    }
  };

  const displayError = error || localError;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {mode === "login" ? form.title.login : form.title.register}
        </CardTitle>
        <CardDescription>
          {mode === "login"
            ? form.description.login
            : form.description.register}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{labels.email}</Label>
            <Input
              id="email"
              type="email"
              placeholder={placeholders.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{labels.password}</Label>
            <Input
              id="password"
              type="password"
              placeholder={placeholders.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{labels.confirmPassword}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={placeholders.confirmPassword}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          )}
          {displayError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {displayError}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? common.loading
              : mode === "login"
              ? buttons.login
              : buttons.register}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              {common.or}
            </span>
          </div>
        </div>

        <SocialLoginButtons />
      </CardContent>
    </Card>
  );
}
