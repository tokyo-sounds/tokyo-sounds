"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import { 
  Plane, 
  Palette, 
  Sparkles, 
  Users, 
  Github, 
  Linkedin, 
  Globe,
  Code2,
  Layers,
  Map,
  Music,
  Volume2,
  MessageSquare,
  Menu,
  X,
  ArrowUp
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import LanguageSwitcher from "@/components/widget/LanguageSwitcher";
import ChipTab from "@/components/common/ChipTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Types
type TeamMember = {
  name: string;
  role: string;
  description: string;
  profileImage: string;
  socials: {
    github?: string;
    linkedin?: string;
    website?: string;
  };
};

type DesignConcept = {
  title: string;
  subtitle: string;
  content: string;
};

type TechStack = {
  title: string;
  content: string;
};

// Design concept icons
const DESIGN_ICONS = [Plane, Palette, Sparkles];
// Tech stack icons
const TECH_ICONS = [Layers, Code2, Map, Music, Sparkles, MessageSquare];

function FloatingNavbar() {
  const t = useTranslations("LandingPage");
  const router = useRouter();
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const navLinks = [
    { href: "/", label: t("navbar.brand"), isHome: true },
    { href: "/about", label: t("navbar.about") },
    { href: "/patch", label: t("navbar.changelog") },
    { href: "/chat", label: t("navbar.help") },
  ];

  const handleStartClick = () => {
    router.push("/");
  };

  return (
    <motion.div
      className="hidden md:fixed md:top-8 md:left-0 md:right-0 md:z-100 md:flex md:justify-center md:px-4"
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: 0.1,
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
          {navLinks.filter(l => !l.isHome).map((link) => (
            <motion.a 
              key={link.href}
              href={link.href}
              className={`relative px-5 py-2.5 text-sm font-medium rounded-xl transition-colors duration-300 ${
                link.href === "/about" ? "text-orange-600" : "text-gray-600"
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
                    layoutId="navHoverAbout"
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
              {link.href === "/about" && (
                <motion.div 
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-500"
                  layoutId="activeIndicator"
                />
              )}
            </motion.a>
          ))}
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

function MobileNavMenu() {
  const t = useTranslations("LandingPage");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("About");
  
  const navItems = [
    { label: t("navbar.about"), href: "/about" },
    { label: t("navbar.changelog"), href: "/patch" },
    { label: t("navbar.help"), href: "/chat" },
  ];

  const handleNavClick = (href: string, label: string) => {
    setSelected(label);
    setIsOpen(false);
    setTimeout(() => {
      router.push(href);
    }, 150);
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 w-11 h-11 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 md:hidden"
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
                  onClick={() => handleNavClick(item.href, item.label)}
                  className="px-1 py-1"
                >
                  <ChipTab
                    text={item.label}
                    selected={item.href === "/about"}
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

function RevealText({ 
  children, 
  className = "",
  delay = 0 
}: { 
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: isMobile ? 20 : 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ 
        duration: isMobile ? 0.4 : 0.6, 
        delay: isMobile ? delay * 0.5 : delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {children}
    </motion.div>
  );
}

function GlassCard({ 
  children, 
  className = "",
  index = 0,
  onClick
}: { 
  children: React.ReactNode; 
  className?: string;
  index?: number;
  onClick?: () => void;
}) {
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const mobileDelay = isMobile ? Math.min(index * 0.05, 0.15) : index * 0.1;
  const animationY = isMobile ? 30 : 60;

  return (
    <motion.div
      ref={ref}
      className={`
        relative overflow-hidden rounded-2xl
        bg-white
        border border-gray-100
        shadow-lg shadow-gray-200/50
        ${className}
      `}
      initial={{ opacity: 0, y: animationY }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ 
        duration: isMobile ? 0.4 : 0.6, 
        delay: mobileDelay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

function HeroSection() {
  const t = useTranslations("AboutPage");
  const isMobile = useIsMobile();

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
            About
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

function DesignConceptContent() {
  const t = useTranslations("AboutPage");
  const designConcepts = t.raw("designConcept") as DesignConcept[];

  return (
    <div className="relative py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {designConcepts.map((concept, index) => {
          const IconComponent = DESIGN_ICONS[index];
          return (
            <GlassCard 
              key={concept.title} 
              index={index} 
              className="p-6 md:p-8 group hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-5 md:mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-orange-200/50">
                <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <h3 className="text-gray-900 font-bold text-lg md:text-xl mb-2">{concept.title}</h3>
              <p className="text-orange-500 text-sm font-medium mb-3 md:mb-4">{concept.subtitle}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{concept.content}</p>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

function TechStackContent() {
  const t = useTranslations("AboutPage");
  const techStack = t.raw("techStack") as TechStack[];
  const isMobile = useIsMobile();

  return (
    <div className="relative py-8 overflow-hidden">
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(249,115,22,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} 
      />

      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {techStack.map((tech, index) => {
            const IconComponent = TECH_ICONS[index % TECH_ICONS.length];
            return (
              <GlassCard 
                key={tech.title} 
                index={index} 
                className="p-5 md:p-6 group hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 group-hover:bg-orange-200 transition-colors">
                    <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-bold text-base md:text-lg mb-2">{tech.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{tech.content}</p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MemberModalContent({ member }: { member: TeamMember }) {
  return (
    <>
      <div className="relative h-32 bg-linear-to-br from-orange-400 via-orange-500 to-orange-600 -mx-6 -mt-6 rounded-t-lg">
        <div className="absolute top-4 right-4 w-20 h-20 border border-white/20 rounded-full" />
        <div className="absolute bottom-8 left-8 w-12 h-12 bg-white/10 rounded-full blur-lg" />
      </div>
      
      <div className="relative flex justify-center -mt-16">
        <div className="relative">
          <div className="absolute inset-0 bg-orange-400 rounded-full blur-2xl opacity-30 scale-150" />
          
          <div className="relative w-28 h-28 rounded-full bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-xl ring-4 ring-white overflow-hidden">
            {member.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={member.profileImage} 
                alt={member.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Users className={`w-14 h-14 text-white ${member.profileImage ? 'hidden' : ''}`} />
          </div>
        </div>
      </div>
      
      <div className="pt-6 pb-2 text-center">
        <DialogTitle className="text-2xl font-bold text-gray-900">
          {member.name}
        </DialogTitle>
        
        <DialogDescription className="text-orange-500 font-semibold mt-1 text-base">
          {member.role}
        </DialogDescription>
        
        <p className="text-gray-600 mt-4 leading-relaxed">{member.description}</p>
        
        {(member.socials?.github || member.socials?.linkedin || member.socials?.website) && (
          <div className="flex justify-center gap-4 mt-6">
            {member.socials.github && (
              <a 
                href={member.socials.github} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-orange-500 transition-all duration-200 group"
              >
                <Github className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </a>
            )}
            {member.socials.linkedin && (
              <a 
                href={member.socials.linkedin} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-orange-500 transition-all duration-200 group"
              >
                <Linkedin className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </a>
            )}
            {member.socials.website && (
              <a 
                href={member.socials.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-orange-500 transition-all duration-200 group"
              >
                <Globe className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </a>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function TeamMembersContent() {
  const t = useTranslations("AboutPage");
  const members = t.raw("memberList") as TeamMember[];
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  return (
    <div className="relative py-8">
      <div className="flex flex-col gap-4">
        {members.map((member, index) => (
          <motion.div 
            key={member.name} 
            className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg shadow-gray-200/50 group cursor-pointer"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ 
              scale: 1.02, 
              y: -4,
              boxShadow: "0 20px 40px -12px rgba(249, 115, 22, 0.15), 0 8px 16px -8px rgba(0, 0, 0, 0.1)"
            }}
            transition={{ 
              duration: 0.4, 
              delay: index * 0.08,
              ease: [0.25, 0.46, 0.45, 0.94],
              scale: { duration: 0.2, ease: "easeOut" },
              y: { duration: 0.2, ease: "easeOut" },
              boxShadow: { duration: 0.2, ease: "easeOut" }
            }}
            onClick={() => setSelectedMember(member)}
          >
            <div className="flex items-center gap-4 md:gap-6 p-4 md:p-5">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-orange-400 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 scale-150" />
                
                <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:shadow-orange-200/50 transition-all duration-300 overflow-hidden">
                  {member.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={member.profileImage} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <Users className={`w-7 h-7 md:w-8 md:h-8 text-white ${member.profileImage ? 'hidden' : ''}`} />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 font-bold text-base md:text-lg leading-tight">{member.name}</h3>
                <p className="text-orange-500 text-sm font-medium mt-0.5">{member.role}</p>
                <p className="text-gray-500 text-sm mt-1.5 line-clamp-2 hidden md:block">{member.description}</p>
              </div>
              
              {(member.socials?.github || member.socials?.linkedin || member.socials?.website) && (
                <div className="flex gap-2 shrink-0">
                  {member.socials.github && (
                    <a 
                      href={member.socials.github} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-orange-500 transition-all duration-200 group/social"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Github className="w-4 h-4 md:w-5 md:h-5 text-gray-500 group-hover/social:text-white transition-colors" />
                    </a>
                  )}
                  {member.socials.linkedin && (
                    <a 
                      href={member.socials.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-orange-500 transition-all duration-200 group/social"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Linkedin className="w-4 h-4 md:w-5 md:h-5 text-gray-500 group-hover/social:text-white transition-colors" />
                    </a>
                  )}
                  {member.socials.website && (
                    <a 
                      href={member.socials.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-orange-500 transition-all duration-200 group/social"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Globe className="w-4 h-4 md:w-5 md:h-5 text-gray-500 group-hover/social:text-white transition-colors" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="sm:max-w-md p-6 rounded-3xl overflow-hidden">
          {selectedMember && <MemberModalContent member={selectedMember} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TabsSection() {
  const t = useTranslations("AboutPage");

  return (
    <section className="relative py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <Tabs defaultValue="design" className="w-full">
          <TabsList className="w-full h-12 md:h-14 bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 shadow-lg shadow-gray-200/50 border border-gray-100 mb-6 md:mb-8">
            <TabsTrigger 
              value="design" 
              className="flex-1 h-full rounded-xl text-sm md:text-base font-medium transition-all data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              {t("tabs.design")}
            </TabsTrigger>
            <TabsTrigger 
              value="tech" 
              className="flex-1 h-full rounded-xl text-sm md:text-base font-medium transition-all data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              {t("tabs.tech")}
            </TabsTrigger>
            <TabsTrigger 
              value="member" 
              className="flex-1 h-full rounded-xl text-sm md:text-base font-medium transition-all data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              {t("tabs.member")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="mt-0">
            <DesignConceptContent />
          </TabsContent>
          
          <TabsContent value="tech" className="mt-0">
            <TechStackContent />
          </TabsContent>
          
          <TabsContent value="member" className="mt-0">
            <TeamMembersContent />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

function Footer() {
  const t = useTranslations("LandingPage");

  return (
    <footer className="relative py-8 px-6 bg-gray-900 text-white mt-12">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-gray-400 text-sm">
          {t("footer.copyright")}
        </div>
        <div className="flex items-center gap-6">
          <a href="/about" className="text-orange-400 text-sm transition-colors">
            {t("footer.about")}
          </a>
          <a href="/patch" className="text-gray-400 hover:text-orange-400 text-sm transition-colors">
            {t("footer.changelog")}
          </a>
          <a href="/chat" className="text-gray-400 hover:text-orange-400 text-sm transition-colors">
            {t("footer.help")}
          </a>
        </div>
      </div>
    </footer>
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

export default function AboutContainer() {
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
          className="absolute top-[900px] -right-32 w-[350px] h-[350px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(254, 205, 211, 0.2) 0%, rgba(255, 237, 213, 0.08) 40%, transparent 70%)' }}
        />
        
        <div 
          className="absolute top-[1200px] left-1/3 w-[400px] h-[400px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255, 247, 237, 0.3) 0%, transparent 60%)' }}
        />
      </div>

      <FloatingNavbar />
      <MobileNavMenu />
      
      <div className="hidden md:block md:fixed md:top-4 md:right-4 md:z-100">
        <LanguageSwitcher variant="dark" />
      </div>

      <main className="bg-white">
        <HeroSection />
        <TabsSection />
      </main>

      <Footer />

      <BackToTopButton />
    </div>
  );
}
