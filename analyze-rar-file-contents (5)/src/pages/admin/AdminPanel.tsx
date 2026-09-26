import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Avatar, Icon, ImagePick, Modal, PageHead, Toggle, fa, faDate, faTime, relTime } from "../../components/ui";
import { activeQuestions, allCategories, countByCategory } from "../../lib/engine";
import { audit, notify, uid } from "../../lib/store";
import { pushNotify, sfx } from "../../lib/sound";
import type { Category, Question } from "../../data/quiz";
import type { Store } from "../../lib/types";
import { BotSection, BrandSection, DailySection, EventsSection, LeagueSection, LoginSection, OrgSection, QStatsSection, ReportsSection, ResourcesSection, ReviewSection, ScheduleSection, SettingsSection, StoriesSection, SupportSection } from "./AdminMore";

export type Up = (fn: (s: Store) => Store) => void;
const ADMIN_KEY = "gamify";

const SECTIONS: [string, string, string][] = [
  ["dashboard", "داشبورد", "chart"], ["bank", "بانک سؤال", "book"], ["excel", "ورود اکسل", "download"], ["categories", "دسته‌بندی‌ها", "grid"],
  ["users", "کاربران", "users"], ["chats", "پیام‌های کاربران", "chat"], ["review", "بررسی محتوا", "shield"], ["stories", "بررسی استوری", "image"],
  ["events", "رویدادها", "flag"], ["daily", "چالش روزانه", "spark"], ["reports", "گزارش‌ها", "chart"], ["brand", "لوگو، بنر و صدا", "music"],
  ["resources", "منابع", "link"], ["orgs", "صفحات سازمانی", "briefcase"], ["league", "لیگ سازمانی", "medal"], ["support", "پشتیبانی", "headphones"],
  ["schedule", "انتشار زمان‌بندی‌شده", "clock"], ["bot", "حریف رایانه‌ای", "cpu"], ["qstats", "آمار سؤال‌ها", "target"], ["login", "ورود و زبان‌ها", "globe"],
  ["settings", "تنظیمات", "settings"],
];

