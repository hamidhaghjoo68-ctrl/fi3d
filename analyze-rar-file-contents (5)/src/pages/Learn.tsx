import { Icon, fa, relTime, Empty, PageHead } from "../components/ui";
import { categories as baseCats } from "../data/quiz";
import type { Store } from "../lib/types";

type Props = { store: Store; update: (fn: (s: Store) => Store) => void; onStart: (c: string) => void };

export function LearnPage({ store, update, onStart }: Props) {
  if (!store.reviews.length)
    return (
      <>
        <PageHead title="مرور و یادگیری" sub="اشتباه امروز، دانستهٔ فرداست." />
        <Empty
          title="هنوز موردی برای مرور نیست"
          body="بعد از هر مسابقه، سؤال‌هایی که اشتباه پاسخ داده‌ای اینجا جمع می‌شوند تا دوباره مرورشان کنی."
          action={
            <button className="btn primary" onClick={() => onStart("general")}>
              <Icon name="play" size={15} /> یک مسابقه شروع کن
            </button>
          }
        />
      </>
    );

  const byCat = store.reviews.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHead
        title="مرور و یادگیری"
        sub={`${fa(store.reviews.length)} سؤال برای مرور`}
        action={
          <button className="btn ghost sm" onClick={() => update((s) => ({ ...s, reviews: [] }))}>
            <Icon name="check" size={14} /> همه را مرور کردم
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {Object.entries(byCat).map(([id, n]) => {
          const c = baseCats.find((x) => x.id === id);
          return (
            <button key={id} className="pill" style={{ background: `${c?.color}1f`, color: c?.color }} onClick={() => onStart(id)}>
              <Icon name={c?.icon || "book"} size={12} /> {c?.name} · {fa(n)}
            </button>
          );
        })}
      </div>

      <div className="grid gap-2.5">
        {store.reviews.map((r) => {
          const c = baseCats.find((x) => x.id === r.category);
          return (
            <details key={r.questionId} className="gm-panel px-5 py-4">
              <summary className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                <span style={{ color: c?.color }}>
                  <Icon name={c?.icon || "book"} size={16} />
                </span>
                <span className="flex-1">{r.title}</span>
                <span className="text-[10px] text-[var(--muted)]">{relTime(r.at)}</span>
              </summary>
              <div className="mt-3 grid gap-1.5">
                {r.options.map((o, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border px-3 py-2 text-xs ${
                      i === r.correct ? "border-[#47936f] bg-[#1f3b31] text-[#c8f2dd]" : "border-[var(--line)] bg-[#221a2d] text-[var(--muted)]"
                    }`}
                  >
                    {o}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-7 text-[var(--muted)]">
                <Icon name="info" size={13} className="ml-1 inline text-[var(--gold)]" />
                {r.explanation}
              </p>
              <button
                className="btn ghost sm mt-3"
                onClick={() => update((s) => ({ ...s, reviews: s.reviews.filter((x) => x.questionId !== r.questionId) }))}
              >
                <Icon name="check" size={13} /> یاد گرفتم
              </button>
            </details>
          );
        })}
      </div>
    </>
  );
}
