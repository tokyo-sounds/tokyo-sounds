import AboutTabs from "./AboutTabs";
import ConceptDescription from "./ConceptDescription";
import MemberInro from "./MemberInro";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ArticleContainer from "@/components/layout/ArticleContainer";
import { designConcepts, techConcepts, memberInro } from "@/lib/constraint";

const tabs = [
  {
    label: "Tech",
    value: "tech",
    articles: techConcepts,
  },
  {
    label: "Design",
    value: "design",
    articles: designConcepts,
  },
  {
    label: "Member",
    value: "member",
    articles: memberInro,
  },
];

export default function AboutContainer() {
  return (
    <section className="w-full h-full flex flex-col items-center justify-center gap-8">
      <h1 className="text-5xl font-black font-sans uppercase">About</h1>
      <ConceptDescription />
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
