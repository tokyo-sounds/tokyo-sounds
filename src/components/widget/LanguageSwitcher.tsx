"use client";

import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, CheckIcon } from "lucide-react";
import { routing } from "@/i18n/routing";

const languages = [
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
] as const;

export default function LanguageSwitcher() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || routing.defaultLocale;

  // Ensure pathname is clean (without locale prefix)
  // usePathname from next-intl should return path without locale, but we'll clean it anyway
  const cleanPathname = (() => {
    let path = pathname || "/";
    // Remove any locale prefix if present
    for (const locale of routing.locales) {
      const localePrefix = `/${locale}`;
      if (path === localePrefix || path.startsWith(`${localePrefix}/`)) {
        path = path.replace(localePrefix, "") || "/";
        break;
      }
    }
    return path;
  })();

  const handleLanguageChange = (locale: string) => {
    // Construct the new path with the target locale
    // cleanPathname should be like "/about" or "/", not "/zh-TW/about"
    const newPath =
      cleanPathname === "/" ? `/${locale}` : `/${locale}${cleanPathname}`;
    router.replace(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="group flight-dashboard-card size-10 md:size-12 rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-transform will-change-transform"
          aria-label="Switch language"
        >
          <Globe className="size-5" />
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
