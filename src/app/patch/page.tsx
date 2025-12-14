import Link from "next/link";
import { Button } from "@/components/ui/button";
import CommonPageContainer from "@/components/layout/CommonPageContainer";
import { Timeline, type TimelineItem } from "@/components/layout/timeline";
import { patchNotes } from "../../../docs/patchnotes";
import SectionHeader from "@/components/layout/SectionHeader";
import patchSectionHeader from "../../../docs/patch-section-header.json";
export default function PatchPage() {
  return (
    <CommonPageContainer>
      <div className="w-full space-y-8">
        <SectionHeader
          pageTitle={patchSectionHeader.pageTitle}
          title={patchSectionHeader.title}
          description={patchSectionHeader.description}
        />
        <div className="w-full space-y-4">
          <div className="w-full flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 py-8 text-xl font-bold"
              asChild
            >
              <Link href="/patch/v1">V1</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1 py-8 text-xl font-bold"
              asChild
            >
              <Link href="/patch/v2">V2</Link>
            </Button>
          </div>
        </div>

        <Timeline items={patchNotes} className="mt-8" />
      </div>
    </CommonPageContainer>
  );
}
