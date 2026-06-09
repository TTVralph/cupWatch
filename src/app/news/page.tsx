import { headers } from 'next/headers';
import { CupCard } from '@/components/Brand';
import { PageShell } from '@/components/PageShell';
import type { NewsArticle } from '@/types/cupwatch';

export const dynamic = 'force-dynamic';

type NewsApiResponse = {
  data: NewsArticle[];
  fallback?: boolean;
  message?: string;
};

export default async function NewsPage() {
  const { news, fallbackMessage, error } = await fetchNewsFromApi();

  return (
    <PageShell eyebrow="News" title="A cleaner matchday briefing" description="Short headline cards give you context quickly without autoplay videos or an endless feed.">
      {fallbackMessage ? <div className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100">{fallbackMessage}</div> : null}
      {error ? <div className="mb-4 rounded-2xl border border-red-300/30 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-100">{error}</div> : null}

      {news.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((item, index) => (
            <NewsCard key={item.id} article={item} delay={index * 0.05} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.06] px-4 py-8 text-center text-sm font-bold text-slate-300">
          No clean news cards are available right now. Check back shortly for refreshed World Cup headlines.
        </div>
      )}
    </PageShell>
  );
}

async function fetchNewsFromApi() {
  try {
    const response = await fetch(`${await getRequestOrigin()}/api/news`, {
      next: { revalidate: 60 * 15 },
    });

    if (!response.ok) {
      throw new Error(`News API request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as NewsApiResponse;
    return {
      news: payload.data,
      fallbackMessage: payload.fallback ? payload.message ?? 'Showing saved headlines while live news is unavailable.' : null,
      error: null,
    };
  } catch (error) {
    console.error('Unable to load news:', error);
    return {
      news: [],
      fallbackMessage: null,
      error: 'Unable to load news right now. Please refresh in a moment.',
    };
  }
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
    <CupCard delay={delay} hover className="h-full overflow-hidden">
      {article.image ? <img src={article.image} alt="" className="h-36 w-full object-cover opacity-90 sm:h-40" loading="lazy" /> : null}
      <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3 text-[0.7rem] font-black uppercase tracking-wide text-slate-300 sm:mb-4 sm:text-xs">
          <span>{article.source ?? 'CupWatch'}</span>
          {article.publishedAt ? <time dateTime={article.publishedAt}>{formatNewsDate(article.publishedAt)}</time> : null}
        </div>
        <h2 className="text-lg font-black leading-tight text-white sm:text-xl">{article.title}</h2>
        {article.description ? <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-200">{article.description}</p> : null}
      </div>
    </CupCard>
  );

  if (!article.url) return card;

  return (
    <a href={article.url} target="_blank" rel="noreferrer" className="block h-full rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-4 focus:ring-offset-slate-950">
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
