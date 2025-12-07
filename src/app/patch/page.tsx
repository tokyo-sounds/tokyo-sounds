import Link from "next/link";
import { Button } from "@/components/ui/button";
import CommonPageContainer from "@/components/layout/CommonPageContainer";

export default function PatchPage() {
  return (
    <CommonPageContainer>
      <h1>Patch Page</h1>
      <div className="flex items-center justify-between gap-2">
        <Link href="/patch/v1">
          <Button>V1</Button>
        </Link>
        <Link href="/patch/v2">
          <Button>V2</Button>
        </Link>
      </div>
    </CommonPageContainer>
  );
}
