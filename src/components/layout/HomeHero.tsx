import { TextHoverEffect } from "@/components/common/TextHoverEffect";
import { App_Info } from "@/lib/constraint";

export default function HomeHero({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative h-svh w-full flex flex-col items-center justify-center bg-linear-to-tr from-orange-600 to-red-800 overflow-hidden">
      <TextHoverEffect text={App_Info.title} />
      {children}
    </div>
  );
}
