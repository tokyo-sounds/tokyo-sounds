import AboutContainer from "./components/AboutContainer";
import CommonPageContainer from "@/components/layout/CommonPageContainer";
import SectionHeader from "@/components/layout/SectionHeader";
import { useTranslations } from "next-intl";

export default function AboutPage() {
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
