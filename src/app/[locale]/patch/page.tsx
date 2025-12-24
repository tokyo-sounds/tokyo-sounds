import { use } from "react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import CommonPageContainer from "@/components/layout/CommonPageContainer";
import { Timeline } from "@/components/layout/timeline";
import { useTranslations } from "next-intl";
import SectionHeader from "@/components/layout/SectionHeader";
import { type TimelineItem } from "@/components/layout/timeline";

export default function PatchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations("PatchNotesPage");
  const patchNotes = t.raw("patchNotes") as TimelineItem[];
  return (
    <CommonPageContainer>
      <div className="w-full space-y-8">
        <SectionHeader
          pageTitle={t("pageTitle")}
          title={t("title")}
          description={t("description")}
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
