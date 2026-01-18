"use client";

import { useTranslations } from "next-intl";

interface SiteFooterProps {
  /** Current active page path (e.g., "/about", "/patch", "/chat"). Set to undefined for landing page. */
  activePath?: string;
  className?: string;
}

export default function SiteFooter({ activePath, className = "" }: SiteFooterProps) {
  const t = useTranslations("LandingPage");

  const footerLinks = [
    { href: "/about", label: t("footer.about") },
    { href: "/patch", label: t("footer.changelog") },
    { href: "/chat", label: t("footer.help") },
  ];

  return (
    <footer className={`relative py-8 px-6 bg-gray-900 text-white ${className}`}>
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-gray-400 text-sm">
          {t("footer.copyright")}
        </div>
        <div className="flex items-center gap-6">
          {footerLinks.map((link) => {
            const isActive = activePath === link.href;
            return (
              <a 
                key={link.href}
                href={link.href} 
                className={`text-sm transition-colors ${
                  isActive 
                    ? "text-orange-400" 
                    : "text-gray-400 hover:text-orange-400"
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
