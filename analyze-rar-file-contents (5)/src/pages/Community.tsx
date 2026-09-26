import { useState } from "react";
import { Avatar, Empty, Icon, PageHead, fa, faDate, relTime } from "../components/ui";
import { allCategories, eventLive, findCategory } from "../lib/engine";
import { canSee, notify, today, uid } from "../lib/store";
import { sfx } from "../lib/sound";
import type { GameEvent, Store } from "../lib/types";

type Up = (fn: (s: Store) => Store) => void;
const KIND: Record<GameEvent["kind"], string> = { event: "رویداد", challenge: "چالش باز", tournament: "تورنومنت", league: "مرحلهٔ لیگ" };
const TIER = { gold: "طلا", silver: "نقره", bronze: "برنز", cup: "کاپ" } as const;

function canJoin(store: Store, e: GameEvent) {
  if (!e.org) return true;
  return store.profile?.org === e.org;
}

/* =================== رویدادها =================== */
export function EventsPage({ store, id, go, onPlay, onLogin }: { store: Store; id: string; go: (r: string) => void; onPlay: (e: GameEvent) => void; onLogin: () => void }) {
  const [tab, setTab] = useState<"live" | "all">("live");
  const ev = store.events.find((e) => e.id === id);
  const medals = store.settings.defaultMedals;

  if (ev) {
    const cat = findCategory(store, ev.category);
    const board = [...ev.results].sort((a, b) => b.score - a.score);
    const mine = board.findIndex((r) => r.playerId === store.profile?.id);
    const played = mine >= 0;
    return (
      <>
        <button className="btn ghost sm mb-4" onClick={() => go("events")}><Icon name="chevron" size={15} /> همهٔ رویدادها</button>
        <section className="gm-motion gm-panel overflow-hidden p-6">
          <div className="flex flex-wrap items-center gap-5">
            <img src={ev.logo} alt="" className="gm-float size-24" />
            <div className="min-w-0 flex-1">
              <span className="pill gold">{KIND[ev.kind]}</span>
              <h1 className="mt-2 text-2xl font-black">{ev.title}</h1>
              <p className="mt-1 text-xs leading-6 text-[var(--muted)]">{ev.description}</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">{cat.name} · تا {faDate(ev.endsAt)} · {fa(board.length)} شرکت‌کننده</p>
            </div>
            {!canJoin(store, ev) ? <span className="pill red"><Icon name="lock" size={12} /> فقط اعضای سازمان</span>
              : played ? <span className="pill green !text-[12px]">رتبهٔ تو: {fa(mine + 1)}</span>
              : eventLive(ev) ? <button className="btn gm-glow" onClick={() => (store.profile ? onPlay(ev) : onLogin())}><Icon name="play" size={16} /> شرکت در {KIND[ev.kind]}</button>
              : <span className="pill">پایان‌یافته / آغازنشده</span>}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["gold", "silver", "bronze", ...(ev.hasCup ? ["cup"] : [])] as const).map((t) => (
              <div key={t} className="rounded-2xl border border-[var(--line)] bg-[#221a2d] p-3 text-center">
                <img src={ev.medals[t as keyof typeof TIER] || medals[t as keyof typeof TIER]} alt="" className="mx-auto h-16" />
                <div className="mt-1 text-[11px] font-bold">{t === "cup" ? "کاپ قهرمانی" : `مدال ${TIER[t as keyof typeof TIER]}`}</div>
                <div className="text-[9px] text-[var(--muted)]">{t === "gold" || t === "cup" ? "رتبهٔ اول" : t === "silver" ? "رتبهٔ دوم" : "رتبهٔ سوم / ۷۰۰+ امتیاز"}</div>
              </div>
            ))}
          </div>
        </section>
        <h2 className="mt-6 mb-3 text-[15px] font-bold">جدول رویداد</h2>
        <div className="gm-panel divide-y divide-[#2f2440]">
          {board.map((r, i) => (
            <div key={r.playerId} className={`flex items-center gap-3 px-4 py-2.5 ${r.playerId === store.profile?.id ? "bg-[#2d2140]" : ""}`}>
              <span className={`w-6 text-center font-black ${i < 3 ? "text-[var(--gold)]" : "text-[var(--muted)]"}`}>{fa(i + 1)}</span>
              {i < 3 && <img src={ev.medals[(["gold", "silver", "bronze"] as const)[i]] || medals[(["gold", "silver", "bronze"] as const)[i]]} alt="" className="h-7" />}
              <span className="flex-1 text-[13px]">{r.name}</span>
              <span className="text-[10px] text-[var(--muted)]">{relTime(r.at)}</span>
              <span className="font-black text-[var(--gold)]">{fa(r.score)}</span>
            </div>
          ))}
          {!board.length && <p className="p-6 text-center text-xs text-[var(--muted)]">هنوز کسی شرکت نکرده. اولین نفر باش!</p>}
        </div>
      </>
    );
  }

  const list = store.events.filter((e) => e.kind !== "league" && (tab === "all" || eventLive(e)));
  return (
    <>
      <PageHead title="رویداد و چالش باز" sub="در هر رویداد یک بار شرکت کن؛ مدال طلا، نقره، برنز و کاپ بگیر." action={<div className="flex gap-2"><button className={`btn sm ${tab === "live" ? "primary" : "ghost"}`} onClick={() => setTab("live")}>در حال برگزاری</button><button className={`btn sm ${tab === "all" ? "primary" : "ghost"}`} onClick={() => setTab("all")}>همه</button></div>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((e) => (
          <button key={e.id} className="gm-panel gm-pop overflow-hidden text-right transition hover:-translate-y-1" onClick={() => go(`events/${e.id}`)}>
            <div className="gm-motion flex items-center gap-4 p-5">
              <img src={e.logo} alt="" className="size-16" />
              <div className="min-w-0 flex-1"><span className="pill gold">{KIND[e.kind]}</span><div className="mt-1.5 truncate text-[15px] font-bold">{e.title}</div><div className="text-[11px] text-[var(--muted)]">{findCategory(store, e.category).name}</div></div>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--line)] px-5 py-3 text-[11px] text-[var(--muted)]">
              <span>{fa(e.results.length)} شرکت‌کننده</span>
              <span className="flex gap-1">{(["gold", "silver", "bronze"] as const).map((t) => <img key={t} src={e.medals[t] || medals[t]} alt="" className="h-6" />)}{e.hasCup && <img src={e.medals.cup || medals.cup} alt="" className="h-6" />}</span>
            </div>
          </button>
        ))}
      </div>
      {!list.length && <Empty title="رویداد فعالی نیست" body="مدیر به‌زودی رویداد تازه می‌سازد." />}
    </>
  );
}

