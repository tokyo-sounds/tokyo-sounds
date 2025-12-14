import AboutContainer from "./components/AboutContainer";
import CommonPageContainer from "@/components/layout/CommonPageContainer";
import SectionHeader from "@/components/layout/SectionHeader";
import aboutSectionHeader from "../../../docs/about-section-header.json";

export default function AboutPage() {
  return (
    <CommonPageContainer>
      <SectionHeader
        pageTitle={aboutSectionHeader.pageTitle}
        title={aboutSectionHeader.title}
        description={aboutSectionHeader.description}
      />
      <AboutContainer />
    </CommonPageContainer>
  );
}
