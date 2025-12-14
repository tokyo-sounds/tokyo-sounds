import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ArticleContainer from "@/components/layout/ArticleContainer";
import designConcept from "@/docs/about-design-concept.json";
import techStack from "@/docs/about-tech-stack.json";
import memberList from "@/docs/about-member-list.json";
const tabs = [
  {
    label: "デザイン",
    value: "design",
    articles: designConcept,
  },
  {
    label: "技術",
    value: "tech",
    articles: techStack,
  },
  {
    label: "メンバー",
    value: "member",
    articles: memberList,
  },
];

export default function AboutContainer() {
  return (
    <section className="w-full h-full flex flex-col items-center justify-center gap-8">
      <Tabs defaultValue="design" className="w-full h-full">
        {/* <AboutTabs /> */}
        <TabsList className="w-full h-12 self-center">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <ArticleContainer articles={tab.articles} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