/* =================== هدیه‌ها =================== */
export function RewardsPage({ store, update }: { store: Store; update: Up }) {
  const d = today();
  const claimed = store.rewardDays.includes(d);
  const streak = store.rewardDays.length;
  const claim = () => {
    if (!store.profile || claimed) return;
    const amount = 20 + Math.min(6, streak % 7) * 10;
    update((s) => ({ ...s, rewardDays: [...s.rewardDays, d], profile: s.profile ? { ...s.profile, coins: s.profile.coins + amount } : s.profile }));
    sfx("coin");
    notify({ title: "هدیهٔ روزانه", body: `${fa(amount)} سکه دریافت کردی!`, link: "rewards", kind: "reward" });
  };
  return (
    <>
      <PageHead title="هدیه‌ها" sub="هر روز سر بزن؛ هدیهٔ روز هفتم بزرگ‌تر است." />
      <div className="gm-panel gm-motion p-6">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => {
            const done = i < streak % 7 || (claimed && i === (streak - 1) % 7);
            return <div key={i} className={`rounded-2xl border p-3 text-center ${done ? "border-[#75613e] bg-[#302535]" : "border-[var(--line)] bg-[#221a2d]"}`}><div className="text-2xl">{i === 6 ? "🎁" : "🪙"}</div><div className="text-[11px] font-bold">روز {fa(i + 1)}</div><div className="text-[10px] text-[var(--gold)]">{fa(20 + i * 10)}</div></div>;
          })}
        </div>
        <button className="btn gm-glow mt-5" onClick={claim} disabled={claimed || !store.profile}><Icon name="gift" size={16} /> {claimed ? "هدیهٔ امروز دریافت شد" : "دریافت هدیهٔ امروز"}</button>
      </div>
      <h2 className="mt-7 mb-3 text-[15px] font-bold">مدال‌ها و کاپ‌های من</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {store.medals.map((m) => <div key={m.id} className="gm-panel p-3 text-center"><img src={m.image} alt="" className="mx-auto h-16" /><div className="mt-1 text-[11px] font-bold">{TIER[m.tier]}</div><div className="truncate text-[9px] text-[var(--muted)]">{m.eventTitle}</div></div>)}
      </div>
      {!store.medals.length && <Empty title="هنوز مدالی نداری" body="در رویدادها و تورنومنت‌ها شرکت کن تا مدال بگیری." />}
    </>
  );
}

