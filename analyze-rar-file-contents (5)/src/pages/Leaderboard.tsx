import { useMemo, useState } from "react";
import { Avatar, Icon, PageHead, fa } from "../components/ui";
import { allCategories, levelOf } from "../lib/engine";
import { canSee } from "../lib/store";
import type { AvatarRef, Store } from "../lib/types";

type Row = { id: string; name: string; avatar: AvatarRef; xp: number; weekXp: number; cups: number; rating: number; wins: number; played: number; me?: boolean; staff?: boolean; org: string; move: number };
type Metric = "xp" | "weekXp" | "cups" | "rating" | "winRate";

export function buildRows(store: Store): Row[] {
  const rows: Row[] = store.players
    .filter((p) => canSee(store, p))
    .map((p, i) => ({ id: p.id, name: p.name, avatar: p.avatar, xp: p.xp, weekXp: p.weekXp, cups: p.cups, rating: p.rating, wins: p.wins, played: p.played, staff: p.kind === "staff", org: p.org, move: ((i * 7) % 5) - 2 }));
  const me = store.profile;
  if (me) rows.push({ id: me.id, name: me.name, avatar: me.avatar, xp: me.xp, weekXp: me.xp, cups: me.cups, rating: me.rating, wins: me.wins, played: me.played, me: true, org: me.org, move: 1 });
  return rows;
}

const val = (r: Row, m: Metric) => (m === "winRate" ? (r.played ? Math.round((r.wins / r.played) * 100) : 0) : r[m]);
const LABEL: Record<Metric, string> = { xp: "تجربهٔ کل", weekXp: "تجربهٔ این هفته", cups: "جام", rating: "امتیاز رقابتی", winRate: "درصد برد" };

