import { categories as baseCategories, questions as baseQuestions } from "../data/quiz";
import type { Category, Question } from "../data/quiz";
import type { GameEvent, MatchState, Medal, Mode, Player, Store } from "./types";
import { uid } from "./store";

export const ROUNDS = 7;
export const REVEAL_MS = 4200;
export const INTRO_MS = 3800;
/** مراحل ورود سؤال: پس‌زمینه ← سؤال ← گزینه‌ها ← شروع زمان */
export const STAGE_MS = { question: 380, options: 900, timer: 1400 };

export const rnd = (n: number) => Math.floor(Math.random() * n);
export const pick = <T,>(list: T[]) => list[rnd(list.length)];
export const shuffle = <T,>(list: T[]): T[] => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function allCategories(store: Store): Category[] {
  const hidden = new Set(store.hiddenCategories);
  return [...baseCategories, ...store.customCategories]
    .filter((c) => !hidden.has(c.id))
    .map((c) => ({ ...c, image: store.categoryImages[c.id] || c.image }));
}
export const findCategory = (store: Store, id: string) =>
  allCategories(store).find((c) => c.id === id) || { id, name: "موضوع", subtitle: "", icon: "book", color: "#ac8fd6", tag: "", safety: 0 };

export function activeQuestions(store: Store): Question[] {
  const removed = new Set(store.removed);
  return [...baseQuestions, ...store.custom].filter((q) => !removed.has(q.id));
}

export function countByCategory(store: Store): Record<string, number> {
  const map: Record<string, number> = {};
  for (const c of allCategories(store)) map[c.id] = 0;
  for (const q of activeQuestions(store)) map[q.category] = (map[q.category] || 0) + 1;
  return map;
}

/** تولید عدد شبه‌تصادفی ثابت برای یک تاریخ؛ سؤال‌های روزانه هر روز خودکار عوض می‌شوند */
function seeded(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

export function dailyQuestions(store: Store, day: string): Question[] {
  const all = activeQuestions(store);
  const override = store.settings.dailyOverride[day];
  const r = seeded(day);
  const pool = [...all].sort(() => r() - 0.5);
  const count = Math.max(1, Math.min(10, store.settings.dailyCount));
  const chosen = pool.slice(0, count);
  if (override) {
    const q = all.find((x) => x.id === override);
    if (q) return [q, ...chosen.filter((x) => x.id !== q.id)].slice(0, count);
  }
  return chosen;
}

function prepare(q: Question): Question {
  const order = shuffle([0, 1, 2, 3]);
  return { ...q, options: order.map((i) => q.options[i]), correct: order.indexOf(q.correct) };
}

export function createMatch(
  store: Store,
  category: string,
  mode: Mode,
  opts: { rival?: Player | null; eventId?: string; questions?: Question[] } = {}
): MatchState {
  let chosen: Question[];
  if (opts.questions?.length) chosen = opts.questions;
  else {
    const pool = activeQuestions(store).filter((q) => q.category === category);
    chosen = shuffle(pool.length >= ROUNDS ? pool : activeQuestions(store)).slice(0, ROUNDS);
  }
  const questions = chosen.map((q) => prepare({ ...q, seconds: q.seconds || store.settings.roundSeconds }));
  const now = Date.now();
  const solo = mode === "practice" || mode === "daily";
  let rival: MatchState["rival"] = null;
  if (!solo) {
    const p =
      opts.rival ||
      pick(store.players.filter((x) => (x.kind === "bot" || x.kind === "staff") && !x.banned)) ||
      store.players[0];
    const acc = p.kind === "bot" ? store.settings.botAccuracy + (p.accuracy - 0.65) : p.accuracy;
    rival = { id: p.id, name: p.name, avatar: p.avatar, accuracy: Math.max(0.3, Math.min(0.95, mode === "friendly" ? acc - 0.12 : acc)) };
  }
  const allow = store.settings.lifelines[mode] || { fifty: true, hint: true, time: true };
  return {
    id: uid("m"),
    category,
    mode,
    eventId: opts.eventId,
    questions,
    round: 0,
    phase: solo ? "playing" : "intro",
    roundAt: solo ? now + STAGE_MS.timer : now + INTRO_MS + STAGE_MS.timer,
    score: 0,
    rivalScore: 0,
    rival,
    answers: [],
    rivalAnswers: [],
    lifelines: { fifty: allow.fifty ? (solo ? 2 : 1) : 0, hint: allow.hint ? 1 : 0, time: allow.time ? 1 : 0 },
    eliminated: [],
    hint: "",
    bonusSeconds: 0,
    rivalPlan: null,
    reactions: [],
  };
}

export function scoreFor(correct: boolean, elapsed: number, seconds: number, streak: number, perfectFinal: boolean) {
  if (!correct) return 0;
  const speed = Math.max(0, Math.min(50, Math.round(50 * (1 - elapsed / (seconds * 1000)))));
  return 100 + speed + Math.min(30, streak * 10) + (perfectFinal ? 50 : 0);
}

export function streakOf(answers: { correct: boolean }[]) {
  let s = 0;
  for (let i = answers.length - 1; i >= 0; i--) {
    if (!answers[i].correct) break;
    s++;
  }
  return s;
}

export const questionSeconds = (m: MatchState) => m.questions[m.round].seconds + m.bonusSeconds;

export function planRival(m: MatchState, store: Store): { at: number; choice: number } | null {
  if (!m.rival) return null;
  const q = m.questions[m.round];
  const min = store.settings.botDelayMin;
  const max = Math.min(store.settings.botDelayMax, q.seconds * 1000 - 600);
  const delay = min + rnd(Math.max(1, max - min));
  const hit = Math.random() < m.rival.accuracy;
  const wrongs = [0, 1, 2, 3].filter((i) => i !== q.correct);
  return { at: m.roundAt + delay, choice: hit ? q.correct : pick(wrongs) };
}

export function hintFor(q: Question) {
  const ans = q.options[q.correct];
  const first = ans.trim().charAt(0);
  const words = ans.trim().split(/\s+/).length;
  return `پاسخ درست با «${first}» شروع می‌شود و ${words === 1 ? "یک واژه" : `${words} واژه`} دارد.`;
}

export function rewardFor(correctCount: number, win: 1 | 0 | -1, daily: boolean) {
  const w = win === 1 ? 1 : 0;
  return { xp: correctCount * 10 + w * 30, coins: correctCount * 2 + w * 20 + (daily ? 25 : 0), cups: w, daily };
}

export const eloDelta = (mine: number, rival: number, actual: number) =>
  Math.round(24 * (actual - 1 / (1 + 10 ** ((rival - mine) / 400))));

export const levelOf = (xp: number) => Math.max(1, Math.floor(Math.sqrt(xp / 45)) + 1);
export const levelFloor = (level: number) => Math.round(45 * (level - 1) ** 2);

/** مدال رویداد بر اساس رتبه در جدول رویداد */
export function medalFor(store: Store, ev: GameEvent, score: number): Medal | null {
  const others = ev.results.map((r) => r.score).sort((a, b) => b - a);
  const rank = others.filter((s) => s > score).length + 1;
  const tier: Medal["tier"] | null = rank === 1 && ev.hasCup ? "cup" : rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : score >= 700 ? "bronze" : null;
  if (!tier) return null;
  const img = ev.medals[tier] || store.settings.defaultMedals[tier];
  return { id: uid("medal"), eventId: ev.id, eventTitle: ev.title, tier, image: img, at: Date.now(), score };
}

export const eventLive = (e: GameEvent) => e.active && e.startsAt <= Date.now() && e.endsAt >= Date.now();
