"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages, CheckIcon } from "lucide-react";
import { routing } from "@/i18n/routing";

const languages = [
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
] as const;

export default function LanguageSwitcher() {
  const params = useParams();
  const nextPathname = usePathname(); // Actual browser path with locale, e.g., "/zh-TW/about"
  const nextRouter = useRouter();
  const currentLocale = (params?.locale as string) || routing.defaultLocale;

  const handleLanguageChange = (locale: string) => {
    // Remove current locale from path and add new locale
    // Handle both root path (e.g., "/zh-TW") and nested paths (e.g., "/zh-TW/about")
    const pathWithoutLocale =
      nextPathname.replace(new RegExp(`^/${currentLocale}(/|$)`), "/") || "/";

    const newPath =
      pathWithoutLocale === "/"
        ? `/${locale}`
        : `/${locale}${pathWithoutLocale}`;

    nextRouter.replace(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="group rounded-full text-white/70 text-shadow-sm hover:bg-black/30 hover:border hover:border-border/50 hover:text-white text-xs font-mono pointer-events-auto z-40 will-change-transform"
          aria-label="Switch language"
        >
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {languages.map((lang) => {
          const isActive = currentLocale === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              className="cursor-pointer"
              onClick={() => handleLanguageChange(lang.code)}
            >
              <span className="flex items-center justify-between w-full">
                <span>{lang.label}</span>
                {isActive && <CheckIcon className="size-4 text-primary" />}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
