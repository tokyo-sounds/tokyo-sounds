import HomeHero from "@/components/layout/HomeHero";
import Nav from "@/components/layout/nav";

export default function Home() {
  return (
    <main className="w-full h-full">
      <Nav />
      <HomeHero />
    </main>
  );
}
