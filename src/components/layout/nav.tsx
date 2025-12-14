"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { navigationLinks } from "@/lib/constraint";
import { useIsMobile } from "@/hooks/use-mobile";
import { MenuIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const speedDialRef = useRef<HTMLDivElement>(null);
  const mainButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        mainButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        speedDialRef.current &&
        !speedDialRef.current.contains(target) &&
        isOpen
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use click instead of mousedown to avoid conflicts with button clicks
      document.addEventListener("click", handleClickOutside, true);
      return () => {
        document.removeEventListener("click", handleClickOutside, true);
      };
    }
  }, [isOpen]);

  // Close on focus leaving the speed dial
  useEffect(() => {
    const handleFocusOut = (e: FocusEvent) => {
      if (
        speedDialRef.current &&
        !speedDialRef.current.contains(e.relatedTarget as Node) &&
        isOpen
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      speedDialRef.current?.addEventListener("focusout", handleFocusOut);
      return () =>
        speedDialRef.current?.removeEventListener("focusout", handleFocusOut);
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent the click from bubbling to handleClickOutside
    e.stopPropagation();
  };

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Open on Enter or Space when focused (keyboard navigation)
    if ((e.key === "Enter" || e.key === " ") && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const handleItemClick = () => {
    setIsOpen(false);
  };

  // Calculate quarter-circle positions (90° to 180°, fanning from top counterclockwise to left)
  // In standard math coordinates: 90° = top (y = -radius), 180° = left (x = -radius)
  const radius = isMobile ? 100 : 140; // Distance from main button
  const totalItems = navigationLinks.length;
  const startAngle = 90; // Start from top (90°)
  const endAngle = 180; // End at left (180°, counterclockwise from top)
  const angleStep = (endAngle - startAngle) / (totalItems - 1 || 1);

  const getItemPosition = (index: number) => {
    const angle = startAngle + angleStep * index; // Increment for counterclockwise
    const angleRad = (angle * Math.PI) / 180;
    const x = Math.cos(angleRad) * radius;
    const y = -Math.sin(angleRad) * radius; // Negative because y increases downward
    return { x, y };
  };

  return (
    <div
      ref={speedDialRef}
      className="fixed bottom-4 right-4 z-50"
      role="group"
      aria-label="Navigation menu"
    >
      {/* Speed Dial Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="speed-dial-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 right-0"
            role="menu"
          >
            {navigationLinks.map((link, index) => {
              const position = getItemPosition(index);
              return (
                <motion.div
                  key={link.slug}
                  initial={{
                    opacity: 0,
                    scale: 0,
                    x: 0,
                    y: 0,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: position.x,
                    y: position.y,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0,
                    x: 0,
                    y: 0,
                  }}
                  transition={{
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  className="absolute bottom-0 right-0"
                >
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <Button
                        asChild
                        size="icon"
                        className="group size-12 rounded-full flight-dashboard-card shadow-lg hover:scale-110 hover:shadow-xl transition-transform will-change-transform"
                        aria-label={link.label.ja}
                        role="menuitem"
                        onClick={handleItemClick}
                      >
                        <Link href={`/${link.slug}`}>
                          <link.icon className="size-5" />
                          <span className="sr-only">{link.label.ja}</span>
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">{link.label.ja}</TooltipContent>
                  </Tooltip>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <Button
        ref={mainButtonRef}
        size="icon"
        className="group flight-dashboard-card size-16 md:size-20 rounded-full shadow-lg"
        onClick={toggleOpen}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="speed-dial-menu"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="size-6" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MenuIcon className="size-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </div>
  );
}
