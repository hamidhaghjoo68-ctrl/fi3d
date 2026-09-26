import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarBuilder, Icon, Modal, fa } from "./ui";
import { logo } from "../data/art";
import { allCategories, findCategory, levelOf } from "../lib/engine";
import { presetCfgs } from "../lib/avatar";
import { askNotifyPermission, sfx } from "../lib/sound";
import type { AvatarRef, Invite, Notice, Profile, Store } from "../lib/types";

/* =================== ورود / ثبت‌نام =================== */
type Done = (d: { name: string; avatar: AvatarRef; interests: string[]; provider: Profile["provider"]; phone?: string; email?: string }) => void;

export function LoginDialog({ store, onClose, onDone }: { store: Store; onClose: () => void; onDone: Done }) {
  const m = store.settings.loginMethods;
  const [method, setMethod] = useState<Profile["provider"] | null>(null);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [avatar, setAvatar] = useState<AvatarRef>(presetCfgs[Math.floor(Math.random() * presetCfgs.length)]);
  const [interests, setInterests] = useState<string[]>([]);
  const fa2en = (s: string) => s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

  const sendCode = () => {
    const n = fa2en(phone).replace(/\D/g, "");
    if (!/^09\d{9}$/.test(n)) return setErr("شمارهٔ موبایل باید ۱۱ رقم و با ۰۹ شروع شود.");
    const c = String(1000 + Math.floor(Math.random() * 9000));
    setSent(c);
    setErr("");
    sfx("jingle");
  };
  const verify = () => {
    if (fa2en(code).trim() !== sent) return setErr("کد تأیید نادرست است.");
    setErr("");
    setStep(1);
  };
  const googleOk = () => {
    if (!/^[^@\s]+@gmail\.com$/i.test(email.trim())) return setErr("یک نشانی Gmail معتبر وارد کن.");
    setErr("");
    setName(email.split("@")[0]);
    /* ورود گوگل: علاقه‌مندی‌ها بعداً پرسیده می‌شود */
    onDone({ name: email.split("@")[0], avatar, interests: [], provider: "google", email: email.trim() });
  };
  const finish = () => {
    if (interests.length < 3) return setErr("دست‌کم ۳ علاقه انتخاب کن.");
    onDone({ name, avatar, interests, provider: method || "guest", phone: method === "phone" ? fa2en(phone) : undefined });
  };

  return (
    <Modal open onClose={onClose} title={step === 0 ? "ورود / ثبت‌نام در گیمیفای ۲" : step === 1 ? "آواتارت را بساز" : "به چه چیزهایی علاقه داری؟"} wide={step === 1}>
      {step === 0 && !method && (
        <div className="grid gap-3">
          <img src={store.settings.logo || logo} alt="" className="mx-auto size-16" />
          {m.phone && <button className="btn gm-glow full !min-h-12" onClick={() => setMethod("phone")}><Icon name="send" size={17} /> ورود با شمارهٔ موبایل</button>}
          {m.google && <button className="btn secondary full !min-h-12" onClick={() => setMethod("google")}><span className="text-lg font-black text-[#4285f4]">G</span> ورود با حساب گوگل</button>}
          {m.guest && <button className="btn ghost full !min-h-12" onClick={() => setMethod("guest")}><Icon name="user" size={17} /> ورود سریع میهمان</button>}
          <p className="text-center text-[10px] text-[var(--muted)]">با ورود، قوانین استفاده و حریم خصوصی را می‌پذیری.</p>
        </div>
      )}
      {step === 0 && method === "phone" && (
        <div className="grid gap-3">
          <label className="text-[12px]">شمارهٔ موبایل</label>
          <input className="field text-left" dir="ltr" inputMode="numeric" placeholder="09xxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!!sent} />
          {!sent ? <button className="btn full" onClick={sendCode}>ارسال کد تأیید</button> : (
            <>
              <div className="rounded-xl border border-[#75613e] bg-[#302535] p-3 text-[11px] text-[var(--gold)]">📩 پیامک نمایشی: کد ورود شما <b className="text-base">{sent}</b> است. (در نسخهٔ سرور، کد از درگاه پیامک ارسال می‌شود.)</div>
              <input className="field text-center text-lg tracking-[.5em]" dir="ltr" inputMode="numeric" maxLength={4} placeholder="----" value={code} onChange={(e) => setCode(e.target.value)} />
              <input className="field" placeholder="نام نمایشی" value={name} onChange={(e) => setName(e.target.value)} />
              <button className="btn full" onClick={verify}>تأیید و ادامه</button>
            </>
          )}
          <button className="text-[11px] text-[var(--purple)]" onClick={() => { setMethod(null); setSent(""); }}>← روش دیگر</button>
        </div>
      )}
      {step === 0 && method === "google" && (
        <div className="grid gap-3">
          <p className="text-[11px] leading-6 text-[var(--muted)]">حساب گوگل خود را وارد کن. (در نسخهٔ سرور با GOOGLE_CLIENT_ID پنجرهٔ رسمی گوگل باز می‌شود.)</p>
          <input className="field text-left" dir="ltr" placeholder="name@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn full" onClick={googleOk}>ادامه با گوگل</button>
          <button className="text-[11px] text-[var(--purple)]" onClick={() => setMethod(null)}>← روش دیگر</button>
        </div>
      )}
      {step === 0 && method === "guest" && (
        <div className="grid gap-3">
          <input className="field" autoFocus placeholder="نام نمایشی (مثلاً حمید)" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setStep(1)} />
          <button className="btn full" onClick={() => setStep(1)}>ادامه</button>
          <button className="text-[11px] text-[var(--purple)]" onClick={() => setMethod(null)}>← روش دیگر</button>
        </div>
      )}
      {step === 1 && (
        <>
          <AvatarBuilder value={avatar} onChange={setAvatar} />
          <button className="btn full mt-4" onClick={() => setStep(2)}>ادامه</button>
        </>
      )}
      {step === 2 && (
        <>
          <InterestPicker store={store} value={interests} onChange={setInterests} />
          <button className="btn gm-glow full mt-4" onClick={finish}>شروع بازی ({fa(interests.length)} انتخاب)</button>
        </>
      )}
      {err && <p className="mt-3 text-center text-xs text-[var(--red)]">{err}</p>}
    </Modal>
  );
}

