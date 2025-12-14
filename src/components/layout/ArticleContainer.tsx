interface articleProps {
  title: string;
  subtitle: string;
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
          <h3 className="text-xl mb-1">{article.title}</h3>
          <h4 className="text-md text-accent mb-4">{article.subtitle}</h4>
          <p className="text-sm font-light">{article.content}</p>
        </div>
      ))}
    </section>
  );
}
