import Link from "next/link";
import { Button } from "@/components/ui/button";
import CommonPageContainer from "@/components/layout/CommonPageContainer";
import { Timeline, type TimelineItem } from "@/components/layout/timeline";
import { patchNotes } from "../../../docs/patchnotes";

export default function PatchPage() {
  return (
    <CommonPageContainer>
      <div className="w-full space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Patch Notes</h1>
            <p className="text-muted-foreground">
              Track all updates and improvements to Tokyo Sounds
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/patch/v1">
              <Button variant="outline">V1</Button>
            </Link>
            <Link href="/patch/v2">
              <Button variant="outline">V2</Button>
            </Link>
          </div>
        </div>

        <Timeline items={patchNotes} className="mt-8" />
      </div>
    </CommonPageContainer>
  );
}
