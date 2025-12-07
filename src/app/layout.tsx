import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import { Analytics } from "@vercel/analytics/next";
import { Roboto, Roboto_Mono, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const robotoSans = Roboto({
  variable: "--font-roboto-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "東京の音 | 東京の日常音を集めたASMRサイト",
  description:
    "東京の雰囲気・電車・商店街・寺社・カフェなどの生活音をASMR化。東京を歩いている体験ができるWEBサイト。 ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${robotoSans.variable} ${robotoMono.variable} ${notoSansJp.variable} antialiased`}
      >
        <StackProvider app={stackClientApp}>
          <StackTheme>{children}</StackTheme>
        </StackProvider>
        <Analytics />
      </body>
    </html>
  );
}
