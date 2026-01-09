import { use } from "react";
import { setRequestLocale } from "next-intl/server";
import PatchContainer from "./components/PatchContainer";

export default function PatchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return <PatchContainer />;
}