export function InterestPicker({ store, value, onChange }: { store: Store; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {allCategories(store).map((c) => {
        const on = value.includes(c.id);
        return <button key={c.id} className={`pill !px-3 !py-2 !text-[12px] ${on ? "gold" : ""}`} onClick={() => onChange(on ? value.filter((x) => x !== c.id) : [...value, c.id])}><Icon name={c.icon} size={13} /> {c.name}</button>;
      })}
    </div>
  );
}

/* =================== پرسیدن علاقه (بعد از ورود گوگل) =================== */
export function InterestsPrompt({ store, onSave, onLater }: { store: Store; onSave: (v: string[]) => void; onLater: () => void }) {
  const [v, setV] = useState<string[]>([]);
  return (
    <Modal open onClose={onLater} title="خوش آمدی! سه موضوع مورد علاقه‌ات را انتخاب کن">
      <p className="mb-3 text-[11px] text-[var(--muted)]">با این انتخاب، موضوع‌ها و حریف‌های مناسب پیشنهاد می‌شوند. بعداً از «تنظیمات» هم قابل تغییر است.</p>
      <InterestPicker store={store} value={v} onChange={setV} />
      <div className="mt-4 flex gap-2"><button className="btn gm-glow flex-1" disabled={v.length < 3} onClick={() => onSave(v)}>ذخیره ({fa(v.length)}/۳)</button><button className="btn ghost" onClick={onLater}>بعداً</button></div>
    </Modal>
  );
}

