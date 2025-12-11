"use client";

import { useState } from "react";
import ChipTab from "@/components/common/ChipTab";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = ["Tech", "Changelog", "Member"];

export default function AboutTabs() {
  const [selected, setSelected] = useState(tabs[0]);
  return (
    <TabsList className="w-full h-12 self-center">
      {tabs.map((tab) => (
        <TabsTrigger
          key={tab}
          value={tab}
          className="data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent"
        >
          <ChipTab
            text={tab}
            selected={selected === tab}
            setSelected={setSelected}
          />
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