/* =================== فروشگاه =================== */
const ITEMS = [
  { id: "title-mentor", name: "عنوان «استاد تجربه»", price: 300, icon: "crown" },
  { id: "title-safety", name: "عنوان «قهرمان ایمنی»", price: 250, icon: "shield" },
  { id: "extra-life", name: "بستهٔ ۳ راهنمای اضافه", price: 120, icon: "info" },
  { id: "frame-gold", name: "قاب طلایی آواتار", price: 400, icon: "medal" },
  { id: "theme-night", name: "پس‌زمینهٔ کهکشانی پروفایل", price: 200, icon: "spark" },
  { id: "badge-fire", name: "نشان آتشین", price: 150, icon: "fire" },
];
export function ShopPage({ store, update }: { store: Store; update: Up }) {
  if (!store.settings.shopEnabled) return <Empty title="فروشگاه بسته است" body="مدیر فروشگاه را موقتاً غیرفعال کرده است." />;
  const inv = store.profile?.inventory || [];
  const buy = (id: string, price: number) => {
    if (!store.profile || store.profile.coins < price || inv.includes(id)) return;
    update((s) => (s.profile ? { ...s, profile: { ...s.profile, coins: s.profile.coins - price, inventory: [...s.profile.inventory, id], title: id.startsWith("title") ? ITEMS.find((i) => i.id === id)!.name.replace("عنوان ", "") : s.profile.title } } : s));
    sfx("coin");
  };
  return (
    <>
      <PageHead title="فروشگاه" sub={`موجودی: ${fa(store.profile?.coins ?? 0)} سکه · سکه‌ها ارزش پولی ندارند.`} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((i) => (
          <div key={i.id} className="gm-panel p-5">
            <Icon name={i.icon} size={30} className="text-[var(--gold)]" />
            <div className="mt-2 text-[14px] font-bold">{i.name}</div>
            <button className="btn sm mt-3" onClick={() => buy(i.id, i.price)} disabled={inv.includes(i.id) || (store.profile?.coins ?? 0) < i.price}><Icon name="coin" size={13} /> {inv.includes(i.id) ? "خریداری شد" : `${fa(i.price)} سکه`}</button>
          </div>
        ))}
      </div>
    </>
  );
}

