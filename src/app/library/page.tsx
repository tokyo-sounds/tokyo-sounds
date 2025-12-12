import ParticleRing from "@/components/common/ParticleRing";
import { App_Info } from "@/lib/constraint";

export default function LibraryPage() {
  return (
    <div className="relative">
      <ParticleRing />

      <h1 className="absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] text-slate-200 font-medium text-2xl md:text-5xl pointer-events-none">
        {App_Info.title}
      </h1>
    </div>
  );
}