export function AdminPanel({ store, update }: { store: Store; update: Up }) {
  const [key, setKey] = useState("");
  const [name, setName] = useState(store.adminName);
  const [sec, setSec] = useState("dashboard");
  const [err, setErr] = useState("");

  if (!store.admin)
    return (
      <div className="gm-panel mx-auto mt-6 max-w-md p-7 text-center">
        <Icon name="lock" size={32} className="mx-auto text-[var(--gold)]" />
        <h2 className="mt-3 text-base font-bold">ورود به مدیریت گیمیفای ۲</h2>
        <p className="my-2 text-[11px] leading-6 text-[var(--muted)]">در نسخهٔ سرور، کد در <code className="text-[var(--gold)]">data/admin-key.txt</code> است. در این نسخه کد: <code className="text-[var(--gold)]">gamify</code></p>
        <input className="field my-2" placeholder="نام مدیر (برای گزارش فعالیت)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="field mb-3 text-center" type="password" placeholder="کد مدیریت" value={key} onChange={(e) => setKey(e.target.value)} />
        <button className="btn gm-glow full" onClick={() => { if (key.trim() !== ADMIN_KEY) return setErr("کد نادرست است."); update((s) => ({ ...s, admin: true, adminName: name.trim() || "مدیر" })); audit("admin-login"); }}>ورود به پنل</button>
        {err && <p className="mt-2 text-xs text-[var(--red)]">{err}</p>}
      </div>
    );

  const pending = { review: store.posts.filter((p) => p.status === "pending").length + store.suggestions.filter((s) => s.status === "pending").length, stories: store.stories.filter((s) => s.status === "pending").length, support: store.tickets.filter((t) => t.status === "open").length };

  return (
    <>
      <PageHead title="مدیریت گیمیفای ۲" sub="بانک سؤال، ورود گروهی و محتوای بازی" action={<button className="btn ghost sm" onClick={() => update((s) => ({ ...s, admin: false }))}><Icon name="logout" size={14} /> خروج از پنل ({store.adminName})</button>} />
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="gm-panel flex gap-1 overflow-x-auto p-2 lg:sticky lg:top-24 lg:block lg:max-h-[80vh] lg:overflow-y-auto">
          {SECTIONS.map(([id, label, ic]) => (
            <button key={id} className="gm-nav-item !w-auto shrink-0 !py-2 lg:!w-full" data-active={sec === id} onClick={() => setSec(id)}>
              <Icon name={ic} size={16} /> <span className="text-[12px] whitespace-nowrap">{label}</span>
              {(pending as Record<string, number>)[id] > 0 && <span className="mr-auto rounded bg-[var(--gold)] px-1.5 text-[10px] font-bold text-[#302132]">{fa((pending as Record<string, number>)[id])}</span>}
            </button>
          ))}
        </nav>
        <div className="min-w-0">
          {sec === "dashboard" && <Dashboard store={store} />}
          {sec === "bank" && <BankSection store={store} update={update} />}
          {sec === "excel" && <ExcelSection store={store} update={update} />}
          {sec === "categories" && <CategoriesSection store={store} update={update} />}
          {sec === "users" && <UsersSection store={store} update={update} />}
          {sec === "chats" && <ChatsSection store={store} update={update} />}
          {sec === "review" && <ReviewSection store={store} update={update} />}
          {sec === "stories" && <StoriesSection store={store} update={update} />}
          {sec === "events" && <EventsSection store={store} update={update} />}
          {sec === "daily" && <DailySection store={store} update={update} />}
          {sec === "reports" && <ReportsSection store={store} />}
          {sec === "brand" && <BrandSection store={store} update={update} />}
          {sec === "resources" && <ResourcesSection store={store} update={update} />}
          {sec === "orgs" && <OrgSection store={store} update={update} />}
          {sec === "league" && <LeagueSection store={store} update={update} />}
          {sec === "support" && <SupportSection store={store} update={update} />}
          {sec === "schedule" && <ScheduleSection store={store} update={update} />}
          {sec === "bot" && <BotSection store={store} update={update} />}
          {sec === "qstats" && <QStatsSection store={store} />}
          {sec === "login" && <LoginSection store={store} update={update} />}
          {sec === "settings" && <SettingsSection store={store} update={update} />}
        </div>
      </div>
    </>
  );
}

export function Box({ label, value, icon }: { label: string; value: number; icon: string }) {
  return <div className="gm-panel gm-pop px-4 py-5 text-center"><Icon name={icon} size={20} className="mx-auto text-[var(--gold)]" /><div className="gm-reveal-text mt-1 text-2xl font-black">{fa(value)}</div><div className="text-[11px] text-[var(--muted)]">{label}</div></div>;
}
export function Card({ title, children, icon = "spark" }: { title: string; children: React.ReactNode; icon?: string }) {
  return <section className="gm-panel mb-4 p-5"><h3 className="mb-4 flex items-center gap-2 text-[14px] font-bold"><Icon name={icon} size={16} className="text-[var(--gold)]" /> {title}</h3>{children}</section>;
}

