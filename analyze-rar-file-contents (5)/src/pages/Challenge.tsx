import { useMemo, useState } from "react";
import { Avatar, Icon, PageHead, fa } from "../components/ui";
import { allCategories, countByCategory, levelOf } from "../lib/engine";
import { canSee } from "../lib/store";
import type { Mode, Player, Store } from "../lib/types";

type Props = { store: Store; onStart: (category: string, mode: Mode, rival?: Player | null) => void; onInvite: (p: Player, category: string) => void; onLogin: () => void };

const MODES: { id: Mode; icon: string; title: string; body: string }[] = [
  { id: "computer", icon: "bolt", title: "رقابت رتبه‌ای", body: "روی امتیاز رقابتی و جام اثر دارد." },
  { id: "friendly", icon: "users", title: "بازی دوستانه", body: "بدون تأثیر بر امتیاز رقابتی." },
  { id: "practice", icon: "target", title: "تمرین انفرادی", body: "بدون حریف، با کمک‌های بیشتر." },
];

export function ChallengePage({ store, onStart, onInvite, onLogin }: Props) {
  const counts = countByCategory(store);
  const cats = allCategories(store);
  const [mode, setMode] = useState<Mode>("computer");
  const [cat, setCat] = useState(store.profile?.interests[0] || "general");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"online" | "friends" | "all">("online");
  const [picked, setPicked] = useState<Player | null>(null);
  const friends = store.profile?.friends || [];

  const players = useMemo(
    () =>
      store.players
        .filter((p) => p.kind !== "bot" && canSee(store, p))
        .filter((p) => (filter === "friends" ? friends.includes(p.id) : filter === "online" ? Date.now() - p.lastSeen < 30 * 60000 : true))
        .filter((p) => !q.trim() || p.name.includes(q.trim()))
        .sort((a, b) => b.lastSeen - a.lastSeen),
    [store, q, filter, friends]
  );

  const go = () => {
    if (!store.profile) return onLogin();
    if (mode !== "practice" && picked) onInvite(picked, cat);
    else onStart(cat, mode, null);
  };

  return (
    <>
      <PageHead title="میدان رقابت" sub="موضوع و حالت را انتخاب کن؛ حریف دلخواهت را پیدا و دعوت کن." />

      <h2 className="mb-3 text-[15px] font-bold">۱. حالت بازی</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} className={`rounded-2xl border p-4 text-right transition ${mode === m.id ? "border-[var(--purple2)] bg-[#31244180]" : "border-[var(--line)] bg-[#241b30] hover:border-[#6b4f8d]"}`}>
            <span className="mb-2 grid size-10 place-items-center rounded-xl bg-[#3e2b54] text-[var(--purple)]"><Icon name={m.icon} size={19} /></span>
            <span className="block text-[13px] font-bold">{m.title}</span>
            <span className="mt-1 block text-[10px] text-[var(--muted)]">{m.body}</span>
          </button>
        ))}
      </div>

      <h2 className="mt-7 mb-3 text-[15px] font-bold">۲. موضوع</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {cats.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-right transition ${cat === c.id ? "border-[var(--gold)] bg-[#302535]" : "border-[var(--line)] bg-[#241b30] hover:border-[#6b4f8d]"}`}>
            {c.image ? <img src={c.image} alt="" className="size-9 rounded-lg object-cover" /> : <span className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ background: `${c.color}22`, color: c.color }}><Icon name={c.icon} size={17} /></span>}
            <span className="min-w-0"><span className="block truncate text-[12px] font-bold">{c.name}</span><span className="block text-[9px] text-[var(--muted)]">{fa(counts[c.id] ?? 0)} سؤال</span></span>
          </button>
        ))}
      </div>

      {mode !== "practice" && (
        <>
          <h2 className="mt-7 mb-3 text-[15px] font-bold">۳. حریف (اختیاری — خالی بگذاری، حریف تصادفی پیدا می‌شود)</h2>
          <div className="gm-panel p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#33283d] bg-[#1f1729] px-3">
                <Icon name="search" size={16} className="text-[var(--muted)]" />
                <input className="w-full bg-transparent py-2.5 text-[13px] outline-none" placeholder="نام بازیکن را جست‌وجو کن…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              {(["online", "friends", "all"] as const).map((f) => (
                <button key={f} className={`btn sm ${filter === f ? "primary" : "ghost"}`} onClick={() => setFilter(f)}>{f === "online" ? "آنلاین" : f === "friends" ? "دوستان" : "همه"}</button>
              ))}
            </div>
            <div className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {players.map((p) => (
                <button key={p.id} onClick={() => setPicked(picked?.id === p.id ? null : p)} className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-right ${picked?.id === p.id ? "border-[var(--gold)] bg-[#302535]" : "border-[var(--line)] bg-[#221a2d] hover:border-[#6b4f8d]"}`}>
                  <Avatar a={p.avatar} size={40} online={Date.now() - p.lastSeen < 600000} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-bold">{p.name}</span><span className="text-[10px] text-[var(--muted)]">سطح {fa(levelOf(p.xp))} · {fa(p.rating)}</span></span>
                  {picked?.id === p.id && <Icon name="check" size={16} className="text-[var(--gold)]" />}
                </button>
              ))}
              {!players.length && <p className="col-span-full py-6 text-center text-xs text-[var(--muted)]">بازیکنی با این شرایط پیدا نشد.</p>}
            </div>
          </div>
        </>
      )}

      <div className="gm-panel sticky bottom-3 z-20 mt-7 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2 text-xs">
          {picked && <Avatar a={picked.avatar} size={30} />}
          <span className="text-[var(--muted)]">{cats.find((c) => c.id === cat)?.name} · {MODES.find((m) => m.id === mode)?.title}{picked && mode !== "practice" ? ` · مقابل ${picked.name}` : ""}</span>
        </div>
        <button className="btn gm-glow" onClick={go}><Icon name={picked ? "send" : "play"} size={17} /> {picked && mode !== "practice" ? "ارسال دعوت به مسابقه" : "شروع مسابقه"}</button>
      </div>
    </>
  );
}
