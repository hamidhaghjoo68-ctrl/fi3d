import { useCallback, useEffect, useState } from "react";
import type { GameEvent, League, MedalSet, Notice, Org, Player, Post, Profile, Settings, Store, Story } from "./types";
import { botSeed, categories, leagueSeed, tournamentSeed } from "../data/quiz";
import { postArt } from "../data/art";
import { presetCfgs, randomCfg } from "./avatar";
import { setMusic, setSfx, setVolume } from "./sound";

const KEY = "gamify2-store-v2";
export const uid = (p = "id") => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const DAY = 86400000;

/* ---------- مدال و کاپ پیش‌فرض (قابل تعویض در پنل) ---------- */
const medalSvg = (c1: string, c2: string, label: string) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120"><path d="M30 0h16l10 34H40zM70 0H54L44 34h16z" fill="#8960c5"/><path d="M38 0h8l8 30h-8zM62 0h-8l-8 30h8z" fill="#b495f0"/><defs><radialGradient id="m" cx=".35" cy=".3"><stop stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs><circle cx="50" cy="78" r="36" fill="url(#m)" stroke="${c2}" stroke-width="3"/><circle cx="50" cy="78" r="27" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-dasharray="3 4"/><text x="50" y="88" font-size="28" text-anchor="middle" font-family="Tahoma" font-weight="bold" fill="#fff" stroke="${c2}" stroke-width=".8">${label}</text></svg>`
  );
const cupSvg =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120"><defs><linearGradient id="c" x2="1"><stop stop-color="#ffe8a2"/><stop offset=".5" stop-color="#f2ca7c"/><stop offset="1" stop-color="#b7862f"/></linearGradient></defs><path d="M22 10h56v22c0 22-12 36-28 36S22 54 22 32z" fill="url(#c)"/><path d="M22 18H8v8c0 12 8 20 18 20M78 18h14v8c0 12-8 20-18 20" stroke="#d69838" stroke-width="6" fill="none"/><rect x="44" y="66" width="12" height="18" fill="#d69838"/><rect x="28" y="84" width="44" height="12" rx="3" fill="#8960c5"/><rect x="22" y="96" width="56" height="14" rx="4" fill="#453653"/><path d="m50 22 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" fill="#fff" opacity=".85"/></svg>`
  );
export const DEFAULT_MEDALS: MedalSet = {
  gold: medalSvg("#ffd76a", "#b7862f", "۱"),
  silver: medalSvg("#eef1f6", "#8b93a7", "۲"),
  bronze: medalSvg("#f0b27a", "#9a5b2c", "۳"),
  cup: cupSvg,
};
export const eventLogo = (color: string, glyph: string) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="l" x2="1" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#241b30"/></linearGradient></defs><path d="M40 3 73 20v40L40 77 7 60V20z" fill="url(#l)" stroke="${color}" stroke-width="2"/><text x="40" y="50" font-size="30" text-anchor="middle">${glyph}</text></svg>`
  );

/* ---------- داده‌های اولیه ---------- */
const STAFF = ["سارا مهندس","امید رهنما","مریم دانش","علی پیشرو","زهرا نوری","محمد آزما","فاطمه مهر","حسین کاوش","نرگس روشن","رضا فرهیخته","لیلا امید","مهدی سپهر","الهام آوا","جواد نیکو","شیرین تابان","بهزاد راستین","سمیرا ژرف","کاوه دلیر","پریسا مهتاب","آرمان پویا"];
const MEMBERS = [
  ["مهندس کاظمی", "barq"],["سیمبان رضایی", "barq"],["بهره‌بردار موسوی", "barq"],["سرپرست کریمی", "barq"],["تکنسین احمدی", "barq"],
  ["نگار ایمن", "safety"],["پدرام محتاط", "safety"],["کیمیا نجات", "safety"],
] as const;

