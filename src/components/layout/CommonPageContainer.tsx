import { cn } from "@/lib/utils";
import Footer from "@/components/layout/Footer";
import BackToHomeButton from "@/components/widget/BackToHomeButton";

export default function CommonPageContainer({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <div
      className={cn(
        "w-full h-full min-h-screen flex flex-col items-center justify-between gap-4",
        className
      )}
    >
      <main className="w-full max-w-4xl h-full mx-auto p-4 flex flex-col items-center justify-center gap-4">
        {children}
      </main>
      <BackToHomeButton />
      <Footer />
    </div>
  );
}
