export default function SectionHeader({
  pageTitle,
  title,
  description,
}: {
  pageTitle: string;
  title: string;
  description: string;
}) {
  return (
    <section className="w-full h-full space-y-2 mb-6">
      <h1 className="text-5xl md:text-[72px] font-black font-sans uppercase text-white text-shadow-lg">{pageTitle}</h1>
      <h2 className="text-xl md:text-3xl font-semibold text-yellow-300">{title}</h2>
      <p className="text-sm md:text-base text-justify text-primary-foreground leading-relaxed">{description}</p>
    </section>
  );
}
