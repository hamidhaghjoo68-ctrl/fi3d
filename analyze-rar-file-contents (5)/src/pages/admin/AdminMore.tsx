import { useState } from "react";
import { Avatar, Icon, ImagePick, Modal, Toggle, fa, faDate, relTime } from "../../components/ui";
import { activeQuestions, allCategories, countByCategory, dailyQuestions, findCategory } from "../../lib/engine";
import { DEFAULT_MEDALS, audit, eventLogo, notify, today, uid } from "../../lib/store";
import { sfx } from "../../lib/sound";
import type { GameEvent, LifelineKey, MedalSet, Mode, Store } from "../../lib/types";
import { Box, Card, type Up } from "./AdminPanel";

const dt = (t: number) => new Date(t - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const fromDt = (s: string) => new Date(s).getTime();

/* ---------- بررسی محتوا ---------- */
export function ReviewSection({ store, update }: { store: Store; update: Up }) {
  const pending = store.posts.filter((p) => p.status === "pending" && !p.scheduledAt);
  const sugg = store.suggestions.filter((s) => s.status === "pending");
  const setPost = (id: string, status: "approved" | "rejected") => { update((s) => ({ ...s, posts: s.posts.map((p) => (p.id === id ? { ...p, status } : p)) })); audit(`post-${status}`); };
  return (
    <>
      <Card title={`پست‌های در انتظار (${fa(pending.length)})`} icon="shield">
        {pending.map((p) => (
          <div key={p.id} className="mb-2 rounded-xl border border-[var(--line)] bg-[#221a2d] p-3">
            <div className="flex items-center gap-2 text-[12px]"><Avatar a={p.avatar} size={28} /><b>{p.author}</b><span className="text-[var(--muted)]">{relTime(p.at)}</span></div>
            <p className="my-2 text-[13px] leading-7">{p.body}</p>{p.media && <img src={p.media} alt="" className="mb-2 max-h-48 rounded-lg" />}
            <div className="flex gap-2"><button className="btn sm" onClick={() => setPost(p.id, "approved")}>تأیید و انتشار</button><button className="btn danger sm" onClick={() => setPost(p.id, "rejected")}>رد</button></div>
          </div>
        ))}
        {!pending.length && <p className="text-xs text-[var(--muted)]">محتوایی در انتظار نیست.</p>}
      </Card>
      <Card title={`سؤال‌های کارخانهٔ سؤال (${fa(sugg.length)})`} icon="plus">
        {sugg.map((q) => (
          <div key={q.id} className="mb-2 rounded-xl border border-[var(--line)] bg-[#221a2d] p-3 text-[12px]">
            <b>{q.title}</b><div className="my-1 text-[var(--muted)]">{q.options.map((o, i) => <span key={i} className={i === q.correct ? "text-[var(--green)]" : ""}>{o}{i < 3 ? " · " : ""}</span>)}</div>
            <div className="flex gap-2">
              <button className="btn sm" onClick={() => { update((s) => ({ ...s, suggestions: s.suggestions.map((x) => (x.id === q.id ? { ...x, status: "approved" } : x)), custom: [{ id: uid("q"), category: q.category, title: q.title, options: q.options, correct: q.correct, explanation: q.explanation, seconds: q.seconds }, ...s.custom], profile: s.profile ? { ...s.profile, coins: s.profile.coins + 30 } : s.profile })); notify({ title: "سؤال تو تأیید شد 🎉", body: "۳۰ سکه گرفتی.", link: "suggest", kind: "reward" }); audit("suggestion-approve"); }}>تأیید و افزودن به بانک</button>
              <button className="btn danger sm" onClick={() => update((s) => ({ ...s, suggestions: s.suggestions.map((x) => (x.id === q.id ? { ...x, status: "rejected" } : x)) }))}>رد</button>
            </div>
          </div>
        ))}
        {!sugg.length && <p className="text-xs text-[var(--muted)]">پیشنهادی در انتظار نیست.</p>}
      </Card>
      <Card title="همهٔ پست‌های منتشرشده" icon="feed">
        {store.posts.filter((p) => p.status === "approved").slice(0, 30).map((p) => <div key={p.id} className="mb-1.5 flex items-center gap-2 text-[12px]"><span className="flex-1 truncate">{p.author}: {p.body}</span><button className="text-[var(--red)]" onClick={() => { update((s) => ({ ...s, posts: s.posts.filter((x) => x.id !== p.id) })); audit("post-delete"); }}><Icon name="close" size={14} /></button></div>)}
      </Card>
    </>
  );
}

export function StoriesSection({ store, update }: { store: Store; update: Up }) {
  const set = (id: string, status: "approved" | "rejected") => { update((s) => ({ ...s, stories: s.stories.map((x) => (x.id === id ? { ...x, status } : x)) })); audit(`story-${status}`); };
  return (
    <Card title="بررسی استوری" icon="image">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {store.stories.map((s) => (
          <div key={s.id} className="overflow-hidden rounded-2xl border border-[var(--line)]">
            <div className="grid min-h-32 place-items-center p-4 text-center text-[13px] font-bold" style={{ background: `linear-gradient(160deg, ${s.color}, #241b30)` }}>{s.image && <img src={s.image} alt="" className="mb-2 max-h-28 rounded-lg" />}{s.text}</div>
            <div className="flex items-center gap-2 bg-[#221a2d] p-2.5 text-[11px]"><span className="flex-1 truncate">{s.author}</span>
              {s.status === "pending" ? <><button className="btn sm" onClick={() => set(s.id, "approved")}>تأیید</button><button className="btn danger sm" onClick={() => set(s.id, "rejected")}>رد</button></> : <><span className={`pill ${s.status === "approved" ? "green" : "red"}`}>{s.status === "approved" ? "منتشر" : "رد"}</span><button className="text-[var(--red)]" onClick={() => update((x) => ({ ...x, stories: x.stories.filter((y) => y.id !== s.id) }))}><Icon name="close" size={14} /></button></>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- رویدادها با لوگو، مدال و کاپ ---------- */
const newEvent = (): GameEvent => ({ id: "", title: "", category: "general", kind: "challenge", startsAt: Date.now(), endsAt: Date.now() + 7 * 86400000, description: "", logo: eventLogo("#b495f0", "⭐"), medals: {}, hasCup: false, active: true, results: [] });
export function EventsSection({ store, update }: { store: Store; update: Up }) {
  const [e, setE] = useState<GameEvent | null>(null);
  const med = store.settings.defaultMedals;
  const save = () => {
    if (!e || !e.title.trim()) return;
    const ev = { ...e, id: e.id || uid("ev") };
    update((s) => ({ ...s, events: [ev, ...s.events.filter((x) => x.id !== ev.id)] }));
    audit("save-tournament");
    if (!e.id) notify({ title: `رویداد تازه: ${ev.title}`, body: ev.description || "همین حالا شرکت کن!", link: `events/${ev.id}`, kind: "event" });
    setE(null);
    sfx("coin");
  };
  return (
    <>
      <Card title="رویدادها، چالش‌ها و تورنومنت‌ها" icon="flag">
        <button className="btn sm mb-3" onClick={() => setE(newEvent())}><Icon name="plus" size={14} /> رویداد تازه</button>
        <div className="grid gap-2">
          {store.events.map((x) => (
            <div key={x.id} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[#221a2d] p-2.5">
              <img src={x.logo} alt="" className="size-11" />
              <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-bold">{x.title} {!x.active && <span className="pill red">غیرفعال</span>}</div><div className="text-[10px] text-[var(--muted)]">{findCategory(store, x.category).name} · تا {faDate(x.endsAt)} · {fa(x.results.length)} نفر</div></div>
              <div className="hidden gap-1 sm:flex">{(["gold", "silver", "bronze"] as const).map((t) => <img key={t} src={x.medals[t] || med[t]} alt="" className="h-7" />)}{x.hasCup && <img src={x.medals.cup || med.cup} alt="" className="h-7" />}</div>
              <button className="text-[var(--purple)]" onClick={() => setE(x)}><Icon name="edit" size={15} /></button>
              <button className="text-[var(--red)]" onClick={() => { update((s) => ({ ...s, events: s.events.filter((y) => y.id !== x.id) })); audit("delete-tournament"); }}><Icon name="close" size={15} /></button>
            </div>
          ))}
        </div>
      </Card>
      <MedalDefaults store={store} update={update} />
      <Modal open={!!e} onClose={() => setE(null)} title={e?.id ? "ویرایش رویداد" : "رویداد تازه"} wide>
        {e && (
          <div className="grid gap-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <input className="field" placeholder="عنوان" value={e.title} onChange={(v) => setE({ ...e, title: v.target.value })} />
              <select className="field" value={e.kind} onChange={(v) => setE({ ...e, kind: v.target.value as GameEvent["kind"] })}><option value="challenge">چالش باز</option><option value="event">رویداد</option><option value="tournament">تورنومنت</option><option value="league">مرحلهٔ لیگ</option></select>
              <select className="field" value={e.category} onChange={(v) => setE({ ...e, category: v.target.value })}>{allCategories(store).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <select className="field" value={e.org || ""} onChange={(v) => setE({ ...e, org: v.target.value || undefined })}><option value="">برای همه</option>{store.orgs.map((o) => <option key={o.id} value={o.id}>فقط {o.name}</option>)}</select>
              <label className="text-[11px]">شروع<input type="datetime-local" className="field" value={dt(e.startsAt)} onChange={(v) => setE({ ...e, startsAt: fromDt(v.target.value) })} /></label>
              <label className="text-[11px]">پایان<input type="datetime-local" className="field" value={dt(e.endsAt)} onChange={(v) => setE({ ...e, endsAt: fromDt(v.target.value) })} /></label>
            </div>
            <textarea className="field" placeholder="توضیح" value={e.description} onChange={(v) => setE({ ...e, description: v.target.value })} />
            <div className="flex flex-wrap items-center gap-3"><img src={e.logo} alt="" className="size-16 rounded-xl" /><ImagePick onPick={(logo) => setE({ ...e, logo })} label="آپلود لوگوی رویداد" max={400} /></div>
            <Toggle label="جام قهرمانی برای نفر اول" on={e.hasCup} onChange={(v) => setE({ ...e, hasCup: v })} />
            <Toggle label="فعال" on={e.active} onChange={(v) => setE({ ...e, active: v })} />
            <div className="text-[12px] font-bold">مدال‌های این رویداد (خالی = پیش‌فرض)</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["gold", "silver", "bronze", "cup"] as const).map((t) => (
                <div key={t} className="rounded-xl border border-[var(--line)] p-2 text-center">
                  <img src={e.medals[t] || med[t]} alt="" className="mx-auto h-16" />
                  <div className="text-[11px]">{t === "gold" ? "طلا" : t === "silver" ? "نقره" : t === "bronze" ? "برنز" : "کاپ"}</div>
                  <ImagePick onPick={(img) => setE({ ...e, medals: { ...e.medals, [t]: img } })} label="تغییر" className="btn ghost sm mt-1" max={300} />
                </div>
              ))}
            </div>
            <button className="btn gm-glow" onClick={save}>ذخیرهٔ رویداد</button>
          </div>
        )}
      </Modal>
    </>
  );
}
function MedalDefaults({ store, update }: { store: Store; update: Up }) {
  const med = store.settings.defaultMedals;
  const set = (k: keyof MedalSet, v: string) => update((s) => ({ ...s, settings: { ...s.settings, defaultMedals: { ...s.settings.defaultMedals, [k]: v } } }));
  return (
    <Card title="مدال‌ها و کاپ پیش‌فرض همهٔ مسابقات" icon="medal">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["gold", "silver", "bronze", "cup"] as const).map((t) => <div key={t} className="rounded-xl border border-[var(--line)] bg-[#221a2d] p-3 text-center"><img src={med[t]} alt="" className="mx-auto h-20" /><ImagePick onPick={(v) => set(t, v)} label="ویرایش تصویر" className="btn ghost sm mt-2" max={300} /></div>)}
      </div>
      <button className="btn ghost sm mt-3" onClick={() => update((s) => ({ ...s, settings: { ...s.settings, defaultMedals: DEFAULT_MEDALS } }))}>بازگشت به طرح اصلی</button>
    </Card>
  );
}

/* ---------- چالش روزانه ---------- */
export function DailySection({ store, update }: { store: Store; update: Up }) {
  const [day, setDay] = useState(today());
  const [q, setQ] = useState("");
  const list = dailyQuestions(store, day);
  const pool = activeQuestions(store).filter((x) => q.trim() && x.title.includes(q.trim())).slice(0, 12);
  return (
    <Card title="مدیریت چالش روزانهٔ صفحهٔ اول" icon="spark">
      <p className="mb-3 text-[11px] leading-6 text-[var(--muted)]">سؤال‌ها هر روز خودکار از بانک انتخاب و عوض می‌شوند. می‌توانی برای هر روز «سؤال ویژه» تعیین کنی و تعداد سؤال‌ها را تغییر دهی.</p>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input type="date" className="field max-w-48" value={day} onChange={(e) => setDay(e.target.value)} />
        <label className="flex items-center gap-2 text-[12px]">تعداد سؤال <input type="number" min={1} max={10} className="field !w-20" value={store.settings.dailyCount} onChange={(e) => update((s) => ({ ...s, settings: { ...s.settings, dailyCount: Number(e.target.value) || 5 } }))} /></label>
      </div>
      <div className="mb-4 grid gap-1.5">{list.map((x, i) => <div key={x.id} className="flex gap-2 rounded-lg bg-[#221a2d] px-3 py-2 text-[12px]"><span className="text-[var(--gold)]">{fa(i + 1)}</span><span className="flex-1">{x.title}</span>{store.settings.dailyOverride[day] === x.id && <span className="pill gold">ویژه</span>}</div>)}</div>
      <input className="field" placeholder="جست‌وجو برای انتخاب سؤال ویژه…" value={q} onChange={(e) => setQ(e.target.value)} />
      {pool.map((x) => <button key={x.id} className="mt-1 block w-full rounded-lg px-3 py-1.5 text-right text-[12px] hover:bg-[#2c2039]" onClick={() => { update((s) => ({ ...s, settings: { ...s.settings, dailyOverride: { ...s.settings.dailyOverride, [day]: x.id } } })); audit(`daily-set:${day}`); setQ(""); }}>{x.title}</button>)}
      {store.settings.dailyOverride[day] && <button className="btn ghost sm mt-2" onClick={() => update((s) => { const o = { ...s.settings.dailyOverride }; delete o[day]; return { ...s, settings: { ...s.settings, dailyOverride: o } }; })}>حذف سؤال ویژهٔ این روز</button>}
    </Card>
  );
}

/* ---------- گزارش‌ها ---------- */
export function ReportsSection({ store }: { store: Store }) {
  const byCat = allCategories(store).map((c) => ({ c, n: store.history.filter((h) => h.category === c.id).length })).filter((x) => x.n).sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...byCat.map((x) => x.n));
  const exportCsv = () => {
    const rows = [["نام", "نوع", "سازمان", "تجربه", "جام", "برد", "بازی"], ...store.players.map((p) => [p.name, p.kind, p.org, p.xp, p.cups, p.wins, p.played])];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" }));
    a.download = "gamify-report.csv";
    a.click();
  };
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Box label="مسابقه‌های تو" value={store.history.length} icon="bolt" />
        <Box label="پست‌ها" value={store.posts.length} icon="feed" />
        <Box label="پیام‌ها" value={store.messages.length} icon="chat" />
        <Box label="مدال‌های اهداشده" value={store.medals.length} icon="medal" />
      </div>
      <Card title="مسابقه به تفکیک موضوع" icon="chart">
        {byCat.map(({ c, n }) => <div key={c.id} className="mb-2 flex items-center gap-2 text-[12px]"><span className="w-28 truncate">{c.name}</span><div className="h-3 flex-1 overflow-hidden rounded-full bg-[#2f2440]"><div className="h-full rounded-full" style={{ width: `${(n / max) * 100}%`, background: c.color }} /></div><span>{fa(n)}</span></div>)}
        {!byCat.length && <p className="text-xs text-[var(--muted)]">هنوز مسابقه‌ای ثبت نشده.</p>}
      </Card>
      <Card title="برترین بازیکنان" icon="trophy">
        {[...store.players].sort((a, b) => b.xp - a.xp).slice(0, 10).map((p, i) => <div key={p.id} className="mb-1.5 flex items-center gap-2 text-[12px]"><span className="w-5 text-[var(--gold)]">{fa(i + 1)}</span><Avatar a={p.avatar} size={26} /><span className="flex-1">{p.name}</span><span>{fa(p.xp)}</span></div>)}
        <button className="btn secondary sm mt-3" onClick={exportCsv}><Icon name="download" size={14} /> خروجی CSV</button>
      </Card>
    </>
  );
}

/* ---------- لوگو، بنر و صدا ---------- */
export function BrandSection({ store, update }: { store: Store; update: Up }) {
  const st = store.settings;
  const set = (patch: Partial<Store["settings"]>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const [bt, setBt] = useState("");
  const [bl, setBl] = useState("");
  const [bc, setBc] = useState("#f2ca7c");
  return (
    <>
      <Card title="هویت بصری" icon="image">
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="field" value={st.siteTitle} onChange={(e) => set({ siteTitle: e.target.value })} placeholder="عنوان سایت" />
          <input className="field" value={st.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="شعار" />
          <input className="field sm:col-span-2" value={st.welcome} onChange={(e) => set({ welcome: e.target.value })} placeholder="پیام خوش‌آمد" />
        </div>
        <div className="mt-3 flex items-center gap-3">{st.logo && <img src={st.logo} alt="" className="size-14 rounded-xl" />}<ImagePick onPick={(logo) => { set({ logo }); audit("brand-logo"); }} label="آپلود لوگو" max={300} />{st.logo && <button className="btn ghost sm" onClick={() => set({ logo: "" })}>لوگوی پیش‌فرض</button>}</div>
      </Card>
      <Card title="بنرهای صفحهٔ اول" icon="flag">
        {st.banners.map((b) => <div key={b.id} className="mb-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px]" style={{ borderColor: b.color, color: b.color }}><span className="flex-1">{b.text}</span><span dir="ltr">{b.link}</span><button onClick={() => set({ banners: st.banners.filter((x) => x.id !== b.id) })}><Icon name="close" size={14} /></button></div>)}
        <div className="flex flex-wrap gap-2"><input className="field flex-1" placeholder="متن بنر" value={bt} onChange={(e) => setBt(e.target.value)} /><input className="field max-w-32" dir="ltr" placeholder="events" value={bl} onChange={(e) => setBl(e.target.value)} /><input type="color" value={bc} onChange={(e) => setBc(e.target.value)} className="h-10 w-12" /><button className="btn sm" onClick={() => { if (bt.trim()) { set({ banners: [...st.banners, { id: uid("b"), text: bt, link: bl, color: bc }] }); setBt(""); } }}>افزودن</button></div>
      </Card>
      <Card title="صدا" icon="music">
        <p className="mb-2 text-[11px] text-[var(--muted)]">موسیقی زمینه و افکت‌های اصلی بستهٔ شما (bg_music، tanswer، fanswer، warning_time، click) داخل برنامه جاسازی شده‌اند. دکمهٔ بالای صفحه فقط موسیقی زمینه را قطع و وصل می‌کند.</p>
        <Toggle label="افکت‌ها روشن" on={store.sound} onChange={(v) => update((s) => ({ ...s, sound: v }))} />
        <Toggle label="موسیقی زمینه" on={store.music} onChange={(v) => update((s) => ({ ...s, music: v }))} />
      </Card>
    </>
  );
}

/* ---------- منابع ---------- */
export function ResourcesSection({ store, update }: { store: Store; update: Up }) {
  const [t, setT] = useState("");
  const [u, setU] = useState("");
  return (
    <Card title="منابع آموزشی" icon="link">
      {store.resources.map((r) => <div key={r.id} className="mb-2 flex items-center gap-2 rounded-lg bg-[#221a2d] px-3 py-2 text-[12px]"><span className="pill">{r.kind}</span><a href={r.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-[var(--purple)]">{r.title}</a><button onClick={() => update((s) => ({ ...s, resources: s.resources.filter((x) => x.id !== r.id) }))}><Icon name="close" size={14} /></button></div>)}
      <div className="flex flex-wrap gap-2"><input className="field flex-1" placeholder="عنوان" value={t} onChange={(e) => setT(e.target.value)} /><input className="field flex-1" dir="ltr" placeholder="https://" value={u} onChange={(e) => setU(e.target.value)} /><button className="btn sm" onClick={() => { if (t && u) { update((s) => ({ ...s, resources: [...s.resources, { id: uid("r"), title: t, url: u, kind: "لینک", category: "general" }] })); setT(""); setU(""); } }}>افزودن</button></div>
    </Card>
  );
}

/* ---------- صفحات سازمانی ---------- */
export function OrgSection({ store, update }: { store: Store; update: Up }) {
  const [n, setN] = useState("");
  const [post, setPost] = useState<Record<string, string>>({});
  return (
    <>
      <Card title="ساخت صفحهٔ سازمانی" icon="briefcase">
        <div className="flex gap-2"><input className="field" placeholder="نام سازمان" value={n} onChange={(e) => setN(e.target.value)} /><button className="btn sm" onClick={() => { if (n.trim()) { update((s) => ({ ...s, orgs: [...s.orgs, { id: uid("org"), name: n, description: "صفحهٔ سازمانی", logo: eventLogo("#8dd6b5", "🏢"), color: "#8dd6b5", private: true, posts: [] }] })); setN(""); audit("org-create"); } }}>ساخت</button></div>
      </Card>
      {store.orgs.map((o) => (
        <Card key={o.id} title={o.name} icon="briefcase">
          <div className="flex flex-wrap items-center gap-3">
            <img src={o.logo} alt="" className="size-14" /><ImagePick onPick={(logo) => update((s) => ({ ...s, orgs: s.orgs.map((x) => (x.id === o.id ? { ...x, logo } : x)) }))} label="لوگو" max={300} />
            <Toggle label="محرمانه (فقط اعضا)" on={o.private} onChange={(v) => update((s) => ({ ...s, orgs: s.orgs.map((x) => (x.id === o.id ? { ...x, private: v } : x)) }))} />
            <span className="text-[11px] text-[var(--muted)]">{fa(store.players.filter((p) => p.org === o.id).length)} عضو — عضویت از بخش «کاربران»</span>
          </div>
          <input className="field mt-3" value={o.description} onChange={(e) => update((s) => ({ ...s, orgs: s.orgs.map((x) => (x.id === o.id ? { ...x, description: e.target.value } : x)) }))} />
          <div className="mt-2 flex gap-2"><input className="field" placeholder="اطلاعیهٔ تازه برای اعضا…" value={post[o.id] || ""} onChange={(e) => setPost({ ...post, [o.id]: e.target.value })} /><button className="btn sm" onClick={() => { const b = post[o.id]; if (b?.trim()) { update((s) => ({ ...s, orgs: s.orgs.map((x) => (x.id === o.id ? { ...x, posts: [{ id: uid("op"), body: b, at: Date.now() }, ...x.posts] } : x)) })); setPost({ ...post, [o.id]: "" }); } }}>انتشار</button></div>
        </Card>
      ))}
    </>
  );
}

/* ---------- لیگ سازمانی ---------- */
export function LeagueSection({ store, update }: { store: Store; update: Up }) {
  const [t, setT] = useState("");
  const [org, setOrg] = useState("");
  const [rounds, setRounds] = useState(5);
  const [cat, setCat] = useState("safety");
  const create = () => {
    if (!t.trim()) return;
    const id = uid("lg");
    const logo = eventLogo("#f2ca7c", "🏅");
    const now = Date.now();
    const evs: GameEvent[] = Array.from({ length: rounds }).map((_, i) => ({ id: uid("ev"), title: `${t} · مرحله ${i + 1}`, category: cat, kind: "league", startsAt: now + i * 86400000, endsAt: now + (i + 2) * 86400000, description: `مرحلهٔ لیگ ${t}`, logo, medals: {}, hasCup: i === rounds - 1, leagueId: id, org: org || undefined, active: true, results: [] }));
    update((s) => ({ ...s, leagues: [...s.leagues, { id, title: t, org, description: `لیگ ${t}`, capacity: 100, status: "open", logo, members: [], startsAt: now, endsAt: now + rounds * 86400000 }], events: [...s.events, ...evs] }));
    audit("league-create");
    setT("");
  };
  return (
    <>
      <Card title="ساخت لیگ" icon="medal">
        <div className="grid gap-2 sm:grid-cols-4"><input className="field sm:col-span-2" placeholder="نام لیگ" value={t} onChange={(e) => setT(e.target.value)} /><select className="field" value={org} onChange={(e) => setOrg(e.target.value)}><option value="">عمومی</option>{store.orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select><select className="field" value={cat} onChange={(e) => setCat(e.target.value)}>{allCategories(store).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <label className="mt-2 flex items-center gap-2 text-[12px]">تعداد مراحل <input type="number" min={1} max={30} className="field !w-20" value={rounds} onChange={(e) => setRounds(Number(e.target.value) || 1)} /></label>
        <button className="btn mt-3" onClick={create}>ساخت لیگ و مراحل</button>
      </Card>
      {store.leagues.map((l) => (
        <Card key={l.id} title={`لیگ ${l.title}`} icon="medal">
          <div className="flex flex-wrap items-center gap-3"><img src={l.logo} alt="" className="size-14" /><ImagePick onPick={(logo) => update((s) => ({ ...s, leagues: s.leagues.map((x) => (x.id === l.id ? { ...x, logo } : x)), events: s.events.map((e) => (e.leagueId === l.id ? { ...e, logo } : e)) }))} label="لوگوی لیگ" max={300} /><span className="text-[11px] text-[var(--muted)]">{fa(l.members.length)} عضو · {fa(store.events.filter((e) => e.leagueId === l.id).length)} مرحله</span>
            <select className="field max-w-40" value={l.status} onChange={(e) => update((s) => ({ ...s, leagues: s.leagues.map((x) => (x.id === l.id ? { ...x, status: e.target.value as "open" } : x)) }))}><option value="open">باز</option><option value="closed">بسته</option></select>
          </div>
        </Card>
      ))}
    </>
  );
}

/* ---------- پشتیبانی ---------- */
export function SupportSection({ store, update }: { store: Store; update: Up }) {
  const [r, setR] = useState<Record<string, string>>({});
  return (
    <Card title="پیام‌های پشتیبانی" icon="headphones">
      {store.tickets.map((t) => (
        <div key={t.id} className="mb-2 rounded-xl border border-[var(--line)] bg-[#221a2d] p-3">
          <div className="flex items-center gap-2 text-[13px] font-bold">{t.subject}<span className="text-[10px] font-normal text-[var(--muted)]">{relTime(t.at)}</span><span className={`pill mr-auto ${t.status === "open" ? "gold" : "green"}`}>{t.status === "open" ? "باز" : t.status === "answered" ? "پاسخ‌داده" : "بسته"}</span></div>
          <p className="my-1 text-[12px] text-[var(--muted)]">{t.body}</p>
          {t.reply ? <p className="text-[12px] text-[var(--green)]">پاسخ: {t.reply}</p> : (
            <div className="flex gap-2"><input className="field" placeholder="پاسخ…" value={r[t.id] || ""} onChange={(e) => setR({ ...r, [t.id]: e.target.value })} /><button className="btn sm" onClick={() => { if (!r[t.id]?.trim()) return; update((s) => ({ ...s, tickets: s.tickets.map((x) => (x.id === t.id ? { ...x, reply: r[t.id], status: "answered" } : x)) })); notify({ title: "پاسخ مدیر رسید", body: r[t.id], link: "support", kind: "system" }); audit("support-reply"); }}>ارسال</button></div>
          )}
        </div>
      ))}
      {!store.tickets.length && <p className="text-xs text-[var(--muted)]">پیامی نیست.</p>}
    </Card>
  );
}

/* ---------- انتشار زمان‌بندی‌شده ---------- */
export function ScheduleSection({ store, update }: { store: Store; update: Up }) {
  const [b, setB] = useState("");
  const [at, setAt] = useState(dt(Date.now() + 3600000));
  const [img, setImg] = useState("");
  const list = store.posts.filter((p) => p.scheduledAt);
  return (
    <Card title="انتشار زمان‌بندی‌شده" icon="clock">
      <textarea className="field min-h-20" placeholder="متن پست" value={b} onChange={(e) => setB(e.target.value)} />
      {img && <img src={img} alt="" className="mt-2 max-h-40 rounded-xl" />}
      <div className="mt-2 flex flex-wrap gap-2"><input type="datetime-local" className="field max-w-60" value={at} onChange={(e) => setAt(e.target.value)} /><ImagePick onPick={setImg} /><button className="btn sm" onClick={() => { if (!b.trim()) return; update((s) => ({ ...s, posts: [{ id: uid("post"), author: s.settings.siteTitle, authorId: "admin", avatar: 6, category: "general", body: b, media: img, likes: 0, liked: false, saved: false, comments: [], at: Date.now(), status: "pending", scheduledAt: fromDt(at) }, ...s.posts] })); setB(""); setImg(""); audit("schedule-post"); }}>زمان‌بندی</button></div>
      <div className="mt-4 grid gap-1.5">{list.map((p) => <div key={p.id} className="flex items-center gap-2 rounded-lg bg-[#221a2d] px-3 py-2 text-[12px]"><Icon name="clock" size={14} className="text-[var(--gold)]" /><span className="flex-1 truncate">{p.body}</span><span className="text-[var(--muted)]">{faDate(p.scheduledAt!)}</span><button onClick={() => update((s) => ({ ...s, posts: s.posts.filter((x) => x.id !== p.id) }))}><Icon name="close" size={14} /></button></div>)}</div>
    </Card>
  );
}

/* ---------- حریف رایانه‌ای و کادر زنده ---------- */
export function BotSection({ store, update }: { store: Store; update: Up }) {
  const st = store.settings;
  const set = (patch: Partial<Store["settings"]>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const staff = store.players.filter((p) => p.kind === "staff");
  return (
    <>
      <Card title="حریف رایانه‌ای" icon="cpu">
        <Toggle label="حریف رایانه‌ای فعال" on={st.botEnabled} onChange={(v) => set({ botEnabled: v })} />
        <label className="mt-3 block text-[12px]">دقت پایه: {fa(Math.round(st.botAccuracy * 100))}٪<input type="range" min={0.3} max={0.95} step={0.05} value={st.botAccuracy} onChange={(e) => set({ botAccuracy: Number(e.target.value) })} className="w-full accent-[var(--purple)]" /></label>
        <div className="mt-2 grid grid-cols-2 gap-2"><label className="text-[12px]">کمترین تأخیر (ms)<input type="number" className="field" value={st.botDelayMin} onChange={(e) => set({ botDelayMin: Number(e.target.value) })} /></label><label className="text-[12px]">بیشترین تأخیر (ms)<input type="number" className="field" value={st.botDelayMax} onChange={(e) => set({ botDelayMax: Number(e.target.value) })} /></label></div>
        <p className="mt-2 text-[11px] text-[var(--muted)]">{fa(store.players.filter((p) => p.kind === "bot").length)} حریف رایانه‌ای از پایگاه دادهٔ شما منتقل شده‌اند.</p>
      </Card>
      <Card title={`کادر زندهٔ ۲۴ ساعته (${fa(staff.length)} ادمین)`} icon="users">
        <Toggle label="فعالیت خودکار کادر" hint="مسابقه می‌دهند، پست و استوری می‌گذارند، به کاربران دعوت و پاسخ پیام می‌فرستند تا سامانه همیشه زنده باشد" on={st.staffActivity} onChange={(v) => set({ staffActivity: v })} />
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{staff.map((p) => <div key={p.id} className="flex items-center gap-2 rounded-lg bg-[#221a2d] p-2 text-[11px]"><Avatar a={p.avatar} size={28} online={st.staffActivity} /><span className="flex-1 truncate">{p.name}</span><span className="text-[var(--muted)]">{fa(p.played)}</span></div>)}</div>
        <p className="mt-3 text-[10px] leading-5 text-[var(--muted)]">توجه: در این نسخهٔ مرورگری، کادر زنده تا وقتی صفحه باز است فعال است. برای فعالیت واقعی ۲۴ ساعته، همین منطق باید روی سرور Node (فایل server/game.mjs) با زمان‌بند اجرا شود.</p>
      </Card>
    </>
  );
}

/* ---------- آمار سؤال‌ها ---------- */
export function QStatsSection({ store }: { store: Store }) {
  const counts = countByCategory(store);
  const missed = Object.values(store.reviews.reduce<Record<string, { t: string; n: number }>>((a, r) => { a[r.questionId] = { t: r.title, n: (a[r.questionId]?.n || 0) + 1 }; return a; }, {})).sort((a, b) => b.n - a.n).slice(0, 10);
  return (
    <>
      <Card title="تعداد سؤال هر دسته" icon="target">
        {allCategories(store).map((c) => <div key={c.id} className="mb-1.5 flex items-center gap-2 text-[12px]"><span className="w-28 truncate">{c.name}</span><div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#2f2440]"><div className="h-full" style={{ width: `${Math.min(100, ((counts[c.id] || 0) / 260) * 100)}%`, background: c.color }} /></div><span className="w-10 text-left">{fa(counts[c.id] || 0)}</span></div>)}
      </Card>
      <Card title="سؤال‌هایی که بیشتر اشتباه پاسخ داده شده‌اند" icon="close">
        {missed.map((m, i) => <div key={i} className="mb-1.5 flex gap-2 text-[12px]"><span className="text-[var(--red)]">{fa(m.n)}×</span><span>{m.t}</span></div>)}
        {!missed.length && <p className="text-xs text-[var(--muted)]">داده‌ای نیست.</p>}
      </Card>
    </>
  );
}

/* ---------- ورود و زبان‌ها + کیت اندروید ---------- */
export function LoginSection({ store, update }: { store: Store; update: Up }) {
  const st = store.settings;
  const dl = (name: string, text: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" })); a.download = name; a.click(); };
  const cap = JSON.stringify({ appId: "ir.gamify.two", appName: st.siteTitle, webDir: "dist", server: { androidScheme: "https" }, android: { allowMixedContent: false } }, null, 2);
  const guide = `# ساخت اپ اندروید گیمیفای ۲ (APK)\n\n۱) Node.js 20+ و Android Studio را نصب کنید.\n۲) در پوشهٔ پروژه:\n   npm install\n   npm run build\n   npm install @capacitor/core @capacitor/cli @capacitor/android\n   npx cap init "${st.siteTitle}" ir.gamify.two --web-dir=dist\n   npx cap add android\n   npx cap copy android\n   npx cap open android\n۳) در Android Studio: Build > Build Bundle(s)/APK(s) > Build APK\n۴) برای اعلان پوش واقعی: افزونهٔ @capacitor/push-notifications + Firebase.\n۵) برای انتشار در کافه‌بازار/مایکت: Build > Generate Signed Bundle.\n`;
  return (
    <>
      <Card title="روش‌های ورود" icon="user">
        <Toggle label="ورود میهمان" on={st.loginMethods.guest} onChange={(v) => update((s) => ({ ...s, settings: { ...s.settings, loginMethods: { ...s.settings.loginMethods, guest: v } } }))} />
        <Toggle label="ورود با شمارهٔ موبایل (کد تأیید)" hint="برای ارسال پیامک واقعی، درگاه پیامک (کاوه‌نگار/ملی‌پیامک) در سرور لازم است" on={st.loginMethods.phone} onChange={(v) => update((s) => ({ ...s, settings: { ...s.settings, loginMethods: { ...s.settings.loginMethods, phone: v } } }))} />
        <Toggle label="ورود با گوگل" hint="GOOGLE_CLIENT_ID در سرور لازم است؛ پس از ورود، علاقه‌مندی‌ها پرسیده می‌شود" on={st.loginMethods.google} onChange={(v) => update((s) => ({ ...s, settings: { ...s.settings, loginMethods: { ...s.settings.loginMethods, google: v } } }))} />
      </Card>
      <Card title="زبان‌ها" icon="globe">
        {st.languages.map((l) => <Toggle key={l.id} label={l.name} on={l.active} onChange={(v) => update((s) => ({ ...s, settings: { ...s.settings, languages: s.settings.languages.map((x) => (x.id === l.id ? { ...x, active: v } : x)) } }))} />)}
      </Card>
      <Card title="اپ اندروید" icon="download">
        <p className="mb-3 text-[11px] leading-6 text-[var(--muted)]">اپ اندروید با Capacitor از همین نسخهٔ وب ساخته می‌شود. فایل تنظیمات و راهنمای گام‌به‌گام را دانلود کن.</p>
        <div className="flex flex-wrap gap-2"><button className="btn secondary sm" onClick={() => dl("capacitor.config.json", cap)}><Icon name="download" size={14} /> capacitor.config.json</button><button className="btn secondary sm" onClick={() => dl("ANDROID-BUILD.md", guide)}><Icon name="download" size={14} /> راهنمای ساخت APK</button></div>
      </Card>
    </>
  );
}

/* ---------- تنظیمات: کمک‌ها برای هر نوع آزمون ---------- */
const MODE_LABEL: Record<Mode, string> = { computer: "رقابت رتبه‌ای", friendly: "دوستانه", practice: "تمرین", event: "رویداد/تورنومنت/لیگ", daily: "چالش روزانه" };
const LL: Record<LifelineKey, string> = { fifty: "۵۰/۵۰ حذف دو گزینه", hint: "راهنما (هینت)", time: "۱۰ ثانیه بیشتر" };
export function SettingsSection({ store, update }: { store: Store; update: Up }) {
  const st = store.settings;
  const set = (patch: Partial<Store["settings"]>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  return (
    <>
      <Card title="کمک‌ها در هر نوع آزمون (غیب‌کردن)" icon="target">
        <div className="overflow-x-auto"><table className="w-full text-center text-[12px]"><thead><tr className="text-[var(--muted)]"><th className="py-2 text-right">نوع آزمون</th>{(Object.keys(LL) as LifelineKey[]).map((k) => <th key={k}>{LL[k]}</th>)}</tr></thead><tbody>
          {(Object.keys(MODE_LABEL) as Mode[]).map((m) => <tr key={m} className="border-t border-[#2f2440]"><td className="py-2.5 text-right">{MODE_LABEL[m]}</td>{(Object.keys(LL) as LifelineKey[]).map((k) => <td key={k}><input type="checkbox" className="size-4 accent-[var(--purple)]" checked={st.lifelines[m][k]} onChange={(e) => { set({ lifelines: { ...st.lifelines, [m]: { ...st.lifelines[m], [k]: e.target.checked } } }); audit(`lifeline:${m}:${k}`); }} /></td>)}</tr>)}
        </tbody></table></div>
      </Card>
      <Card title="عمومی" icon="settings">
        <label className="mb-3 block text-[12px]">زمان پیش‌فرض هر سؤال: {fa(st.roundSeconds)} ثانیه<input type="range" min={10} max={60} step={5} value={st.roundSeconds} onChange={(e) => set({ roundSeconds: Number(e.target.value) })} className="w-full accent-[var(--purple)]" /></label>
        <Toggle label="بررسی پست‌ها پیش از انتشار" on={st.moderatePosts} onChange={(v) => set({ moderatePosts: v })} />
        <Toggle label="بررسی استوری‌ها پیش از انتشار" on={st.moderateStories} onChange={(v) => set({ moderateStories: v })} />
        <Toggle label="گفت‌وگوی کاربران فعال" on={st.chatEnabled} onChange={(v) => set({ chatEnabled: v })} />
        <Toggle label="فروشگاه فعال" on={st.shopEnabled} onChange={(v) => set({ shopEnabled: v })} />
        <input className="field mt-3" value={store.adminName} onChange={(e) => update((s) => ({ ...s, adminName: e.target.value }))} placeholder="نام مدیر" />
      </Card>
    </>
  );
}