export function LeaderboardPage({ store, onInvite }: { store: Store; onInvite: (id: string) => void }) {
  const [metric, setMetric] = useState<Metric>("xp");
  const [scope, setScope] = useState<"all" | "org" | "friends">("all");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const rows = useMemo(() => {
    let r = buildRows(store);
    if (scope === "org") r = r.filter((x) => x.org && x.org === store.profile?.org);
    if (scope === "friends") r = r.filter((x) => x.me || store.profile?.friends.includes(x.id));
    return r.sort((a, b) => val(b, metric) - val(a, metric));
  }, [store, metric, scope]);
  const shown = rows.map((r, i) => ({ ...r, rank: i + 1 })).filter((r) => !q.trim() || r.name.includes(q.trim()));
  const me = rows.findIndex((r) => r.me);
  const top = rows.slice(0, 3);
  const catStat = cat !== "all" ? store.stats[cat] : null;
  const suffix = metric === "winRate" ? "٪" : "";

  return (
    <>
      <PageHead title="تالار قهرمانان" sub="رتبه‌بندی زنده · به‌روزرسانی با هر مسابقه" action={<span className="pill green"><span className="size-2 animate-pulse rounded-full bg-[var(--green)]" /> زنده</span>} />

      <div className="gm-panel mb-5 flex flex-wrap gap-2 p-3">
        {(Object.keys(LABEL) as Metric[]).map((m) => (
          <button key={m} className={`btn sm ${metric === m ? "primary" : "ghost"}`} onClick={() => setMetric(m)}>{LABEL[m]}</button>
        ))}
        <span className="mx-1 w-px bg-[var(--line)]" />
        {([["all", "همه"], ["friends", "دوستان"], ["org", "سازمان من"]] as const).map(([id, l]) => (
          <button key={id} className={`btn sm ${scope === id ? "secondary" : "ghost"}`} onClick={() => setScope(id)}>{l}</button>
        ))}
      </div>

      {/* سکوی قهرمانی */}
      <section className="gm-motion mb-6 grid grid-cols-3 items-end gap-3 rounded-[24px] border border-[#513662] px-4 pt-8 pb-0">
        {[1, 0, 2].map((idx) => {
          const r = top[idx];
          if (!r) return <div key={idx} />;
          const h = idx === 0 ? "h-36" : idx === 1 ? "h-24" : "h-16";
          const ring = idx === 0 ? "#f2ca7c" : idx === 1 ? "#d8dce6" : "#e0a06b";
          return (
            <div key={r.id} className="gm-pop text-center" style={{ animationDelay: `${idx * 120}ms` }}>
              {idx === 0 && <div className="mb-1 text-2xl">👑</div>}
              <Avatar a={r.avatar} size={idx === 0 ? 78 : 60} ring={ring} className={idx === 0 ? "gm-float" : ""} />
              <div className="mt-1.5 truncate px-1 text-[12px] font-bold">{r.name}</div>
              <div className="text-[12px] font-black" style={{ color: ring }}>{fa(val(r, metric))}{suffix}</div>
              <div className={`mt-2 ${h} rounded-t-2xl border border-b-0 pt-3 text-2xl font-black`} style={{ borderColor: `${ring}66`, background: `linear-gradient(180deg, ${ring}33, #241b3000)` }}>{fa(idx + 1)}</div>
            </div>
          );
        })}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="gm-panel overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[var(--line)] p-3">
            <Icon name="search" size={16} className="text-[var(--muted)]" />
            <input className="w-full bg-transparent text-[13px] outline-none" placeholder="جست‌وجوی بازیکن در جدول…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="hidden grid-cols-[48px_1fr_90px_80px_80px_110px] gap-2 border-b border-[var(--line)] px-4 py-2 text-[10px] text-[var(--muted)] sm:grid">
            <span>رتبه</span><span>بازیکن</span><span>سطح</span><span>برد</span><span>جام</span><span className="text-left">{LABEL[metric]}</span>
          </div>
          <div className="max-h-[620px] divide-y divide-[#2f2440] overflow-y-auto">
            {shown.map((r) => (
              <div key={r.id} className={`grid grid-cols-[40px_1fr_auto] items-center gap-2 px-4 py-2.5 sm:grid-cols-[48px_1fr_90px_80px_80px_110px] ${r.me ? "bg-[#2d2140]" : "hover:bg-[#261c31]"}`}>
                <span className={`text-center text-[13px] font-black ${r.rank <= 3 ? "text-[var(--gold)]" : "text-[var(--muted)]"}`}>
                  {fa(r.rank)}
                  <span className={`block text-[9px] ${r.move > 0 ? "text-[var(--green)]" : r.move < 0 ? "text-[var(--red)]" : "text-[var(--muted)]"}`}>{r.move > 0 ? `▲${fa(r.move)}` : r.move < 0 ? `▼${fa(-r.move)}` : "–"}</span>
                </span>
                <span className="flex min-w-0 items-center gap-2.5">
                  <Avatar a={r.avatar} size={36} />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px]">{r.name} {r.me && <span className="pill gold">تو</span>} {r.staff && <span className="pill">کادر</span>}</span>
                    <span className="block h-1 w-24 overflow-hidden rounded-full bg-[#2f2440]"><span className="block h-full bg-[var(--purple)]" style={{ width: `${r.played ? (r.wins / r.played) * 100 : 0}%` }} /></span>
                  </span>
                </span>
                <span className="hidden text-[12px] sm:block">سطح {fa(levelOf(r.xp))}</span>
                <span className="hidden text-[12px] sm:block">{fa(r.wins)}</span>
                <span className="hidden text-[12px] sm:block">{fa(r.cups)}</span>
                <span className="flex items-center justify-end gap-2 text-[13px] font-black text-[var(--gold)]">
                  {fa(val(r, metric))}{suffix}
                  {!r.me && <button className="grid size-7 place-items-center rounded-lg border border-[var(--line)] text-[var(--purple)] hover:bg-[#3a294b]" onClick={() => onInvite(r.id)} title="دعوت به مسابقه"><Icon name="bolt" size={13} /></button>}
                </span>
              </div>
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          {store.profile && (
            <div className="gm-panel gm-motion p-5 text-center">
              <Avatar a={store.profile.avatar} size={64} ring="#f2ca7c" />
              <div className="mt-2 text-sm font-bold">جایگاه تو</div>
              <div className="gm-reveal-text text-4xl font-black">{fa(me + 1)}</div>
              <div className="text-[11px] text-[var(--muted)]">از {fa(rows.length)} بازیکن · {LABEL[metric]}</div>
              {me > 0 && <div className="mt-2 text-[11px] text-[var(--gold)]">{fa(Math.max(0, val(rows[me - 1], metric) - val(rows[me], metric)))} تا رتبهٔ بالاتر</div>}
            </div>
          )}
          <div className="gm-panel p-5">
            <h3 className="mb-2 text-[13px] font-bold">آمار تو در موضوع</h3>
            <select className="field" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="all">یک موضوع انتخاب کن</option>
              {allCategories(store).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {catStat ? <p className="mt-3 text-xs leading-7">{fa(catStat.played)} بازی · {fa(catStat.wins)} برد · {fa(catStat.xp)} تجربه</p> : cat !== "all" && <p className="mt-3 text-xs text-[var(--muted)]">هنوز در این موضوع بازی نکرده‌ای.</p>}
          </div>
        </aside>
      </div>
    </>
  );
}
