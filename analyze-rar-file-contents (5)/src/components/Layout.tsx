import { useState, type ReactNode } from "react";
import { Avatar, Icon, fa, faDate, relTime } from "./ui";
import { logo as defaultLogo } from "../data/art";
import type { Store } from "../lib/types";
import { levelOf } from "../lib/engine";

export const NAV: { id: string; icon: string; label: string }[] = [
  { id: "home", icon: "home", label: "خانه" },
  { id: "topics", icon: "grid", label: "موضوع‌ها" },
  { id: "challenge", icon: "bolt", label: "شروع رقابت" },
  { id: "leaderboard", icon: "trophy", label: "تالار قهرمانان" },
  { id: "feed", icon: "feed", label: "فید و پست‌ها" },
  { id: "messages", icon: "chat", label: "گفت‌وگو" },
  { id: "events", icon: "flag", label: "رویداد و چالش باز" },
  { id: "rewards", icon: "gift", label: "هدیه‌ها" },
  { id: "shop", icon: "shop", label: "فروشگاه" },
  { id: "suggest", icon: "plus", label: "کارخانهٔ سؤال" },
  { id: "learn", icon: "book", label: "مرور و یادگیری" },
  { id: "players", icon: "users", label: "بازیکنان" },
  { id: "orgs", icon: "briefcase", label: "صفحه‌های سازمانی" },
  { id: "leagues", icon: "medal", label: "لیگ‌ها" },
  { id: "support", icon: "headphones", label: "ارتباط با مدیر" },
  { id: "settings", icon: "settings", label: "تنظیمات" },
  { id: "admin", icon: "shield", label: "پنل مدیریت" },
];

type Props = {
  route: string;
  go: (r: string) => void;
  store: Store;
  onLogin: () => void;
  onMusic: () => void;
  onNotice: (link: string, id: string) => void;
  onReadAll: () => void;
  children: ReactNode;
  search: string;
  onSearch: (v: string) => void;
};