/* ---------- داشبورد ---------- */
function Dashboard({ store }: { store: Store }) {
  const [t, setT] = useState("");
  const [b, setB] = useState("");
  const [link, setLink] = useState("#events");
  const [to, setTo] = useState("");
  const [confirm, setConfirm] = useState(false);
  const real = store.players.filter((p) => p.kind === "member" || p.kind === "real").length + (store.profile ? 1 : 0);
  const pendingCount = store.posts.filter((p) => p.status === "pending").length + store.stories.filter((s) => s.status === "pending").length + store.suggestions.filter((s) => s.status === "pending").length;
  const send = () => {
    notify({ title: t, body: b, link: link.replace("#", ""), kind: "system" });
    pushNotify(t, b);
    audit(`broadcast${to ? `:${to}` : ":all"}`);
    setT(""); setB(""); setConfirm(false);
  };
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Box label="کاربر واقعی" value={real} icon="users" />
        <Box label="مسابقهٔ کامل" value={store.completedMatches} icon="trophy" />
        <Box label="سؤال در بانک" value={activeQuestions(store).length} icon="book" />
        <Box label="محتوا در انتظار بررسی" value={pendingCount} icon="shield" />
      </div>
      <Card title="پیام عمومی داخل بازی" icon="bell">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <input className="field" placeholder="عنوان اعلان" value={t} onChange={(e) => setT(e.target.value)} />
          <input className="field" placeholder="لینک مقصد (اختیاری) مثل #events" value={link} onChange={(e) => setLink(e.target.value)} dir="ltr" />
          <textarea className="field sm:col-span-2" placeholder="متن" value={b} onChange={(e) => setB(e.target.value)} />
          <input className="field" placeholder="شناسهٔ گیرنده (خالی = همه)" value={to} onChange={(e) => setTo(e.target.value)} dir="ltr" />
          <p className="self-center text-[10px] text-[var(--muted)]">شناسه از صفحهٔ کاربر (بخش کاربران) قابل کپی است.</p>
        </div>
        <button className="btn mt-3" disabled={!t.trim() || !b.trim()} onClick={() => setConfirm(true)}><Icon name="send" size={14} /> بررسی و ارسال اعلان</button>
        <Modal open={confirm} onClose={() => setConfirm(false)} title="پیش‌نمایش اعلان">
          <div className="rounded-xl border border-[#75613e] bg-[#302535] p-4"><div className="font-bold">{t}</div><p className="text-xs text-[var(--muted)]">{b}</p><p className="mt-2 text-[10px]">گیرنده: {to || "همهٔ کاربران"} · مقصد: {link || "—"}</p></div>
          <button className="btn gm-glow full mt-4" onClick={send}>ارسال نهایی</button>
        </Modal>
      </Card>
      <Card title="آخرین فعالیت‌های مدیریتی" icon="clock">
        <div className="overflow-x-auto"><table className="w-full text-right text-[12px]"><thead className="text-[var(--muted)]"><tr><th className="py-2">مدیر</th><th>عملیات</th><th>زمان</th></tr></thead><tbody>
          {store.audit.slice(0, 20).map((a) => <tr key={a.id} className="border-t border-[#2f2440]"><td className="py-2">{a.admin}</td><td dir="ltr" className="text-right font-mono text-[11px] text-[var(--purple)]">{a.action}</td><td className="text-[var(--muted)]">{faDate(a.at)}، {faTime(a.at)}</td></tr>)}
        </tbody></table></div>
      </Card>
    </>
  );
}

/* ---------- بانک سؤال ---------- */
const blank = (): Question => ({ id: "", category: "general", title: "", options: ["", "", "", ""], correct: 0, explanation: "", seconds: 25 });
export function QuestionForm({ store, value, onSave }: { store: Store; value: Question; onSave: (q: Question) => void }) {
  const [d, setD] = useState<Question>(value);
  return (
    <div className="grid gap-2.5">
      <textarea className="field min-h-20" placeholder="متن سؤال" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
      {d.options.map((o, i) => (
        <div key={i} className="flex gap-2"><button className={`grid size-10 shrink-0 place-items-center rounded-lg border ${d.correct === i ? "border-[#47936f] bg-[#1f3b31] text-[var(--green)]" : "border-[var(--line)]"}`} onClick={() => setD({ ...d, correct: i })}><Icon name="check" size={15} /></button><input className="field" placeholder={`گزینهٔ ${fa(i + 1)}`} value={o} onChange={(e) => setD({ ...d, options: d.options.map((x, j) => (j === i ? e.target.value : x)) })} /></div>
      ))}
      <textarea className="field" placeholder="توضیح پاسخ درست" value={d.explanation} onChange={(e) => setD({ ...d, explanation: e.target.value })} />
      <div className="flex gap-2">
        <select className="field" value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })}>{allCategories(store).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select className="field max-w-32" value={d.seconds} onChange={(e) => setD({ ...d, seconds: Number(e.target.value) })}>{[15, 20, 25, 30, 45, 60].map((s) => <option key={s} value={s}>{fa(s)} ثانیه</option>)}</select>
      </div>
      <button className="btn" onClick={() => { if (d.title.trim().length < 5 || d.options.some((o) => !o.trim())) return alert("متن و ۴ گزینه لازم است."); onSave({ ...d, id: d.id || uid("q") }); }}><Icon name="check" size={14} /> ذخیره</button>
    </div>
  );
}

