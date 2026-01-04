"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ArticleContainer from "@/components/layout/ArticleContainer";
import { useTranslations } from "next-intl";

export default function AboutContainer() {
  const t = useTranslations("AboutPage");

  const tabs = [
    {
      label: t("tabs.design"),
      value: "design",
      articles: t.raw("designConcept") as Array<{
        title: string;
        subtitle: string;
        content: string;
      }>,
    },
    {
      label: t("tabs.tech"),
      value: "tech",
      articles: t.raw("techStack") as Array<{
        title: string;
        content: string;
      }>,
    },
    {
      label: t("tabs.member"),
      value: "member",
      articles: (t.raw("memberList") as Array<{
        name: string;
        role: string;
        description: string;
        profileImage: string;
        socials: {
          github?: string;
          linkedin?: string;
          website?: string;
        };
      }>).map(member => ({
        title: member.name,
        content: member.description,
      })),
    },
  ];

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
