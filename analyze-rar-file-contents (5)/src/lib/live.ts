import { getStore, lessonPool, notify, setStore, uid, canChat } from "./store";
import { pushNotify } from "./sound";
import { allCategories, pick, rnd } from "./engine";
import { postArt } from "../data/art";
import type { Invite, Player } from "./types";

type Handlers = { isBusy: () => boolean; go: (route: string) => void };

const REPLIES = [
  "سلام! خوبی؟ 😊",
  "آره حتماً، یه مسابقه بدیم؟",
  "ممنون از پیامت 🙏",
  "امروز چالش روزانه رو زدی؟",
  "من الان تو لیگ سیمبانانم ⚡",
  "عالیه! موفق باشی 🌟",
  "این سؤال ایمنی دیروز خیلی سخت بود!",
  "عکس قشنگی بود 👌",
];
const STATUS = ["امروز ۷ از ۷ زدم! 🔥", "کی حریف منه؟ ⚔️", "چالش روزانه رو از دست ندید ☀️", "یک نکتهٔ ایمنی: همیشه تأیید بی‌برقی 🛡️", "لیگ سیمبانان هیجان‌انگیزه ⚡", "دنبال همبازی برای دنیای برق هستم"];
const STORY_COLORS = ["#8960c5", "#d69838", "#2f8f83", "#b24a5c", "#2c4f7c"];

const staffList = () => getStore().players.filter((p) => p.kind === "staff" && !p.banned);

export function sendInvite(from: Player, category: string, kind: Invite["kind"] = "invite", eventId?: string) {
  const inv: Invite = { id: uid("inv"), from: from.id, category, kind, at: Date.now(), eventId };
  setStore((s) => ({ ...s, invites: [...s.invites.filter((i) => i.from !== from.id), inv] }));
  notify({ title: kind === "rematch" ? "درخواست مبارزهٔ مجدد" : "دعوت به مسابقه", body: `${from.name} تو را به رقابت دعوت کرد.`, link: "invite", kind: "invite" });
  pushNotify("دعوت به مسابقه ⚔️", `${from.name} تو را به رقابت دعوت کرد.`);
}

/** پاسخ خودکار طرف گفت‌وگو (کادر زنده) */
export function scheduleReply(threadId: string, go: (r: string) => void) {
  const s = getStore();
  const p = s.players.find((x) => x.id === threadId);
  if (!p || p.kind === "bot") return;
  setTimeout(() => {
    const st = getStore();
    if (!canChat(st, p).ok) return;
    const text = pick(REPLIES);
    setStore((x) => ({ ...x, messages: [...x.messages, { id: uid("msg"), thread: p.id, from: p.id, text, at: Date.now(), read: false }] }));
    notify({ title: `پیام جدید از ${p.name}`, body: text, link: `messages/${p.id}`, kind: "message" });
    pushNotify(`پیام جدید از ${p.name}`, text, () => go(`messages/${p.id}`));
  }, 2500 + rnd(4000));
}

export function startLive(h: Handlers) {
  let tick = 0;
  const timer = setInterval(() => {
    tick++;
    const s = getStore();
    const now = Date.now();

    /* انتشار زمان‌بندی‌شده */
    if (s.posts.some((p) => p.scheduledAt && p.scheduledAt <= now && p.status === "pending")) {
      setStore((x) => ({ ...x, posts: x.posts.map((p) => (p.scheduledAt && p.scheduledAt <= now && p.status === "pending" ? { ...p, status: "approved", at: now, scheduledAt: undefined } : p)) }));
    }

    if (!s.settings.staffActivity) return;
    const staff = staffList();
    if (!staff.length) return;

    /* کادر زنده در حال مسابقه: امتیازها تکان می‌خورند */
    setStore((x) => ({
      ...x,
      players: x.players.map((p) =>
        (p.kind === "staff" || p.kind === "bot") && Math.random() < 0.25
          ? { ...p, xp: p.xp + 10 + rnd(60), weekXp: p.weekXp + 10 + rnd(60), wins: p.wins + (Math.random() < 0.5 ? 1 : 0), played: p.played + 1, cups: p.cups + (Math.random() < 0.3 ? 1 : 0), lastSeen: now }
          : p
      ),
      completedMatches: x.completedMatches + (Math.random() < 0.6 ? 1 : 0),
    }));

    /* هر ~۲ دقیقه یک پست تازه */
    if (tick % 6 === 2) {
      const a = pick(staff);
      const cats = allCategories(s);
      setStore((x) => ({
        ...x,
        posts: [
          { id: uid("post"), author: a.name, authorId: a.id, avatar: a.avatar, category: pick(cats).id, body: Math.random() < 0.5 ? pick(lessonPool) : pick(STATUS), media: Math.random() < 0.35 ? pick(postArt) : "", likes: rnd(12), liked: false, saved: false, comments: [], at: now, status: "approved" as const, demo: true },
          ...x.posts,
        ].slice(0, 150),
      }));
    }

    /* استوری وضعیت */
    if (tick % 9 === 4) {
      const a = pick(staff);
      setStore((x) => ({
        ...x,
        stories: [{ id: uid("story"), author: a.name, avatar: a.avatar, text: pick(STATUS), image: "", color: pick(STORY_COLORS), at: now, status: "approved" as const, views: rnd(30) }, ...x.stories].slice(0, 30),
      }));
    }

    /* دعوت به مسابقه (با احترام به تنظیمات کاربر) */
    if (s.profile && s.profile.chatPrivacy !== "off" && tick % 14 === 7 && !h.isBusy() && !s.invites.length) {
      const a = pick(staff);
      sendInvite(a, pick(s.profile.interests.length ? s.profile.interests : ["general"]));
    }
  }, 20000);
  return () => clearInterval(timer);
}