function seedPlayers(): Player[] {
  const now = Date.now();
  const staff: Player[] = STAFF.map((name, i) => ({
    id: `staff-${i + 1}`, name, avatar: i % 3 === 0 ? presetCfgs[i % presetCfgs.length] : i % 10, bio: "عضو کادر زندهٔ گیمیفای؛ هر روز مسابقه می‌دهم و تجربه می‌نویسم.",
    xp: 3200 - i * 120, cups: 40 - i, rating: 1320 - i * 9, wins: 60 - i * 2, played: 110 - i * 3, weekXp: 420 - i * 13,
    org: "", publicVisible: true, chatPrivacy: "all", kind: "staff", accuracy: 0.72 + (i % 5) * 0.03, banned: false, lastSeen: now - i * 60000,
  }));
  const bots: Player[] = botSeed.map((b, i) => ({
    id: `computer-${i + 1}`, name: b.name, avatar: randomCfg(), bio: "حریف رایانه‌ای گیمیفای", xp: 900 + i * 55, cups: 8 + i, rating: 1000 + Math.round(b.accuracy * 200),
    wins: 20 + i, played: 50 + i * 2, weekXp: 90 + i * 7, org: "", publicVisible: true, chatPrivacy: "off", kind: "bot", accuracy: b.accuracy, banned: false, lastSeen: now,
  }));
  const members: Player[] = MEMBERS.map(([name, org], i) => ({
    id: `member-${i + 1}`, name, avatar: presetCfgs[(i + 3) % presetCfgs.length], bio: "عضو صفحهٔ سازمانی", xp: 1400 - i * 80, cups: 15 - i, rating: 1100 - i * 6,
    wins: 30 - i, played: 60 - i, weekXp: 160 - i * 9, org, publicVisible: false, chatPrivacy: "friends", kind: "member", accuracy: 0.7, banned: false, lastSeen: now - i * 400000,
  }));
  return [...staff, ...bots, ...members];
}

const LESSONS = [
  "پیش از شروع یک کار گروهی، نتیجهٔ مورد انتظار را در یک جمله مشترک بنویسید. برداشت یکسان از هدف، دوباره‌کاری را کمتر می‌کند.",
  "گزارش تحویل شیفت وقتی مفید است که کار انجام‌شده، کار باقی‌مانده و مسئول پیگیری را جدا بیان کند.",
  "مشاهده را از تفسیر جدا کنید: «ساعت ۱۰ پیام خطا دیده شد» با «دستگاه خراب است» یکسان نیست.",
  "بعد از یک اشتباه، مسیر وقوع آن را بررسی کنید. پیدا کردن نقطهٔ قابل اصلاح از سرزنش افراد آموزنده‌تر است.",
  "قبل از هر کار روی تابلو برق، یک بار با همکار چک‌لیست را بلند بخوانید. 🛡️",
  "قهرمان واقعی، سالم برمی‌گردد. خاموش بودن ظاهری دستگاه، بی‌برق بودن آن را ثابت نمی‌کند.",
  "برای یادگیری یک مهارت، یک تمرین کوچک و تکرارپذیر تعریف کنید؛ پیشرفت‌های کوچک قابل مشاهده‌اند.",
  "در جلسه، تصمیم‌ها را همراه با مسئول انجام و موعد پیگیری ثبت کنید.",
  "توضیح پاسخ درست به اندازهٔ خود سؤال ارزش دارد. بنویسید چرا یک گزینه درست است.",
  "امروز ۷ از ۷ در دنیای برق! کسی هست رقابت کنیم؟ ⚡",
  "یک واژهٔ جدید را در یک جمله به کار ببرید. کاربرد واژه به یادآوری آن کمک می‌کند.",
];
export const lessonPool = LESSONS;

function seedPosts(players: Player[]): Post[] {
  const now = Date.now();
  return LESSONS.slice(0, 7).map((body, i) => {
    const p = players[i];
    return {
      id: `post-seed-${i}`, author: p.name, authorId: p.id, avatar: p.avatar, category: ["work", "work", "work", "work", "safety", "safety", "general"][i],
      body, media: i % 2 === 0 ? postArt[i % postArt.length] : "", likes: 5 + ((i * 17) % 40), liked: false, saved: false,
      comments: i === 0 ? [{ id: "c1", author: players[3].name, avatar: players[3].avatar, body: "دقیقاً! ما هم همین روش را اجرا کردیم.", at: now - 3600000 }] : [],
      at: now - i * 5400000, status: "approved", demo: true,
    };
  });
}

function seedStories(players: Player[]): Story[] {
  const colors = ["#8960c5", "#d69838", "#2f8f83", "#b24a5c", "#2c4f7c"];
  return players.slice(0, 5).map((p, i) => ({
    id: `story-${i}`, author: p.name, avatar: p.avatar, text: ["امروز لیگ سیمبانان شروع شد ⚡", "۷ از ۷ ایمنی! 🛡️", "یک نکته: همیشه تأیید بی‌برقی", "کی حریف من می‌شه؟ 😄", "چالش روزانه رو از دست نده!"][i],
    image: "", color: colors[i], at: Date.now() - i * 3600000, status: "approved", views: 12 + i * 7,
  }));
}

