import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

export default function BackToHomeButton() {
  return (
    <Button variant="outline" size="lg" asChild>
      <Link href="/">
        <ArrowLeftIcon className="size-4" />
        Back to Home
      </Link>
    </Button>
  );
}
