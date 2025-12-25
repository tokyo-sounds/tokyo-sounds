import { use } from "react";
import { setRequestLocale } from "next-intl/server";
import TokyoPage from "@/app/(index)/page";

export default function IndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale);

  // TokyoPage is a client component, so we can import it directly
  return <TokyoPage />;
}