function seedEvents(): { events: GameEvent[]; leagues: League[] } {
  const now = Date.now();
  const L = leagueSeed[0];
  const league: League = {
    id: L?.id || "league-1", title: L?.title || "سیمبانان", org: "barq", description: L?.description || "لیگ سیمبانان", capacity: L?.capacity || 100, status: "open",
    logo: eventLogo("#f2ca7c", "⚡"), members: [], startsAt: now - DAY, endsAt: now + 60 * DAY,
  };
  const rounds: GameEvent[] = tournamentSeed.slice(0, 8).map((t, i) => ({
    id: t.id, title: t.title, category: t.category, kind: "league", startsAt: now - DAY + i * DAY * 2, endsAt: now + DAY * (2 + i * 2), description: t.description,
    logo: league.logo, medals: {}, hasCup: i === 7, leagueId: league.id, org: "barq", active: true, results: [],
  }));
  const open: GameEvent[] = [
    { id: "ev-safety-week", title: "چالش هفتگی ایمنی", category: "safety", kind: "challenge", startsAt: now - DAY, endsAt: now + 7 * DAY, description: "هفت سؤال ایمنی؛ مدال طلا برای ۹۰۰ امتیاز به بالا.", logo: eventLogo("#a98cf7", "🛡️"), medals: {}, hasCup: false, active: true, results: [] },
    { id: "ev-electric-cup", title: "تورنومنت جام برق", category: "electric", kind: "tournament", startsAt: now - DAY, endsAt: now + 14 * DAY, description: "رقابت تخصصی دنیای برق با جام قهرمانی.", logo: eventLogo("#f8c56c", "🏆"), medals: {}, hasCup: true, active: true, results: [] },
    { id: "ev-general-open", title: "چالش باز اطلاعات عمومی", category: "general", kind: "event", startsAt: now - DAY, endsAt: now + 10 * DAY, description: "برای همه باز است؛ هر روز یک بار شرکت کن.", logo: eventLogo("#7cd7b6", "🌍"), medals: {}, hasCup: false, active: true, results: [] },
  ];
  const names = STAFF.slice(0, 6);
  for (const e of [...open, ...rounds.slice(0, 2)]) e.results = names.map((n, i) => ({ playerId: `staff-${i + 1}`, name: n, score: 1080 - i * 95 - (e.id.length % 5) * 10, at: now - i * 3600000 }));
  return { events: [...open, ...rounds], leagues: [league] };
}

const seedOrgs = (): Org[] => [
  { id: "barq", name: "شرکت توزیع برق", description: "صفحهٔ سازمانی همکاران توزیع برق؛ فقط اعضا می‌بینند و می‌توانند پیام دهند.", logo: eventLogo("#f8c56c", "⚡"), color: "#f8c56c", private: true, posts: [{ id: "op1", body: "لیگ سیمبانان آغاز شد؛ همه همکاران ثبت‌نام کنند.", at: Date.now() - 7200000 }] },
  { id: "safety", name: "باشگاه ایمنی", description: "جمع علاقه‌مندان ایمنی کار؛ عضویت با تأیید مدیر.", logo: eventLogo("#a98cf7", "🛡️"), color: "#a98cf7", private: true, posts: [] },
  { id: "public-club", name: "باشگاه دانایی", description: "صفحهٔ عمومی برای همه.", logo: eventLogo("#7cd7b6", "📚"), color: "#7cd7b6", private: false, posts: [{ id: "op2", body: "هر جمعه یک مسابقهٔ ویژه داریم!", at: Date.now() - 86400000 }] },
];

const allModes = (on = true) => ({ fifty: on, hint: on, time: on });
export const defaultSettings = (): Settings => ({
  siteTitle: "گیمیفای ۲", tagline: "هر بازی، یک قدم به جلو", logo: "", banners: [{ id: "b1", text: "لیگ سیمبانان آغاز شد ⚡ همین حالا ثبت‌نام کن", link: "leagues", color: "#f2ca7c" }],
  lifelines: { practice: allModes(), computer: allModes(), friendly: allModes(), event: { fifty: true, hint: false, time: true }, daily: { fifty: false, hint: true, time: false } },
  dailyOverride: {}, dailyCount: 5, botEnabled: true, botAccuracy: 0.65, botDelayMin: 2000, botDelayMax: 8000, staffActivity: true,
  moderatePosts: true, moderateStories: true, chatEnabled: true, shopEnabled: true, loginMethods: { guest: true, phone: true, google: true },
  languages: [{ id: "fa", name: "فارسی", active: true }, { id: "en", name: "English", active: false }, { id: "ar", name: "العربية", active: false }],
  defaultMedals: DEFAULT_MEDALS, welcome: "اینجا هر تجربه، شروع یک یادگیری است.", roundSeconds: 25,
});

