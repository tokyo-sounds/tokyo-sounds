"use client";

import { memo, useMemo, useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
 * Formats a date to a readable format (e.g., "January 15, 2024")
 */
function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Memoized timeline item component for performance optimization
 */
const TimelineItemComponent = memo(function TimelineItemComponent({
  item,
  index,
  isLast,
  totalItems,
  scrollProgress,
}: {
  item: TimelineItem;
  index: number;
  isLast: boolean;
  totalItems: number;
  scrollProgress: MotionValue<number>;
}) {
  const formattedDate = useMemo(() => formatDate(item.date), [item.date]);

  // Calculate progress for this specific line segment
  // Each segment fills based on its position in the timeline
  const segmentProgress = useTransform(scrollProgress, (progress: number) => {
    const totalSegments = totalItems - 1; // Number of line segments
    if (totalSegments === 0) return 0;

    const segmentStart = index / totalSegments;
    const segmentEnd = (index + 1) / totalSegments;

    if (progress <= segmentStart) return 0;
    if (progress >= segmentEnd) return 1;

    // Linear interpolation within this segment
    return (progress - segmentStart) / (segmentEnd - segmentStart);
  });

  const progressHeight = useTransform(
    segmentProgress,
    (value: number) => `${value * 100}%`
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative flex gap-4 md:gap-6"
    >
      {/* Date Section - Left Side */}
      <div className="flex-shrink-0 w-32 md:w-40">
        <div className="sticky top-4">
          <time
            className="text-sm md:text-base font-medium text-muted-foreground"
            dateTime={
              typeof item.date === "string"
                ? item.date
                : item.date.toISOString()
            }
          >
            {formattedDate}
          </time>
        </div>
      </div>

      {/* Vertical Line */}
      <div className="relative flex flex-col items-center flex-shrink-0 w-4">
        {/* Dot */}
        <div className="relative z-10 flex items-center justify-center size-4 rounded-full bg-background border-3 border-primary" />
        {/* Line extending down to next item */}
        {!isLast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1 bottom-0 bg-border">
            {/* Animated Progress Bar */}
            <motion.div
              className="absolute top-0 left-0 w-full bg-primary origin-top"
              style={{
                height: progressHeight,
              }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
            />
          </div>
        )}
      </div>

      {/* Content Section - Right Side */}
      <div className="flex-1 pb-8 md:pb-12">
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
      </div>
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Track overall scroll progress of the entire timeline
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      <div className="relative">
        {items.map((item, index) => (
          <TimelineItemComponent
            key={item.id || index}
            item={item}
            index={index}
            isLast={index === items.length - 1}
            totalItems={items.length}
            scrollProgress={scrollYProgress}
          />
        ))}
      </div>
    </div>
  );
}
