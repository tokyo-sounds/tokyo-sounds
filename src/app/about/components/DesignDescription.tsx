import { designConcepts } from "@/lib/constraint";

export default function DesignDescription() {
  return (
    <section className="w-full h-full flex flex-col gap-8 py-4 font-noto">
      {designConcepts.map((concept) => (
        <div key={concept.title}>
          <h3 className="text-3xl font-semibold mb-2">
            {concept.title}
          </h3>
          <h4 className="text-lg text-primary mb-4">{concept.subtitle}</h4>
          <p className="text-md font-light">{concept.content}</p>
        </div>
      ))}
    </section>
  );
}
