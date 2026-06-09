import { headers } from 'next/headers';
import { MotionCard } from '@/components/MotionCard';
import { PageShell } from '@/components/PageShell';
import type { NewsArticle } from '@/types/cupwatch';

export const dynamic = 'force-dynamic';

type NewsApiResponse = {
  data: NewsArticle[];
};

export default async function NewsPage() {
  const news = await fetchNewsFromApi();

  return (
    <PageShell eyebrow="News" title="A cleaner matchday briefing" description="Short headline cards give you context quickly without autoplay videos or an endless feed.">
      <div className="grid gap-4 md:grid-cols-3">
        {news.map((item, index) => (
          <NewsCard key={item.id} article={item} delay={index * 0.05} />
        ))}
      </div>
    </PageShell>
  );
}

async function fetchNewsFromApi() {
  const response = await fetch(`${await getRequestOrigin()}/api/news`, {
    next: { revalidate: 60 * 15 },
  });

  if (!response.ok) {
    throw new Error(`News API request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as NewsApiResponse;
  return payload.data;
}

async function getRequestOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https');

  if (host) return `${protocol}://${host}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return 'http://localhost:3000';
}

function NewsCard({ article, delay }: { article: NewsArticle; delay: number }) {
  const card = (
    <MotionCard delay={delay} className="h-full overflow-hidden rounded-[1.5rem] border border-white/80 bg-white shadow-sm shadow-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-md">
      {article.image ? <img src={article.image} alt="" className="h-40 w-full object-cover" loading="lazy" /> : null}
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wide text-slate-400">
          <span>{article.source ?? 'ESPN'}</span>
          {article.publishedAt ? <time dateTime={article.publishedAt}>{formatNewsDate(article.publishedAt)}</time> : null}
        </div>
        <h2 className="text-xl font-black leading-tight text-slate-950">{article.title}</h2>
        {article.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{article.description}</p> : null}
      </div>
    </MotionCard>
  );

  if (!article.url) return card;

  return (
    <a href={article.url} target="_blank" rel="noreferrer" className="block h-full focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-4 focus:ring-offset-slate-50">
      {card}
    </a>
  );
}

function formatNewsDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}