export function Layout({ route, go, store, onLogin, onMusic, onNotice, onReadAll, children, search, onSearch }: Props) {
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const p = store.profile;
  const unreadMsg = store.messages.filter((m) => m.from !== "me" && !m.read).length;
  const unreadNotice = store.notices.filter((n) => !n.read).length;
  const pending = store.posts.filter((x) => x.status === "pending").length + store.stories.filter((x) => x.status === "pending").length + store.suggestions.filter((x) => x.status === "pending").length + store.tickets.filter((t) => t.status === "open").length;
  const logo = store.settings.logo || defaultLogo;
  const base = route.split("/")[0];

  return (
    <div className="min-h-screen lg:pr-[248px]">
      {open && <button className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} aria-label="بستن منو" />}

      <aside className={`fixed top-0 right-0 bottom-0 z-50 flex w-[248px] flex-col overflow-y-auto border-l border-[var(--line)] bg-[#1d1527] px-4 pt-6 pb-5 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <button className="mb-6 flex items-center gap-3 px-2 text-right" onClick={() => go("home")}>
          <img src={logo} width={44} height={44} alt="" className="rounded-xl" />
          <span>
            <span className="text-[23px] font-bold tracking-tight">{store.settings.siteTitle.replace("۲", "")}<span className="text-[var(--gold)]">۲</span></span>
            <small className="block text-[10px] leading-4 text-[var(--muted)]">{store.settings.tagline}</small>
          </span>
        </button>
        <nav className="grid gap-0.5">
          {NAV.map((n) => (
            <button key={n.id} className="gm-nav-item !py-2.5" data-active={base === n.id} onClick={() => { go(n.id); setOpen(false); }}>
              <Icon name={n.icon} size={19} />
              <span className="text-[13px]">{n.label}</span>
              {n.id === "messages" && unreadMsg > 0 && <span className="mr-auto rounded-md bg-[#7752ab] px-1.5 text-[10px]">{fa(unreadMsg)}</span>}
              {n.id === "admin" && <span className="mr-auto rounded border border-[#75613e] px-1.5 text-[9px] text-[var(--gold)]">{pending ? fa(pending) : "مدیر"}</span>}
              {n.id === "events" && <span className="mr-auto rounded border border-[#75613e] px-1.5 text-[9px] text-[var(--gold)]">زنده</span>}
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-5">
          <div className="rounded-2xl border border-[#4d395e] bg-[radial-gradient(ellipse_at_top_right,#463050,#241b30)] p-4 text-xs">
            <Icon name="target" size={24} className="mb-1.5 text-[var(--gold)]" />
            <strong>مأموریت امروز</strong>
            <p className="my-1 text-[11px] leading-6 text-[var(--muted)]">چالش روزانه را بزن و یک تجربه بنویس.</p>
            <button className="text-[11px] text-[var(--gold)]" onClick={() => go("home")}>شروع می‌کنم ←</button>
          </div>
          <p className="mt-3 text-center text-[10px] text-[#92819f]">نسخهٔ <span className="text-[#c6a8da]">۰٫۳</span> · {fa(store.players.filter((x) => x.kind === "staff").length)} کادر آنلاین</p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between gap-3 border-b border-[var(--line)] bg-[#191220ee] px-3 backdrop-blur sm:px-7">
        <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="منو"><Icon name="menu" size={24} /></button>
        <div className="hidden flex-1 items-center gap-3 rounded-[10px] border border-[#33283d] bg-[#231a2c] px-3.5 py-2 md:flex md:max-w-[340px]">
          <Icon name="search" size={17} className="text-[#9f8db2]" />
          <input className="w-full min-w-0 border-0 bg-transparent text-xs outline-none" placeholder="جست‌وجوی موضوع…" value={search} onChange={(e) => onSearch(e.target.value)} onFocus={() => go("topics")} />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <button className={`grid size-10 place-items-center rounded-xl border ${store.music ? "border-[#75613e] bg-[#302535] text-[var(--gold)]" : "border-[var(--line)] text-[var(--muted)]"}`} onClick={onMusic} title={store.music ? "قطع موسیقی زمینه" : "پخش موسیقی زمینه"} data-silent="1">
            <Icon name={store.music ? "music" : "mute"} size={19} />
          </button>
          <div className="relative">
            <button className="relative grid size-10 place-items-center rounded-xl border border-[var(--line)] text-[var(--muted)] hover:text-white" onClick={() => setBell(!bell)} aria-label="اعلان‌ها">
              <Icon name="bell" size={19} />
              {unreadNotice > 0 && <span className="absolute -top-1 -left-1 grid min-w-5 place-items-center rounded-full bg-[var(--gold)] px-1 text-[10px] font-bold text-[#302132]">{fa(unreadNotice)}</span>}
            </button>
            {bell && (
              <div className="gm-panel gm-pop absolute top-12 left-0 z-50 w-[310px] overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5 text-[13px] font-bold">
                  اعلان‌ها
                  <button className="text-[11px] text-[var(--purple)]" onClick={onReadAll}>خواندن همه</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {store.notices.slice(0, 25).map((n) => (
                    <button key={n.id} className={`flex w-full gap-2.5 border-b border-[#2f2440] px-4 py-3 text-right hover:bg-[#2c2039] ${n.read ? "opacity-60" : ""}`} onClick={() => { setBell(false); onNotice(n.link, n.id); }}>
                      <Icon name={n.kind === "message" ? "chat" : n.kind === "invite" ? "bolt" : n.kind === "reward" ? "gift" : "bell"} size={17} className="mt-0.5 text-[var(--gold)]" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12px] font-bold">{n.title}</span>
                        <span className="block truncate text-[11px] text-[var(--muted)]">{n.body}</span>
                        <span className="text-[9px] text-[#8b7b99]">{relTime(n.at)}</span>
                      </span>
                    </button>
                  ))}
                  {!store.notices.length && <p className="px-4 py-8 text-center text-xs text-[var(--muted)]">اعلانی نداری.</p>}
                </div>
              </div>
            )}
          </div>
          <div className="hidden items-center gap-1.5 rounded-[9px] border border-[#594335] bg-[#302535] px-3 py-1.5 text-[13px] font-bold text-[var(--gold)] sm:flex">
            <Icon name="coin" size={17} /> {fa(p?.coins ?? 0)}
          </div>
          {p ? (
            <button className="flex items-center gap-2 border-r border-[var(--line)] pr-3 text-xs" onClick={() => go("settings")}>
              <Avatar a={p.avatar} size={38} online />
              <span className="hidden text-right sm:block">
                {p.name}
                <small className="block text-[9px] text-[var(--muted)]">سطح {fa(levelOf(p.xp))} · {fa(p.xp)} تجربه</small>
              </span>
            </button>
          ) : (
            <button className="btn gm-glow !min-h-10 !px-4" onClick={onLogin}>
              <Icon name="user" size={17} /> ورود / ثبت‌نام
            </button>
          )}
        </div>
      </header>

      {store.settings.banners.length > 0 && base === "home" && (
        <div className="flex flex-wrap gap-2 px-4 pt-3 sm:px-8">
          {store.settings.banners.map((b) => (
            <button key={b.id} className="gm-pop flex flex-1 items-center gap-2 rounded-xl border px-4 py-2 text-right text-[12px]" style={{ borderColor: `${b.color}66`, background: `${b.color}14`, color: b.color }} onClick={() => b.link && go(b.link.replace("#", ""))}>
              <Icon name="spark" size={15} /> {b.text}
            </button>
          ))}
        </div>
      )}

      <main className="mx-auto min-h-[80vh] w-full max-w-[1500px] px-3 pt-6 pb-24 sm:px-8">{children}</main>
      <footer className="border-t border-[var(--line)] px-8 py-5 text-center text-[10px] text-[#8b7b99]">
        {store.settings.siteTitle} · {faDate(Date.now())} · امتیازها و سکه‌ها ارزش پولی ندارند.
      </footer>
    </div>
  );
}
