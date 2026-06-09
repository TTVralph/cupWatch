import { MotionCard } from '@/components/MotionCard';
import { PageShell } from '@/components/PageShell';
import { getCupWatchDataService } from '@/services/data-service';

export default async function NewsPage() {
  const news = await getCupWatchDataService().getNews();

  return (
    <PageShell eyebrow="News" title="A cleaner matchday briefing" description="Short headline cards give you context quickly without autoplay videos or an endless feed.">
      <div className="grid gap-4 md:grid-cols-3">
        {news.map((item, index) => (
          <MotionCard key={item.id} delay={index * 0.05} className="rounded-[1.5rem] border border-white/80 bg-white p-5 shadow-sm shadow-slate-200/80">
            <div className="mb-4 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wide text-slate-400">
              <span>{item.source}</span>
              <span>{item.time}</span>
            </div>
            <h2 className="text-xl font-black leading-tight text-slate-950">{item.headline}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
          </MotionCard>
        ))}
      </div>
    </PageShell>
  );
}