function BankSection({ store, update }: { store: Store; update: Up }) {
  const [f, setF] = useState("all");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Question | null>(null);
  const [limit, setLimit] = useState(40);
  const all = activeQuestions(store);
  const counts = countByCategory(store);
  const list = useMemo(() => all.filter((x) => (f === "all" || x.category === f) && (!q.trim() || x.title.includes(q.trim()))), [all, f, q]);
  const save = (qq: Question) => {
    const isCustom = store.custom.some((c) => c.id === qq.id);
    if (isCustom) update((s) => ({ ...s, custom: s.custom.map((c) => (c.id === qq.id ? qq : c)) }));
    else if (edit?.id) update((s) => ({ ...s, removed: [...s.removed, edit.id], custom: [{ ...qq, id: uid("q") }, ...s.custom] }));
    else update((s) => ({ ...s, custom: [qq, ...s.custom] }));
    audit(edit?.id ? "edit-question" : "add-question");
    setEdit(null);
    sfx("coin");
  };
  return (
    <Card title={`بانک سؤال (${fa(all.length)})`} icon="book">
      <div className="mb-3 flex flex-wrap gap-2">
        <select className="field max-w-52" value={f} onChange={(e) => setF(e.target.value)}><option value="all">همهٔ دسته‌ها</option>{allCategories(store).map((c) => <option key={c.id} value={c.id}>{c.name} ({fa(counts[c.id] || 0)})</option>)}</select>
        <input className="field max-w-64" placeholder="جست‌وجو…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn sm" onClick={() => setEdit(blank())}><Icon name="plus" size={14} /> سؤال تازه</button>
        {store.removed.length > 0 && <button className="btn ghost sm" onClick={() => update((s) => ({ ...s, removed: [] }))}>بازگرداندن {fa(store.removed.length)} حذف‌شده</button>}
      </div>
      <div className="grid gap-1.5">
        {list.slice(0, limit).map((x) => (
          <div key={x.id} className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[#221a2d] px-3 py-2 text-[12px]">
            <span className="pill">{allCategories(store).find((c) => c.id === x.category)?.name}</span>
            <span className="min-w-0 flex-1 truncate">{x.title}</span>
            <button className="text-[var(--purple)]" onClick={() => setEdit(x)} title="ویرایش"><Icon name="edit" size={15} /></button>
            <button className="text-[var(--red)]" onClick={() => { update((s) => ({ ...s, removed: [...s.removed, x.id], custom: s.custom.filter((c) => c.id !== x.id) })); audit("delete-question"); }} title="حذف"><Icon name="close" size={15} /></button>
          </div>
        ))}
      </div>
      {list.length > limit && <button className="btn ghost sm mt-3" onClick={() => setLimit(limit + 60)}>نمایش بیشتر ({fa(list.length - limit)})</button>}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "ویرایش سؤال" : "سؤال تازه"}>{edit && <QuestionForm store={store} value={edit} onSave={save} />}</Modal>
    </Card>
  );
}

