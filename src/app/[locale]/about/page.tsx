import { use } from "react";
import { setRequestLocale } from "next-intl/server";
import AboutContainer from "./components/AboutContainer";
import CommonPageContainer from "@/components/layout/CommonPageContainer";
import SectionHeader from "@/components/layout/SectionHeader";
import { useTranslations } from "next-intl";

export default function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations("AboutPage");
  return (
    <CommonPageContainer>
      <SectionHeader
        pageTitle={t("pageTitle")}
        title={t("title")}
        description={t("description")}
      />
      <AboutContainer />
    </CommonPageContainer>
  );
}