/* =================== دعوت / مبارزهٔ مجدد =================== */
export function InviteModal({ store, invite, onAccept, onDecline }: { store: Store; invite: Invite; onAccept: () => void; onDecline: () => void }) {
  const from = store.players.find((p) => p.id === invite.from);
  const [left, setLeft] = useState(20);
  useEffect(() => {
    const t = setInterval(() => setLeft((x) => x - 1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (left <= 0) onDecline(); }, [left, onDecline]);
  if (!from) return null;
  const cat = findCategory(store, invite.category);
  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="gm-panel gm-pop gm-motion w-full max-w-sm overflow-hidden p-6 text-center">
        <div className="text-[11px] text-[var(--gold)]">{invite.kind === "rematch" ? "درخواست مبارزهٔ مجدد" : "دعوت به مسابقه"} ⚔️</div>
        <Avatar a={from.avatar} size={96} ring="#f2ca7c" className="gm-float mt-3" />
        <h3 className="mt-3 text-lg font-black">{from.name}</h3>
        <p className="text-xs text-[var(--muted)]">سطح {fa(levelOf(from.xp))} · تو را به رقابت در «{cat.name}» دعوت کرد</p>
        <div className="mx-auto mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#2f2440]"><div className="h-full bg-[var(--gold)] transition-all duration-1000" style={{ width: `${(left / 20) * 100}%` }} /></div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button className="btn gm-glow" onClick={onAccept}><Icon name="check" size={16} /> قبول و شروع</button>
          <button className="btn danger" onClick={onDecline}><Icon name="close" size={16} /> رد ({fa(left)})</button>
        </div>
      </div>
    </div>
  );
}

/* =================== اعلان کشویی (مثل پوش نوتیفیکیشن) =================== */
export function PushToast({ notice, onOpen, onClose }: { notice: Notice; onOpen: () => void; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [notice.id, onClose]);
  return (
    <div className="fixed top-3 left-1/2 z-[100] w-[min(94vw,420px)] -translate-x-1/2">
      <button className="gm-toast gm-panel flex w-full items-center gap-3 border-[#75613e] p-3.5 text-right shadow-2xl" onClick={onOpen}>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#493723] text-[var(--gold)]"><Icon name={notice.kind === "message" ? "chat" : notice.kind === "invite" ? "bolt" : "bell"} size={19} /></span>
        <span className="min-w-0 flex-1"><span className="block text-[13px] font-bold">{notice.title}</span><span className="block truncate text-[11px] text-[var(--muted)]">{notice.body}</span></span>
        <span className="text-[10px] text-[var(--purple)]">باز کن ←</span>
      </button>
    </div>
  );
}

/* =================== مجوز اعلان در اولین ورود =================== */
export function NotifyPrompt({ onDone }: { onDone: () => void }) {
  return (
    <div className="fixed right-3 bottom-3 left-3 z-[85] sm:right-auto sm:left-5 sm:w-96">
      <div className="gm-panel gm-toast p-5">
        <div className="flex items-center gap-3"><span className="text-3xl">🔔</span><div><div className="text-[14px] font-bold">اعلان‌ها را روشن کنیم؟</div><p className="text-[11px] leading-6 text-[var(--muted)]">وقتی کسی به تو پیام داد یا به مسابقه دعوتت کرد، با صدای جینگ خبرت می‌کنیم.</p></div></div>
        <div className="mt-3 flex gap-2">
          <button className="btn flex-1" onClick={async () => { await askNotifyPermission(); sfx("jingle"); onDone(); }}>بله، روشن کن</button>
          <button className="btn ghost" onClick={onDone}>بعداً</button>
        </div>
      </div>
    </div>
  );
}

/* =================== دستیار هوشمند =================== */
const KB: [RegExp, string, string?][] = [
  [/امتیاز|نمره|چطور حساب/, "هر پاسخ درست ۱۰۰ امتیاز پایه دارد، تا ۵۰ امتیاز برای سرعت، تا ۳۰ امتیاز برای زنجیرهٔ پاسخ درست و ۵۰ امتیاز پاداش اگر هر ۷ سؤال را درست بزنی."],
  [/حریف|رقابت|مسابقه|بازی/, "از «شروع رقابت» موضوع و حالت را انتخاب کن؛ می‌توانی بازیکن دلخواه را جست‌وجو و دعوت کنی یا حریف تصادفی بگیری.", "challenge"],
  [/روزانه|چالش امروز/, "چالش روزانه هر روز خودکار عوض می‌شود و در صفحهٔ خانه است. روزی یک بار می‌توانی شرکت کنی.", "home"],
  [/مدال|کاپ|جام|رویداد|تورنومنت/, "در «رویداد و چالش باز» شرکت کن؛ رتبهٔ اول مدال طلا (یا کاپ)، دوم نقره و سوم برنز می‌گیرد.", "events"],
  [/لیگ|سیمبان/, "لیگ سیمبانان مرحله‌به‌مرحله برگزار می‌شود؛ از بخش «لیگ‌ها» ثبت‌نام کن.", "leagues"],
  [/چت|پیام|گفت/, "در «گفت‌وگو» می‌توانی متن و عکس بفرستی. از تنظیمات مشخص کن همه، فقط دوستان یا هیچ‌کس پیام ندهد.", "messages"],
  [/آواتار|عینک|حجاب|سبیل/, "در «تنظیمات» آواتارساز داری: حجاب، سبیل، عینک، تاج، هدفون و رنگ‌های فانتزی.", "settings"],
  [/سکه|فروشگاه|خرید/, "سکه با مسابقه، هدیهٔ روزانه و نوشتن پست جمع می‌شود و در فروشگاه خرج می‌شود؛ ارزش پولی ندارد.", "shop"],
  [/سؤال بسازم|پیشنهاد سؤال|کارخانه/, "در «کارخانهٔ سؤال» سؤال بساز؛ پس از تأیید مدیر ۳۰ سکه می‌گیری.", "suggest"],
  [/ایمنی|برق|بی‌برق/, "سؤال‌های ایمنی برای مرور آموزشی‌اند و جای دستورالعمل مصوب سازمان را نمی‌گیرند. همیشه بی‌برق بودن را با وسیلهٔ مناسب و فرد صلاحیت‌دار تأیید کنید."],
  [/مدیر|پشتیبانی|مشکل/, "از «ارتباط با مدیر» پیام بده؛ پاسخ همان‌جا نمایش داده می‌شود.", "support"],
  [/سلام|درود|خوبی/, "سلام! من دستیار گیمیفای هستم 😊 دربارهٔ امتیاز، مسابقه، چالش روزانه، مدال‌ها، چت یا آواتار بپرس."],
];

export function Assistant({ go }: { go: (r: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [log, setLog] = useState<{ me: boolean; t: string; link?: string }[]>([{ me: false, t: "سلام! من دستیار هوشمند گیمیفای‌ام. هر سؤالی دربارهٔ بازی داری بپرس 🌟" }]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [log.length]);
  const ask = (q: string) => {
    if (!q.trim()) return;
    const hit = KB.find(([re]) => re.test(q));
    setLog((l) => [...l, { me: true, t: q }, { me: false, t: hit ? hit[1] : "این را دقیق نمی‌دانم 🤔 می‌توانی از «ارتباط با مدیر» بپرسی. دربارهٔ امتیاز، مسابقه، مدال، لیگ، چت و آواتار می‌توانم کمک کنم.", link: hit ? hit[2] : "support" }]);
    setText("");
    sfx("pop");
  };
  return (
    <div className="fixed bottom-5 left-5 z-[70]">
      {open && (
        <div className="gm-panel gm-pop mb-3 flex h-[440px] w-[min(92vw,340px)] flex-col overflow-hidden shadow-2xl">
          <div className="gm-motion flex items-center gap-2 border-b border-[var(--line)] px-4 py-3"><span className="text-2xl">🤖</span><div className="flex-1"><div className="text-[13px] font-bold">دستیار هوشمند</div><div className="text-[9px] text-[var(--green)]">● آنلاین</div></div><button onClick={() => setOpen(false)}><Icon name="close" size={16} /></button></div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {log.map((m, i) => (
              <div key={i} className={`flex ${m.me ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-6 ${m.me ? "bg-[#4a3366]" : "bg-[#2c203b]"}`}>{m.t}{m.link && <button className="mt-1 block text-[11px] text-[var(--gold)]" onClick={() => go(m.link!)}>برو به این بخش ←</button>}</div>
              </div>
            ))}
            <div ref={end} />
          </div>
          <div className="flex flex-wrap gap-1 px-3 pb-2">{["امتیاز چطور حساب می‌شود؟", "مدال چطور بگیرم؟", "چالش روزانه"].map((s) => <button key={s} className="pill" onClick={() => ask(s)}>{s}</button>)}</div>
          <div className="flex gap-2 border-t border-[var(--line)] p-2.5"><input className="field" placeholder="سؤالت را بپرس…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask(text)} /><button className="btn !px-3" onClick={() => ask(text)}><Icon name="send" size={15} /></button></div>
        </div>
      )}
      <button className="gm-glow grid size-14 place-items-center rounded-full border border-[#75613e] bg-[linear-gradient(135deg,#8960c5,#d69838)] text-2xl shadow-xl transition hover:scale-110" onClick={() => setOpen(!open)} aria-label="دستیار">🤖</button>
    </div>
  );
}
