"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/widget/LanguageSwitcher";
import ChipTab from "@/components/common/ChipTab";

interface MobileNavMenuProps {
  /** Current active page path (e.g., "/about", "/patch", "/chat"). Set to undefined for landing page. */
  activePath?: string;
}

export default function MobileNavMenu({ activePath }: MobileNavMenuProps) {
  const t = useTranslations("LandingPage");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  const navItems = [
    { label: t("navbar.about"), href: "/about" },
    { label: t("navbar.changelog"), href: "/patch" },
    { label: t("navbar.help"), href: "/chat" },
  ];

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    setTimeout(() => {
      router.push(href);
    }, 150);
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 w-11 h-11 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-gray-100 md:hidden"
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5 text-gray-700" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-18 right-4 z-50 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden md:hidden"
          >
            <div className="p-2 flex flex-col gap-1 min-w-[140px]">
              {navItems.map((item) => (
                <div
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="px-1 py-1"
                >
                  <ChipTab
                    text={item.label}
                    selected={activePath === item.href}
                    setSelected={() => {}}
                  />
                </div>
              ))}
              
              <div className="pt-2 mt-1 border-t border-gray-100 px-2">
                <LanguageSwitcher variant="dark" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