/* =================== کارخانهٔ سؤال =================== */
export function SuggestPage({ store, update, onLogin }: { store: Store; update: Up; onLogin: () => void }) {
  const [title, setTitle] = useState("");
  const [opts, setOpts] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [exp, setExp] = useState("");
  const [cat, setCat] = useState("general");
  const mine = store.suggestions;
  const submit = () => {
    if (!store.profile) return onLogin();
    if (title.trim().length < 6 || opts.some((o) => !o.trim())) return alert("متن سؤال و هر چهار گزینه لازم است.");
    update((s) => ({ ...s, suggestions: [{ id: uid("sug"), category: cat, title: title.trim(), options: opts.map((o) => o.trim()), correct, explanation: exp.trim(), seconds: 25, status: "pending", at: Date.now() }, ...s.suggestions] }));
    setTitle(""); setOpts(["", "", "", ""]); setExp("");
    notify({ title: "سؤال تو ثبت شد", body: "پس از تأیید مدیر، ۳۰ سکه می‌گیری.", link: "suggest", kind: "system" });
  };
  return (
    <>
      <PageHead title="کارخانهٔ سؤال" sub="سؤال پیشنهاد بده؛ اگر تأیید شد به بانک اضافه می‌شود و ۳۰ سکه می‌گیری." />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="gm-panel grid gap-3 p-5">
          <textarea className="field min-h-20" placeholder="متن سؤال" value={title} onChange={(e) => setTitle(e.target.value)} />
          {opts.map((o, i) => (
            <div key={i} className="flex gap-2"><button className={`grid size-10 shrink-0 place-items-center rounded-lg border ${correct === i ? "border-[#47936f] bg-[#1f3b31] text-[var(--green)]" : "border-[var(--line)]"}`} onClick={() => setCorrect(i)}><Icon name="check" size={15} /></button><input className="field" placeholder={`گزینهٔ ${fa(i + 1)}`} value={o} onChange={(e) => setOpts(opts.map((x, j) => (j === i ? e.target.value : x)))} /></div>
          ))}
          <textarea className="field" placeholder="توضیح پاسخ درست (اختیاری)" value={exp} onChange={(e) => setExp(e.target.value)} />
          <div className="flex gap-2"><select className="field" value={cat} onChange={(e) => setCat(e.target.value)}>{allCategories(store).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><button className="btn" onClick={submit}><Icon name="send" size={14} /> ارسال</button></div>
        </div>
        <div className="grid content-start gap-2">
          {mine.map((s) => <div key={s.id} className="gm-panel flex items-center gap-2 px-4 py-3 text-[12px]"><span className="flex-1">{s.title}</span><span className={`pill ${s.status === "approved" ? "green" : s.status === "rejected" ? "red" : "gold"}`}>{s.status === "approved" ? "تأیید شد" : s.status === "rejected" ? "رد شد" : "در انتظار"}</span></div>)}
          {!mine.length && <Empty title="هنوز سؤالی نفرستاده‌ای" body="اولین سؤالت را بساز!" />}
        </div>
      </div>
    </>
  );
}

/* =================== صفحه‌های سازمانی =================== */
export function OrgsPage({ store }: { store: Store }) {
  const [sel, setSel] = useState<string | null>(null);
  const org = store.orgs.find((o) => o.id === sel);
  const member = (id: string) => store.profile?.org === id;
  if (org) {
    const locked = org.private && !member(org.id);
    const people = store.players.filter((p) => p.org === org.id && canSee(store, p));
    return (
      <>
        <button className="btn ghost sm mb-4" onClick={() => setSel(null)}><Icon name="chevron" size={15} /> همهٔ صفحه‌ها</button>
        <section className="gm-panel gm-motion flex flex-wrap items-center gap-5 p-6"><img src={org.logo} alt="" className="size-20" /><div className="flex-1"><h1 className="text-xl font-black">{org.name}</h1><p className="text-xs text-[var(--muted)]">{org.description}</p></div>{org.private && <span className="pill gold"><Icon name="lock" size={12} /> محرمانه</span>}</section>
        {locked ? <div className="mt-5"><Empty title="این صفحه محرمانه است" body="فقط اعضای این سازمان محتوا و اعضا را می‌بینند و می‌توانند به آن‌ها پیام دهند. عضویت توسط مدیر در بخش کاربران تنظیم می‌شود." /></div> : (
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_280px]">
            <div className="grid content-start gap-3">{org.posts.map((p) => <div key={p.id} className="gm-panel p-4 text-[13px] leading-7">{p.body}<div className="text-[10px] text-[var(--muted)]">{relTime(p.at)}</div></div>)}{!org.posts.length && <Empty title="اطلاعیه‌ای نیست" body="مدیر به‌زودی اطلاعیه منتشر می‌کند." />}</div>
            <div className="gm-panel p-4"><h3 className="mb-3 text-[13px] font-bold">اعضا ({fa(people.length)})</h3>{people.map((p) => <div key={p.id} className="mb-2 flex items-center gap-2 text-[12px]"><Avatar a={p.avatar} size={30} />{p.name}</div>)}</div>
          </div>
        )}
      </>
    );
  }
  return (
    <>
      <PageHead title="صفحه‌های سازمانی" sub={store.profile?.org ? `عضو «${store.orgs.find((o) => o.id === store.profile?.org)?.name}» هستی.` : "عضو هیچ سازمانی نیستی؛ صفحه‌های محرمانه قفل‌اند."} />
      <div className="grid gap-4 md:grid-cols-3">{store.orgs.map((o) => <button key={o.id} className="gm-panel p-5 text-right transition hover:-translate-y-1" onClick={() => setSel(o.id)}><img src={o.logo} alt="" className="size-14" /><div className="mt-2 text-[15px] font-bold">{o.name}</div><p className="mt-1 text-[11px] leading-6 text-[var(--muted)]">{o.description}</p><div className="mt-2">{o.private ? <span className="pill gold"><Icon name="lock" size={11} /> {member(o.id) ? "عضو هستی" : "محرمانه"}</span> : <span className="pill green">عمومی</span>}</div></button>)}</div>
    </>
  );
}