export const emptyStore = (): Store => {
  const players = seedPlayers();
  const { events, leagues } = seedEvents();
  return {
    profile: null, players, stats: {}, reviews: [], history: [], posts: seedPosts(players), stories: seedStories(players), messages: [], notices: [], invites: [],
    events, leagues, orgs: seedOrgs(), tickets: [], resources: [
      { id: "r1", title: "استاندارد OSHA 1910.333 — ایمنی کار با برق", url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.333", kind: "لینک", category: "safety" },
      { id: "r2", title: "راهنمای ورود سؤال با اکسل", url: "#admin", kind: "راهنما", category: "general" },
    ],
    suggestions: [], audit: [{ id: "a0", admin: "کاظم", action: "save-tournament", at: Date.now() - 3600000 }], medals: [], custom: [], removed: [], customCategories: [], categoryImages: {},
    hiddenCategories: [], settings: defaultSettings(), openMatch: null, dailyDone: {}, rewardDays: [], sound: true, music: false, volume: 0.35, admin: false, adminName: "مدیر",
    notifAsked: false, completedMatches: 35,
  };
};

export function makeProfile(name: string, avatar: Profile["avatar"], interests: string[], provider: Profile["provider"], extra: Partial<Profile> = {}): Profile {
  return {
    id: uid("u"), name: name.trim() || "میهمان گیمیفای", avatar, bio: "هر روز یک چیز تازه یاد می‌گیرم.", provider, xp: 0, coins: 50, cups: 0, rating: 1000, streak: 0, lastDaily: "",
    played: 0, wins: 0, interests: interests.length ? interests : [categories[0].id], interestsSet: interests.length > 0, chatPrivacy: "all", friends: [], org: "",
    createdAt: Date.now(), inventory: [], title: "", ...extra,
  };
}

function load(): Store {
  const base = emptyStore();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      ...base, ...parsed,
      settings: { ...base.settings, ...(parsed.settings || {}), lifelines: { ...base.settings.lifelines, ...(parsed.settings?.lifelines || {}) }, defaultMedals: { ...DEFAULT_MEDALS, ...(parsed.settings?.defaultMedals || {}) } },
    };
  } catch {
    return base;
  }
}

let memory: Store = typeof window === "undefined" ? emptyStore() : load();
const listeners = new Set<(s: Store) => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function applyAudio(s: Store) {
  setSfx(s.sound);
  setVolume(s.volume);
}
applyAudio(memory);

export const getStore = () => memory;

export function setStore(updater: (s: Store) => Store) {
  const prev = memory;
  memory = updater(memory);
  if (prev.sound !== memory.sound || prev.volume !== memory.volume) applyAudio(memory);
  if (prev.music !== memory.music) setMusic(memory.music);
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(memory));
    } catch {
      /* حافظهٔ مرورگر پر است؛ داده در همین نشست نگه داشته می‌شود */
    }
  }, 250);
  listeners.forEach((fn) => fn(memory));
}

export function useStore() {
  const [state, setState] = useState<Store>(memory);
  useEffect(() => {
    listeners.add(setState);
    setState(memory);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  const update = useCallback((fn: (s: Store) => Store) => setStore(fn), []);
  return [state, update] as const;
}

export function resetStore() {
  setStore(() => emptyStore());
}

export function notify(n: Omit<Notice, "id" | "at" | "read">) {
  setStore((s) => ({ ...s, notices: [{ ...n, id: uid("n"), at: Date.now(), read: false }, ...s.notices].slice(0, 80) }));
}

export function audit(action: string) {
  setStore((s) => ({ ...s, audit: [{ id: uid("a"), admin: s.adminName, action, at: Date.now() }, ...s.audit].slice(0, 200) }));
}

/** آیا کاربر فعلی می‌تواند این بازیکن را ببیند/پیام دهد؟ (محرمانگی سازمانی) */
export function canSee(s: Store, p: Player) {
  if (p.banned) return false;
  if (p.publicVisible) return true;
  return !!s.profile?.org && s.profile.org === p.org;
}
export function canChat(s: Store, p: Player): { ok: boolean; reason?: string } {
  if (!s.settings.chatEnabled) return { ok: false, reason: "گفت‌وگو توسط مدیر غیرفعال شده است." };
  if (!s.profile) return { ok: false, reason: "برای گفت‌وگو ابتدا وارد شو." };
  if (s.profile.chatPrivacy === "off") return { ok: false, reason: "گفت‌وگوی تو در تنظیمات خاموش است." };
  if (!canSee(s, p)) return { ok: false, reason: "این کاربر عضو صفحهٔ سازمانی محرمانه است." };
  if (p.chatPrivacy === "off") return { ok: false, reason: "این کاربر گفت‌وگو را بسته است." };
  if (p.chatPrivacy === "friends" && !s.profile.friends.includes(p.id)) return { ok: false, reason: "این کاربر فقط با دوستانش گفت‌وگو می‌کند." };
  return { ok: true };
}

export const today = () => new Date().toISOString().slice(0, 10);
export const DAY_MS = DAY;
