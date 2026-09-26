import { useMemo, useState } from "react";
import { Empty, Icon, PageHead, fa } from "../components/ui";
import type { Category } from "../data/quiz";
import { activeQuestions, allCategories, countByCategory } from "../lib/engine";
import type { Mode, Store } from "../lib/types";

export function CategoryGrid({ list, counts, onPick }: { list: Category[]; counts: Record<string, number>; onPick: (id: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((c, i) => (
        <button key={c.id} className="cat-card gm-pop" style={{ ["--cat-color" as string]: c.color, animationDelay: `${i * 40}ms` }} onClick={() => onPick(c.id)}>
          <div className="relative flex h-28 items-center justify-center overflow-hidden" style={{ background: `linear-gradient(140deg, ${c.color}30, #241b3000)` }}>
            {c.image ? (
              <img src={c.image} alt="" className="size-full object-cover" />
            ) : (
              <span className="grid size-14 place-items-center rounded-2xl border" style={{ borderColor: `${c.color}55`, background: `${c.color}1f`, color: c.color }}>
                <Icon name={c.icon} size={28} strokeWidth={1.6} />
              </span>
            )}
            <span className="absolute top-2.5 left-2.5 rounded-md bg-[#00000077] px-2 py-0.5 text-[9px] text-[var(--gold)]">{c.tag || "یاد بگیر"}</span>
          </div>
          <div className="p-4">
            <h3 className="text-[14px] font-bold">{c.name}</h3>
            <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--muted)]">{c.subtitle}</p>
            <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--muted)]">
              <span>{fa(counts[c.id] ?? 0)} سؤال</span>
              <Icon name="arrow" size={15} className="text-[var(--purple)]" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export function TopicsPage({ store, search, onSearch, onStart }: { store: Store; search: string; onSearch: (v: string) => void; onStart: (category: string, mode: Mode) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const counts = countByCategory(store);
  const cats = allCategories(store);
  const list = useMemo(() => cats.filter((c) => !search.trim() || c.name.includes(search.trim()) || c.subtitle.includes(search.trim())), [cats, search]);
  const cat = cats.find((c) => c.id === selected);

  if (cat) {
    const sample = activeQuestions(store).filter((q) => q.category === cat.id).slice(0, 5);
    return (
      <>
        <button className="btn ghost sm mb-4" onClick={() => setSelected(null)}><Icon name="chevron" size={15} /> همهٔ موضوع‌ها</button>
        <section className="gm-panel gm-motion overflow-hidden p-7" style={{ background: `radial-gradient(ellipse at 20% 0%, ${cat.color}22, #241b30 60%)` }}>
          {cat.image && <img src={cat.image} alt="" className="mb-4 h-40 w-full rounded-2xl object-cover" />}
          <span className="pill" style={{ background: `${cat.color}22`, color: cat.color }}>{fa(counts[cat.id] ?? 0)} سؤال آمادهٔ بازی</span>
          <h1 className="mt-3 text-2xl font-black">{cat.name}</h1>
          <p className="mt-1 text-xs text-[var(--muted)]">{cat.subtitle}</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button className="btn primary" onClick={() => onStart(cat.id, "computer")}><Icon name="bolt" size={16} /> رقابت با حریف</button>
            <button className="btn secondary" onClick={() => onStart(cat.id, "practice")}><Icon name="play" size={16} /> تمرین انفرادی</button>
          </div>
        </section>
        <h2 className="mt-7 mb-3 text-[15px] font-bold">نمونه سؤال‌های این موضوع</h2>
        <div className="grid gap-2">
          {sample.map((q) => (
            <details key={q.id} className="gm-panel px-4 py-3">
              <summary className="cursor-pointer text-[13px]">{q.title}</summary>
              <p className="mt-2 text-xs text-[var(--green)]">پاسخ درست: {q.options[q.correct]}</p>
            </details>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead title="دنیای موضوع‌ها" sub={`${fa(cats.length)} موضوع و ${fa(activeQuestions(store).length)} سؤال`} />
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#33283d] bg-[#231a2c] px-4 py-2.5">
        <Icon name="search" size={17} className="text-[#9f8db2]" />
        <input className="w-full border-0 bg-transparent text-[13px] outline-none" placeholder="جست‌وجوی موضوع" value={search} onChange={(e) => onSearch(e.target.value)} />
      </div>
      {list.length ? <CategoryGrid list={list} counts={counts} onPick={setSelected} /> : <Empty title="موضوعی پیدا نشد" body={`برای «${search}» نتیجه‌ای نبود.`} />}
    </>
  );
}
