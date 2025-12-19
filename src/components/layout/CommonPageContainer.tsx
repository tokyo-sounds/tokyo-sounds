import { cn } from "@/lib/utils";
import Nav from "@/components/layout/nav";
import Footer from "@/components/layout/footer";
import BackToHomeButton from "@/components/widget/BackToHomeButton";

export default function CommonPageContainer({
  children,
  className,
  innerClassName,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}>) {
  return (
    <div
      className={cn(
        "w-full h-full min-h-dvh flex flex-col items-center justify-between gap-4",
        className
      )}
    >
      <Nav />
      <main
        className={cn(
          "w-full max-w-4xl h-full min-h-0 flex-1 mx-auto p-4",
          innerClassName
        )}
      >
        {children}
      </main>
      <h6 className="hidden md:block fixed top-1/2 -translate-y-1/2 right-4 text-lg font-serif font-light text-primary-foreground tracking-[1rem] pointer-events-none select-none [writing-mode:vertical-rl]">
        東京の音
      </h6>
      <BackToHomeButton />
      <Footer />
    </div>
  );
}
