import { TextHoverEffect } from "@/components/common/TextHoverEffect";
import { App_Info } from "@/lib/constraint";

export default function HomeHero({ children }: { children?: React.ReactNode }) {
  return (
    <div className="absolute top-1/2 -translate-y-1/2 w-svw z-0">
      <TextHoverEffect text={App_Info.title} />
      {children}
    </div>
  );
}
