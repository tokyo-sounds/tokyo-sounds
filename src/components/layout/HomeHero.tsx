import Link from "next/link";
import { TextHoverEffect } from "@/components/common/TextHoverEffect";
import { Button } from "@/components/ui/button";
import { App_Info } from "@/lib/constraint";

export default function HomeHero() {
  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-linear-to-tr from-orange-600 to-red-800 overflow-hidden">
      <TextHoverEffect text={App_Info.title} />
      <Link
        className="absolute bottom-1/5 left-1/2 -translate-x-1/2 hover:-translate-y-2 transition-all"
        href="/experiments/tokyo"
      >
        <Button
          size="lg"
          variant="outline"
          className="h-full rounded-xl text-3xl px-8 py-4 text-white font-thin uppercase tracking-wide bg-transparent border-border/40 hover:shadow-xl hover:shadow-yellow-500/50"
        >
          Play
        </Button>
      </Link>
    </div>
  );
}
