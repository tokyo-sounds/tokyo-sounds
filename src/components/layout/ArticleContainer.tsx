interface articleProps {
  title: string;
  subtitle?: string;
  content: string;
}

export default function ArticleContainer({
  children,
  articles,
}: {
  children?: React.ReactNode;
  articles: articleProps[];
}) {
  return (
    <section className="w-full h-full flex flex-col gap-8 py-4 font-noto text-primary-foreground">
      {children}
      {articles.map((article) => (
        <div key={article.title}>
          <h3 className="text-xl mb-4">{article.title}</h3>
          <p className="text-sm font-light tracking-wide text-justify leading-relaxed">{article.content}</p>
        </div>
      ))}
    </section>
  );
}