/* ---------- ورود اکسل ---------- */
const HEAD = ["دسته", "متن سؤال", "گزینه ۱", "گزینه ۲", "گزینه ۳", "گزینه ۴", "گزینه صحیح", "توضیح", "زمان (ثانیه)"];
function ExcelSection({ store, update }: { store: Store; update: Up }) {
  const [rows, setRows] = useState<{ q: Question; error: string; dup: boolean }[]>([]);
  const [msg, setMsg] = useState("");
  const cats = allCategories(store);
  const template = () => {
    const sample = activeQuestions(store).slice(0, 100).map((q) => [cats.find((c) => c.id === q.category)?.name || q.category, q.title, ...q.options, q.correct + 1, q.explanation, q.seconds]);
    const ws = XLSX.utils.aoa_to_sheet([HEAD, ...sample]);
    ws["!cols"] = [{ wch: 16 }, { wch: 50 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 10 }, { wch: 40 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "سؤال‌ها");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["شناسه", "نام دسته"], ...cats.map((c) => [c.id, c.name])]), "دسته‌ها");
    XLSX.writeFile(wb, "gamify-2-questions-100.xlsx");
  };
  const fa2en = (v: unknown) => String(v ?? "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).trim();
  const read = async (file: File) => {
    const wb = XLSX.read(await file.arrayBuffer());
    const data = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, blankrows: false });
    const existing = new Set(activeQuestions(store).map((q) => q.title.trim()));
    const seen = new Set<string>();
    const out = data.slice(1).filter((r) => r.some((c) => String(c ?? "").trim())).slice(0, 2000).map((r) => {
      const catRaw = String(r[0] ?? "").trim();
      const cat = cats.find((c) => c.id === catRaw || c.name === catRaw);
      const opts = [2, 3, 4, 5].map((i) => String(r[i] ?? "").trim());
      const correct = Number(fa2en(r[6])) - 1;
      const title = String(r[1] ?? "").trim();
      let error = "";
      if (!cat) error = `دستهٔ «${catRaw}» پیدا نشد`;
      else if (title.length < 5) error = "متن سؤال کوتاه است";
      else if (opts.some((o) => !o)) error = "هر ۴ گزینه لازم است";
      else if (!(correct >= 0 && correct <= 3)) error = "گزینه صحیح باید ۱ تا ۴ باشد";
      else if (title.startsWith("=") || opts.some((o) => o.startsWith("="))) error = "فرمول مجاز نیست";
      const dup = existing.has(title) || seen.has(title);
      seen.add(title);
      return { q: { id: uid("xl"), category: cat?.id || "general", title, options: opts, correct: Math.max(0, correct), explanation: String(r[7] ?? "").trim(), seconds: Number(fa2en(r[8])) || 25 }, error, dup };
    });
    setRows(out);
    setMsg(`${fa(out.length)} ردیف خوانده شد.`);
  };
  const ok = rows.filter((r) => !r.error && !r.dup);
  const commit = () => {
    update((s) => ({ ...s, custom: [...ok.map((r) => r.q), ...s.custom] }));
    audit(`excel-import:${ok.length}`);
    setMsg(`✅ ${fa(ok.length)} سؤال به بانک اضافه شد.`);
    setRows([]);
    sfx("win");
  };
  return (
    <Card title="ورود گروهی سؤال با اکسل" icon="download">
      <ol className="mb-4 list-inside list-decimal text-[12px] leading-7 text-[var(--muted)]">
        <li>فایل نمونه را دانلود کن (۱۰۰ سؤال واقعی از بانک + برگهٔ دسته‌ها).</li>
        <li>سؤال‌ها را در همان ستون‌ها وارد کن؛ «گزینه صحیح» عدد ۱ تا ۴ (ارقام فارسی هم پذیرفته می‌شود).</li>
        <li>فایل را انتخاب کن، پیش‌نمایش و خطاها را ببین، بعد «ثبت نهایی» بزن. سؤال‌های تکراری خودکار رد می‌شوند.</li>
      </ol>
      <div className="flex flex-wrap gap-2">
        <button className="btn secondary" onClick={template}><Icon name="download" size={15} /> دانلود فایل نمونه (۱۰۰ سؤال)</button>
        <label className="btn cursor-pointer"><Icon name="plus" size={15} /> انتخاب فایل اکسل<input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void read(f).catch(() => setMsg("خواندن فایل ناموفق بود.")); }} /></label>
      </div>
      {msg && <p className="mt-3 text-xs text-[var(--gold)]">{msg}</p>}
      {rows.length > 0 && (
        <>
          <div className="my-3 flex flex-wrap gap-2 text-[11px]"><span className="pill green">{fa(ok.length)} معتبر</span><span className="pill red">{fa(rows.filter((r) => r.error).length)} خطا</span><span className="pill gold">{fa(rows.filter((r) => !r.error && r.dup).length)} تکراری</span></div>
          <div className="max-h-80 overflow-y-auto rounded-xl border border-[var(--line)]">
            {rows.slice(0, 200).map((r, i) => <div key={i} className={`flex gap-2 border-b border-[#2f2440] px-3 py-1.5 text-[11px] ${r.error ? "text-[var(--red)]" : r.dup ? "text-[var(--gold)]" : ""}`}><span className="w-8 text-[var(--muted)]">{fa(i + 2)}</span><span className="flex-1 truncate">{r.q.title || "—"}</span><span>{r.error || (r.dup ? "تکراری" : "✓")}</span></div>)}
          </div>
          <button className="btn gm-glow mt-3" disabled={!ok.length} onClick={commit}>ثبت نهایی {fa(ok.length)} سؤال</button>
        </>
      )}
    </Card>
  );
}

