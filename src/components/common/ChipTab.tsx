import { motion } from "motion/react";
import { Dispatch, SetStateAction, useState } from "react";

const tabs = ["Home", "Search", "About", "FAQ"];

const ExampleChipTabs = () => {
  const [selected, setSelected] = useState(tabs[0]);

  return (
    <div className="px-4 py-14 bg-slate-900 flex items-center flex-wrap gap-2">
      {tabs.map((tab) => (
        <ChipTab
          text={tab}
          selected={selected === tab}
          setSelected={setSelected}
          key={tab}
        />
      ))}
    </div>
  );
};

export default function ChipTab({
  text,
  selected,
  setSelected,
}: {
  text: string;
  selected: boolean;
  setSelected: Dispatch<SetStateAction<string>>;
}) {
  return (
    <div
      onClick={() => setSelected(text)}
      className={`${
        selected
          ? "text-background"
          : "text-muted-foreground hover:text-secondary-foreground hover:bg-secondary"
      } w-full h-full flex items-center justify-center relative rounded-md text-lg transition-colors`}
    >
      <span className="relative z-10">{text}</span>
      {selected && (
        <motion.span
          layoutId="pill-tab"
          transition={{ type: "spring", duration: 0.5 }}
          className="absolute inset-0 z-0 primary-gradient rounded-md"
        ></motion.span>
      )}
    </div>
  );
}
