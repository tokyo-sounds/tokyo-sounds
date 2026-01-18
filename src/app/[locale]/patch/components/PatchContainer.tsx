"use client";

import { useState, useEffect, useRef, memo, useMemo } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import { ArrowUp, History, Rocket, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useIsMobile } from "@/hooks/use-mobile";
import LanguageSwitcher from "@/components/widget/LanguageSwitcher";
import FloatingNavbar from "@/components/layout/FloatingNavbar";
import MobileNavMenu from "@/components/layout/MobileNavMenu";
import SiteFooter from "@/components/layout/SiteFooter";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  date: Date | string;
  title: string;
  description: string | React.ReactNode;
  id?: string;
}

function formatDate(date: Date | string): { year: string; monthDay: string } {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return { year: "Invalid", monthDay: "Date" };
  }

  const year = String(dateObj.getFullYear());
  const month = String(dateObj.getMonth() + 1);
  const day = String(dateObj.getDate());

  return { year, monthDay: `${month}/${day}` };
}

const TimelineItemComponent = memo(function TimelineItemComponent({
  item,
  isLast,
  index,
}: {
  item: TimelineItem;
  isLast: boolean;
  index: number;
}) {
  const formattedDate = useMemo(() => formatDate(item.date), [item.date]);
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const mobileDelay = isMobile ? Math.min(index * 0.03, 0.15) : index * 0.05;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{
        duration: 0.5,
        delay: mobileDelay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative flex gap-4 md:gap-6"
    >
      <div className="flex-shrink-0 w-20 md:w-28">
        <div className="sticky top-24">
          <time
            className="flex flex-col text-gray-900"
            dateTime={
              typeof item.date === "string"
                ? item.date
                : item.date.toISOString()
            }
          >
            <span className="text-2xl md:text-3xl font-bold text-orange-500 leading-tight">
              {formattedDate.year}
            </span>
            <span className="text-sm md:text-base font-medium text-gray-400 leading-tight mt-1">
              {formattedDate.monthDay}
            </span>
          </time>
        </div>
      </div>

      <div className="relative flex flex-col items-center flex-shrink-0 w-4">
        <motion.div 
          className="relative z-10 flex items-center justify-center size-4 rounded-full bg-orange-500 border-4 border-white shadow-md"
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ duration: 0.4, delay: mobileDelay + 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
        {!isLast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0.5 bottom-0 bg-gray-200" />
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{
          duration: 0.5,
          delay: mobileDelay + 0.15,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="flex-1 pb-8 md:pb-12"
      >
        <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg shadow-gray-200/50 p-5 md:p-6 hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300 group">
          <h3 className="text-gray-900 font-bold text-base md:text-lg mb-2 group-hover:text-orange-600 transition-colors">{item.title}</h3>
          <p className="text-gray-500 text-sm md:text-base leading-relaxed">
            {item.description}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
});

TimelineItemComponent.displayName = "TimelineItemComponent";

function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {items.map((item, index) => (
          <TimelineItemComponent
            key={item.id || index}
            item={item}
            index={index}
            isLast={index === items.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function HeroSection() {
  const t = useTranslations("PatchNotesPage");

  return (
    <section className="relative pt-24 md:pt-32 pb-8 md:pb-12 overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          className="flex items-center justify-center gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
        >
          <div className="w-8 h-px bg-linear-to-r from-transparent to-orange-400" />
          <span className="text-orange-400 text-sm tracking-[0.4em] font-medium uppercase">
            Changelog
          </span>
          <div className="w-8 h-px bg-linear-to-l from-transparent to-orange-400" />
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] bg-linear-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent mb-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
        >
          {t("pageTitle")}
        </motion.h1>

        <motion.h2 
          className="text-lg md:text-xl text-gray-700 font-medium mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {t("title")}
        </motion.h2>

        <motion.p 
          className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {t("description")}
        </motion.p>
      </div>
    </section>
  );
}

function DemoButtonsSection() {
  const t = useTranslations("PatchNotesPage");

  return (
    <section className="relative py-6 md:py-8">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg shadow-gray-200/50 p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200/50">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-gray-900 font-bold text-lg">{t("demoVersions.title")}</h3>
              <p className="text-gray-500 text-sm">{t("demoVersions.subtitle")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <Link 
              href="/patch/v1"
              className="group relative overflow-hidden rounded-xl bg-gray-50 border border-gray-200 p-4 md:p-6 hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl md:text-3xl font-black text-gray-900 group-hover:text-orange-600 transition-colors">V1</span>
                  <p className="text-gray-500 text-xs md:text-sm mt-1">{t("demoVersions.v1")}</p>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
              </div>
            </Link>

            <Link 
              href="/patch/v2"
              className="group relative overflow-hidden rounded-xl bg-gray-50 border border-gray-200 p-4 md:p-6 hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl md:text-3xl font-black text-gray-900 group-hover:text-orange-600 transition-colors">V2</span>
                  <p className="text-gray-500 text-xs md:text-sm mt-1">{t("demoVersions.v2")}</p>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
              </div>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TimelineSection() {
  const t = useTranslations("PatchNotesPage");
  const patchNotes = t.raw("patchNotes") as TimelineItem[];

  return (
    <section className="relative py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200/50">
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-gray-900 font-bold text-lg">{t("versionHistory.title")}</h3>
            <p className="text-gray-500 text-sm">{t("versionHistory.subtitle")}</p>
          </div>
        </motion.div>

        <Timeline items={patchNotes} />
      </div>
    </section>
  );
}

function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 500);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 z-40 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300"
        >
          <ArrowUp className="w-5 h-5 text-orange-500" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default function PatchContainer() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute -top-20 -left-32 w-[400px] h-[400px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(253, 186, 116, 0.35) 0%, rgba(254, 215, 170, 0.15) 40%, transparent 70%)' }}
        />
        
        <div 
          className="absolute top-32 -right-40 w-[350px] h-[350px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255, 237, 213, 0.3) 0%, rgba(254, 243, 199, 0.1) 40%, transparent 70%)' }}
        />
        
        <div 
          className="absolute top-[600px] -left-24 w-[300px] h-[300px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(252, 211, 77, 0.2) 0%, rgba(253, 186, 116, 0.08) 40%, transparent 70%)' }}
        />
        
        <div 
          className="absolute top-[1000px] -right-32 w-[350px] h-[350px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(254, 205, 211, 0.2) 0%, rgba(255, 237, 213, 0.08) 40%, transparent 70%)' }}
        />
        
        <div 
          className="absolute top-[1400px] left-1/4 w-[400px] h-[400px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255, 247, 237, 0.3) 0%, transparent 60%)' }}
        />

        <div 
          className="absolute top-[1800px] -right-20 w-[300px] h-[300px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(253, 186, 116, 0.25) 0%, rgba(254, 215, 170, 0.1) 40%, transparent 70%)' }}
        />
      </div>

      <FloatingNavbar activePath="/patch" />
      <MobileNavMenu activePath="/patch" />
      
      <div className="hidden md:block md:fixed md:top-4 md:right-4 md:z-100">
        <LanguageSwitcher variant="dark" />
      </div>

      <main className="bg-transparent relative z-10">
        <HeroSection />
        <DemoButtonsSection />
        <TimelineSection />
      </main>

      <SiteFooter activePath="/patch" className="mt-12" />

      <BackToTopButton />
    </div>
  );
}