/* =================== لیگ‌ها =================== */
export function LeaguesPage({ store, update, go, onLogin }: { store: Store; update: Up; go: (r: string) => void; onLogin: () => void }) {
  const join = (id: string) => {
    if (!store.profile) return onLogin();
    update((s) => ({ ...s, leagues: s.leagues.map((l) => (l.id === id && !l.members.includes(s.profile!.id) ? { ...l, members: [...l.members, s.profile!.id] } : l)) }));
    sfx("coin");
  };
  return (
    <>
      <PageHead title="لیگ‌ها" sub="مراحل پیاپی؛ هر مرحله یک رویداد با مدال و کاپ پایانی." />
      {store.leagues.map((l) => {
        const rounds = store.events.filter((e) => e.leagueId === l.id);
        const member = !!store.profile && l.members.includes(store.profile.id);
        const allowed = !l.org || store.profile?.org === l.org;
        return (
          <section key={l.id} className="gm-panel mb-5 overflow-hidden">
            <div className="gm-motion flex flex-wrap items-center gap-5 p-6">
              <img src={l.logo} alt="" className="gm-float size-20" />
              <div className="min-w-0 flex-1"><h2 className="text-xl font-black">لیگ {l.title}</h2><p className="text-xs text-[var(--muted)]">{l.description} · {fa(l.members.length)} از {fa(l.capacity)} عضو {l.org && `· ویژهٔ ${store.orgs.find((o) => o.id === l.org)?.name}`}</p></div>
              {!allowed ? <span className="pill red"><Icon name="lock" size={12} /> ویژهٔ اعضای سازمان</span> : member ? <span className="pill green">ثبت‌نام کردی</span> : <button className="btn gm-glow" onClick={() => join(l.id)}>ثبت‌نام در لیگ</button>}
            </div>
            <div className="grid gap-2 border-t border-[var(--line)] p-4 sm:grid-cols-2 lg:grid-cols-4">
              {rounds.map((r, i) => <button key={r.id} className="rounded-xl border border-[var(--line)] bg-[#221a2d] p-3 text-right hover:border-[#6b4f8d] disabled:opacity-50" disabled={!member} onClick={() => go(`events/${r.id}`)}><div className="text-[12px] font-bold">مرحلهٔ {fa(i + 1)} {r.hasCup && "🏆"}</div><div className="text-[10px] text-[var(--muted)]">{eventLive(r) ? "در حال برگزاری" : r.startsAt > Date.now() ? `شروع ${faDate(r.startsAt)}` : "پایان یافته"}</div></button>)}
            </div>
          </section>
        );
      })}
    </>
  );
}

/* =================== ارتباط با مدیر =================== */
export function SupportPage({ store, update, onLogin }: { store: Store; update: Up; onLogin: () => void }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const send = () => {
    if (!store.profile) return onLogin();
    if (!subject.trim() || !body.trim()) return;
    update((s) => ({ ...s, tickets: [{ id: uid("t"), subject: subject.trim(), body: body.trim(), status: "open", reply: "", at: Date.now() }, ...s.tickets] }));
    setSubject(""); setBody("");
    notify({ title: "پیام تو به مدیر رسید", body: "پاسخ در همین بخش نمایش داده می‌شود.", link: "support", kind: "system" });
  };
  return (
    <>
      <PageHead title="ارتباط با مدیر" sub="پیشنهاد، گزارش مشکل یا درخواست عضویت سازمانی" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="gm-panel grid content-start gap-3 p-5"><input className="field" placeholder="موضوع" value={subject} onChange={(e) => setSubject(e.target.value)} /><textarea className="field min-h-32" placeholder="متن پیام" value={body} onChange={(e) => setBody(e.target.value)} /><button className="btn" onClick={send}><Icon name="send" size={14} /> ارسال به مدیر</button></div>
        <div className="grid content-start gap-2">
          {store.tickets.map((t) => <div key={t.id} className="gm-panel p-4"><div className="flex items-center gap-2 text-[13px] font-bold">{t.subject}<span className={`pill mr-auto ${t.status === "answered" ? "green" : t.status === "closed" ? "" : "gold"}`}>{t.status === "answered" ? "پاسخ داده شد" : t.status === "closed" ? "بسته" : "در انتظار"}</span></div><p className="mt-1 text-xs text-[var(--muted)]">{t.body}</p>{t.reply && <p className="mt-2 rounded-xl bg-[#1f3b31] p-3 text-xs text-[#c8f2dd]">پاسخ مدیر: {t.reply}</p>}</div>)}
          {!store.tickets.length && <Empty title="پیامی نفرستاده‌ای" body="هر سؤالی داری بپرس." />}
        </div>
      </div>
    </>
  );
}
