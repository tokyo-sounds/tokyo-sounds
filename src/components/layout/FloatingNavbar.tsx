"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plane } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface FloatingNavbarProps {
  /** Current active page path (e.g., "/about", "/patch", "/chat"). Set to undefined for landing page. */
  activePath?: string;
  onStartClick?: () => void;
  delay?: number;
}

export default function FloatingNavbar({ 
  activePath, 
  onStartClick,
  delay = 0.1 
}: FloatingNavbarProps) {
  const t = useTranslations("LandingPage");
  const router = useRouter();
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const navLinks = [
    { href: "/about", label: t("navbar.about") },
    { href: "/patch", label: t("navbar.changelog") },
    { href: "/chat", label: t("navbar.help") },
  ];

  const handleStartClick = () => {
    if (onStartClick) {
      onStartClick();
    } else {
      router.push("/");
    }
  };

  const handleBrandClick = (e: React.MouseEvent) => {
    if (!activePath) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <motion.div
      className="hidden md:fixed md:top-8 md:left-0 md:right-0 md:z-100 md:flex md:justify-center md:px-4"
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        ease: [0.25, 0.46, 0.45, 0.94],
        delay,
      }}
    >
      <motion.nav
        className="relative flex items-center gap-2 px-3 py-3 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-xl shadow-gray-900/5 border border-white/50"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ 
          duration: 0.4, 
          ease: [0.25, 0.46, 0.45, 0.94],
          delay: 0.05
        }}
      >
        <div className="absolute inset-0 rounded-2xl bg-linear-to-b from-white/80 to-transparent pointer-events-none" />
        
        <motion.a 
          href="/"
          onClick={handleBrandClick}
          className="relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-orange-50 transition-colors duration-300 group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md shadow-orange-200/50 group-hover:shadow-lg group-hover:shadow-orange-300/50 transition-shadow duration-300">
            <Plane className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {t("navbar.brand")}
          </span>
        </motion.a>

        <div className="w-px h-8 bg-linear-to-b from-transparent via-gray-200 to-transparent" />

        <div className="relative z-10 flex items-center gap-1 px-2">
          {navLinks.map((link) => {
            const isActive = activePath === link.href;
            return (
              <motion.a 
                key={link.href}
                href={link.href}
                className={`relative px-5 py-2.5 text-sm font-medium rounded-xl transition-colors duration-300 ${
                  isActive ? "text-orange-600" : "text-gray-600"
                }`}
                onHoverStart={() => setHoveredLink(link.href)}
                onHoverEnd={() => setHoveredLink(null)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <AnimatePresence>
                  {hoveredLink === link.href && (
                    <motion.div
                      className="absolute inset-0 bg-gray-100 rounded-xl"
                      layoutId="navHover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>
                <span className={`relative z-10 transition-colors duration-300 ${hoveredLink === link.href ? 'text-gray-900' : ''}`}>
                  {link.label}
                </span>
                {isActive && (
                  <motion.div 
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-500"
                    layoutId="activeIndicator"
                  />
                )}
              </motion.a>
            );
          })}
        </div>

        <div className="w-px h-8 bg-linear-to-b from-transparent via-gray-200 to-transparent" />

        <motion.button
          onClick={handleStartClick}
          className="relative z-10 flex items-center gap-2.5 px-6 py-2.5 bg-linear-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 overflow-hidden group"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
          
          <div className="absolute inset-0 bg-linear-to-t from-orange-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <Plane className="relative z-10 w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
          <span className="relative z-10">{t("startFlying")}</span>
        </motion.button>
      </motion.nav>
    </motion.div>
  );
}
