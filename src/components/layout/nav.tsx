import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { navigationLinks } from "@/lib/constraint";
import { MenuIcon } from "lucide-react";

export default function Nav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 right-4 z-10"
        >
          <MenuIcon className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <nav>
          <ul className="w-full h-full flex flex-col">
            {navigationLinks.map((link) => (
              <li
                key={link.slug}
                className="relative hover:*:text-primary-foreground before:content-[''] before:absolute before:top-0 before:left-0 before:right-full before:h-full before:bg-primary hover:before:right-0 before:transition-all before:-z-10"
              >
                <Link
                  href={`/${link.slug}`}
                  className="w-full h-full p-6 flex items-center gap-4 text-2xl font-bold transition-all"
                >
                  <link.icon className="size-6" />
                  {link.label.ja}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