/* ---------- دسته‌بندی‌ها (با عکس) ---------- */
const ICONS = ["book", "bolt", "shield", "globe", "flask", "cpu", "briefcase", "leaf", "ball", "music", "image", "heart", "spark", "trophy", "target", "play"];
function CategoriesSection({ store, update }: { store: Store; update: Up }) {
  const [d, setD] = useState<Category>({ id: "", name: "", subtitle: "", icon: "book", color: "#b495f0", tag: "تازه", safety: 0, image: "" });
  const counts = countByCategory(store);
  const save = () => {
    if (!d.name.trim()) return;
    const cat = { ...d, id: d.id || uid("cat") };
    const isBase = !store.customCategories.some((c) => c.id === cat.id) && allCategories(store).some((c) => c.id === cat.id);
    update((s) => isBase ? { ...s, categoryImages: { ...s.categoryImages, [cat.id]: cat.image || "" } } : { ...s, customCategories: [cat, ...s.customCategories.filter((c) => c.id !== cat.id)], categoryImages: { ...s.categoryImages, [cat.id]: cat.image || "" } });
    audit(d.id ? "edit-category" : "add-category");
    setD({ id: "", name: "", subtitle: "", icon: "book", color: "#b495f0", tag: "تازه", safety: 0, image: "" });
    sfx("coin");
  };
  return (
    <>
      <Card title={d.id ? "ویرایش دسته" : "ساخت دستهٔ جدید"} icon="plus">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <input className="field" placeholder="نام دسته" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
          <input className="field" placeholder="زیرعنوان" value={d.subtitle} onChange={(e) => setD({ ...d, subtitle: e.target.value })} />
          <input className="field" placeholder="برچسب (مثلاً تازه)" value={d.tag} onChange={(e) => setD({ ...d, tag: e.target.value })} />
          <div className="flex items-center gap-2"><input type="color" value={d.color} onChange={(e) => setD({ ...d, color: e.target.value })} className="h-10 w-14 rounded-lg bg-transparent" /><select className="field" value={d.icon} onChange={(e) => setD({ ...d, icon: e.target.value })}>{ICONS.map((i) => <option key={i} value={i}>{i}</option>)}</select></div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {d.image ? <img src={d.image} alt="" className="h-24 w-40 rounded-xl object-cover" /> : <div className="grid h-24 w-40 place-items-center rounded-xl border border-dashed border-[var(--line)] text-[11px] text-[var(--muted)]">عکس دسته</div>}
          <ImagePick onPick={(img) => setD({ ...d, image: img })} label="آپلود عکس دسته" max={900} />
          {d.image && <button className="btn ghost sm" onClick={() => setD({ ...d, image: "" })}>حذف عکس</button>}
        </div>
        <button className="btn mt-3" onClick={save}><Icon name="check" size={14} /> {d.id ? "ذخیرهٔ تغییرات" : "ساخت دسته"}</button>
      </Card>
      <Card title={`دسته‌ها (${fa(allCategories(store).length)})`} icon="grid">
        <div className="grid gap-2 sm:grid-cols-2">
          {[...allCategories(store), ...store.customCategories.filter((c) => store.hiddenCategories.includes(c.id))].map((c) => {
            const hidden = store.hiddenCategories.includes(c.id);
            return (
              <div key={c.id} className={`flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[#221a2d] p-2.5 ${hidden ? "opacity-50" : ""}`}>
                {c.image ? <img src={c.image} alt="" className="size-12 rounded-lg object-cover" /> : <span className="grid size-12 place-items-center rounded-lg" style={{ background: `${c.color}22`, color: c.color }}><Icon name={c.icon} size={20} /></span>}
                <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-bold">{c.name}</div><div className="text-[10px] text-[var(--muted)]">{fa(counts[c.id] || 0)} سؤال {!c.image && "· بدون عکس"}</div></div>
                <button className="text-[var(--purple)]" onClick={() => setD({ ...c, image: c.image || "" })}><Icon name="edit" size={15} /></button>
                <button className="text-[var(--muted)]" onClick={() => update((s) => ({ ...s, hiddenCategories: hidden ? s.hiddenCategories.filter((x) => x !== c.id) : [...s.hiddenCategories, c.id] }))} title={hidden ? "نمایش" : "پنهان"}><Icon name={hidden ? "plus" : "close"} size={15} /></button>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}

/* ---------- کاربران (سازمان و محرمانگی) ---------- */
function UsersSection({ store, update }: { store: Store; update: Up }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const list = store.players.filter((p) => (kind === "all" || p.kind === kind) && (!q.trim() || p.name.includes(q.trim()) || p.id.includes(q.trim())));
  const patch = (id: string, v: Partial<Store["players"][number]>) => { update((s) => ({ ...s, players: s.players.map((p) => (p.id === id ? { ...p, ...v } : p)) })); audit(`user-update:${id}`); };
  return (
    <>
      {store.profile && (
        <Card title="حساب شما (کاربر فعلی)" icon="user">
          <div className="flex flex-wrap items-center gap-3">
            <Avatar a={store.profile.avatar} size={44} />
            <div className="flex-1 text-[13px] font-bold">{store.profile.name} <span className="font-mono text-[10px] text-[var(--muted)]" dir="ltr">{store.profile.id}</span></div>
            <select className="field max-w-52" value={store.profile.org} onChange={(e) => update((s) => (s.profile ? { ...s, profile: { ...s.profile, org: e.target.value } } : s))}><option value="">عمومی (بدون سازمان)</option>{store.orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
          </div>
        </Card>
      )}
      <Card title={`کاربران (${fa(store.players.length)})`} icon="users">
        <div className="mb-3 flex flex-wrap gap-2">
          <input className="field max-w-64" placeholder="نام یا شناسه…" value={q} onChange={(e) => setQ(e.target.value)} />
          {[["all", "همه"], ["staff", "کادر زنده"], ["member", "اعضای سازمانی"], ["bot", "رایانه‌ای"]].map(([id, l]) => <button key={id} className={`btn sm ${kind === id ? "primary" : "ghost"}`} onClick={() => setKind(id)}>{l}</button>)}
        </div>
        <p className="mb-3 text-[11px] leading-6 text-[var(--muted)]">اگر «نمایش عمومی» خاموش باشد، این کاربر فقط برای اعضای همان سازمان دیده می‌شود و افراد عادی نمی‌توانند به او پیام دهند یا دعوتش کنند.</p>
        <div className="grid gap-2">
          {list.map((p) => (
            <div key={p.id} className={`grid items-center gap-2 rounded-xl border border-[var(--line)] bg-[#221a2d] p-3 md:grid-cols-[1.3fr_1fr_auto_auto_auto] ${p.banned ? "opacity-50" : ""}`}>
              <div className="flex min-w-0 items-center gap-2.5"><Avatar a={p.avatar} size={36} /><div className="min-w-0"><div className="truncate text-[13px] font-bold">{p.name}</div><div className="font-mono text-[9px] text-[var(--muted)]" dir="ltr">{p.id}</div></div></div>
              <select className="field !py-1.5 text-[12px]" value={p.org} onChange={(e) => patch(p.id, { org: e.target.value })}><option value="">بدون سازمان</option>{store.orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
              <label className="flex items-center gap-1.5 text-[11px]"><input type="checkbox" checked={p.publicVisible} onChange={(e) => patch(p.id, { publicVisible: e.target.checked })} className="accent-[var(--purple)]" /> نمایش عمومی</label>
              <select className="field !w-auto !py-1.5 text-[11px]" value={p.chatPrivacy} onChange={(e) => patch(p.id, { chatPrivacy: e.target.value as "all" })}><option value="all">چت: همه</option><option value="friends">چت: دوستان</option><option value="off">چت: خاموش</option></select>
              <button className={`btn sm ${p.banned ? "secondary" : "danger"}`} onClick={() => patch(p.id, { banned: !p.banned })}>{p.banned ? "رفع مسدودی" : "مسدود"}</button>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

/* ---------- نظارت بر پیام‌های کاربران ---------- */
function ChatsSection({ store, update }: { store: Store; update: Up }) {
  const [onlyImg, setOnlyImg] = useState(false);
  const msgs = [...store.messages].reverse().filter((m) => !onlyImg || m.image);
  const name = (id: string) => (id === "me" ? store.profile?.name || "کاربر" : store.players.find((p) => p.id === id)?.name || id);
  const imgCount = store.messages.filter((m) => m.image && !m.deleted).length;
  return (
    <Card title={`پیام‌های کاربران (${fa(store.messages.length)} پیام · ${fa(imgCount)} عکس)`} icon="chat">
      <div className="mb-3 flex flex-wrap gap-2">
        <Toggle label="فقط پیام‌های دارای عکس" on={onlyImg} onChange={setOnlyImg} />
        <button className="btn danger sm" disabled={!imgCount} onClick={() => { update((s) => ({ ...s, messages: s.messages.map((m) => (m.image ? { ...m, image: undefined, text: m.text || "[عکس حذف شد]" } : m)) })); audit("chat-delete-all-images"); }}>حذف همهٔ عکس‌ها</button>
      </div>
      <div className="grid gap-2">
        {msgs.map((m) => (
          <div key={m.id} className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[#221a2d] p-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-[var(--muted)]">{name(m.from)} ← {m.from === "me" ? name(m.thread) : store.profile?.name} · {relTime(m.at)}</div>
              {m.deleted ? <i className="text-[11px] text-[var(--red)]">حذف‌شده توسط مدیر</i> : <>{m.image && <img src={m.image} alt="" className="my-1.5 max-h-40 rounded-lg" />}<p className="text-[13px]">{m.text}</p></>}
            </div>
            {m.image && !m.deleted && <button className="btn ghost sm" onClick={() => { update((s) => ({ ...s, messages: s.messages.map((x) => (x.id === m.id ? { ...x, image: undefined } : x)) })); audit("chat-delete-image"); }}>حذف عکس</button>}
            {!m.deleted && <button className="btn danger sm" onClick={() => { update((s) => ({ ...s, messages: s.messages.map((x) => (x.id === m.id ? { ...x, deleted: true } : x)) })); audit("chat-delete-message"); }}>حذف پیام</button>}
          </div>
        ))}
        {!msgs.length && <p className="py-8 text-center text-xs text-[var(--muted)]">پیامی وجود ندارد.</p>}
      </div>
    </Card>
  );
}
