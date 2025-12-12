"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { labels, buttons, common, errors, pages } from "@/lib/constraint";

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error(errors.logoutFailed, error);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">{common.loading}</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null; // Will redirect in useEffect
  }

  const user = session.user;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0].toUpperCase() || "U";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{pages.profile.title}</CardTitle>
          <CardDescription>{pages.profile.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={user.image || undefined}
                alt={user.name || "User"}
              />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">
                {user.name || "未設定名稱"}
              </h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {labels.name}
              </label>
              <p className="mt-1 text-base">
                {user.name || labels.unspecified}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {labels.email}
              </label>
              <p className="mt-1 text-base">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {labels.emailVerified}
              </label>
              <p className="mt-1 text-base">
                {user.emailVerified ? (
                  <span className="text-green-600">{labels.verified}</span>
                ) : (
                  <span className="text-yellow-600">{labels.notVerified}</span>
                )}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push("/")}>
              {buttons.backHome}
            </Button>
            <Button variant="destructive" onClick={handleSignOut}>
              {buttons.logout}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
