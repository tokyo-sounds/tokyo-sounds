"use client";

import { memo, useMemo } from "react";
import { motion } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  date: Date | string;
  title: string;
  description: string | React.ReactNode;
  id?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

/**
 * 日付を年、月日を分離して返す
 * 年と月日を別々のスタイルで表示するため
 */
function formatDate(date: Date | string): { year: string; monthDay: string } {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return { year: "Invalid", monthDay: "Date" };
  }

  const year = String(dateObj.getFullYear());
  const month = String(dateObj.getMonth() + 1);
  const day = String(dateObj.getDate());

  return { year, monthDay: `${month}月${day}日` };
}

/**
 * Memoized timeline item component for performance optimization
 */
const TimelineItemComponent = memo(function TimelineItemComponent({
  item,
  isLast,
}: {
  item: TimelineItem;
  isLast: boolean;
}) {
  const formattedDate = useMemo(() => formatDate(item.date), [item.date]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative flex gap-4 md:gap-6"
    >
      {/* Date Section - Left Side */}
      <div className="flex-shrink-0 w-32 md:w-40">
        <div className="sticky top-4">
          <time
            className="flex flex-col text-white"
            dateTime={
              typeof item.date === "string"
                ? item.date
                : item.date.toISOString()
            }
          >
            {/* 年を第一行に表示 */}
            <span className="text-4xl md:text-5xl font-light leading-tight">
              {formattedDate.year}
            </span>
            {/* 月日を第二行に表示 */}
            <span className="text-md md:text-lg font-thin tracking-widest leading-tight mt-1">
              {formattedDate.monthDay}
            </span>
          </time>
        </div>
      </div>

      {/* Vertical Line */}
      <div className="relative flex flex-col items-center flex-shrink-0 w-4">
        {/* Dot */}
        <div className="relative z-10 flex items-center justify-center size-4 rounded-full bg-secondary border-3 border-white" />
        {/* Line extending down to next item */}
        {!isLast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1 bottom-0 bg-secondary border-secondary" />
        )}
      </div>

      {/* Content Section - Right Side */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{
          duration: 0.5,
          type: "spring",
        }}
        className="flex-1 pb-8 md:pb-12"
      >
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm md:text-base leading-relaxed">
              {item.description}
            </CardDescription>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
});

TimelineItemComponent.displayName = "TimelineItemComponent";

/**
 * Vertical Timeline Component
 *
 * Displays a list of timeline items with dates on the left and content on the right.
 * Optimized for performance with memoization and viewport-based animations.
 */
export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {items.map((item, index) => (
          <TimelineItemComponent
            key={item.id || index}
            item={item}
            isLast={index === items.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
