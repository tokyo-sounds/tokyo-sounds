import Link from "next/link";
import { Button } from "@/components/ui/button";
import CommonPageContainer from "@/components/layout/CommonPageContainer";
import { Timeline, type TimelineItem } from "@/components/layout/timeline";

const patchNotes: TimelineItem[] = [
  {
    id: "v2.1.0",
    date: new Date("2024-12-15"),
    title: "Version 2.1.0 - Performance Improvements",
    description:
      "Major performance optimizations including reduced memory usage, improved rendering pipeline, and enhanced audio processing. Added support for new audio formats and improved 3D rendering performance by 40%.",
  },
  {
    id: "v2.0.5",
    date: new Date("2024-11-28"),
    title: "Version 2.0.5 - Bug Fixes & Stability",
    description:
      "Fixed critical audio synchronization issues, resolved memory leaks in the 3D scene renderer, and improved error handling across the application. Enhanced mobile device compatibility.",
  },
  {
    id: "v2.0.0",
    date: new Date("2024-10-20"),
    title: "Version 2.0.0 - Major Update",
    description:
      "Complete redesign of the user interface with new navigation system. Introduced real-time audio generation features, improved 3D city visualization, and added multiplayer support. Migrated to Next.js 16 with improved performance.",
  },
  {
    id: "v1.5.2",
    date: new Date("2024-09-10"),
    title: "Version 1.5.2 - Audio Enhancements",
    description:
      "Enhanced audio quality and added new sound effects library. Improved spatial audio positioning and added support for custom audio tracks. Fixed audio playback issues on Safari browsers.",
  },
  {
    id: "v1.4.0",
    date: new Date("2024-08-05"),
    title: "Version 1.4.0 - New Features",
    description:
      "Added quiz game functionality, improved user authentication system, and introduced profile management features. Enhanced the library page with better search and filtering capabilities.",
  },
  {
    id: "v1.0.0",
    date: new Date("2024-07-01"),
    title: "Version 1.3.0 - Initial Release",
    description:
      "First public release of Tokyo Sounds. Features include 3D city visualization, spatial audio system, basic navigation, and user authentication. Foundation for future enhancements.",
  },
];

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
