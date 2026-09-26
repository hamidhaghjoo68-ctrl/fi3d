import { bgMusic, sfxClick, sfxCorrect, sfxWarning, sfxWrong } from "../data/audio";

/**
 * دو کانال مستقل:
 *  ۱) موسیقی زمینه (دکمهٔ بالای صفحه فقط همین را قطع/وصل می‌کند)
 *  ۲) افکت‌ها (از تنظیمات قطع/وصل می‌شوند)
 */
type Sfx = "tap" | "nav" | "correct" | "wrong" | "warn" | "whoosh" | "reveal" | "pop" | "win" | "lose" | "coin" | "jingle" | "emoji" | "tick";

const state = { sfx: true, music: false, volume: 0.35 };
let ctx: AudioContext | null = null;
let musicEl: HTMLAudioElement | null = null;
const cache = new Map<string, HTMLAudioElement>();

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx?.state === "suspended") void ctx.resume();
  return ctx;
}

function synth(freqs: number[], dur: number, type: OscillatorType, gainMul = 0.5, gap = 0.7) {
  const a = ac();
  if (!a) return;
  freqs.forEach((f, i) => {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.value = f;
    const t = a.currentTime + i * dur * gap;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.01, state.volume * gainMul), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.03);
  });
}

function sample(src: string, vol = 1, fallback?: () => void) {
  try {
    let el = cache.get(src);
    if (!el) {
      el = new Audio(src);
      cache.set(src, el);
    }
    const node = el.cloneNode(true) as HTMLAudioElement;
    node.volume = Math.min(1, state.volume * vol * 1.6);
    const p = node.play();
    if (p) p.catch(() => fallback?.());
  } catch {
    fallback?.();
  }
}

export function sfx(kind: Sfx) {
  if (!state.sfx) return;
  switch (kind) {
    case "tap":
      return synth([1320], 0.035, "sine", 0.18);
    case "nav":
      return sample(sfxClick, 0.45, () => synth([880, 1175], 0.05, "sine", 0.2));
    case "tick":
      return synth([1760], 0.02, "sine", 0.1);
    case "whoosh": {
      const a = ac();
      if (!a) return;
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(220, a.currentTime);
      o.frequency.exponentialRampToValueAtTime(880, a.currentTime + 0.22);
      g.gain.setValueAtTime(0.0001, a.currentTime);
      g.gain.exponentialRampToValueAtTime(state.volume * 0.25, a.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.26);
      o.connect(g).connect(a.destination);
      o.start();
      o.stop(a.currentTime + 0.3);
      return;
    }
    case "reveal":
      return synth([523, 784], 0.09, "triangle", 0.3);
    case "pop":
      return synth([660, 990, 1320], 0.05, "sine", 0.22, 0.9);
    case "correct":
      return sample(sfxCorrect, 1, () => synth([660, 880, 1180], 0.14, "sine"));
    case "wrong":
      return sample(sfxWrong, 1, () => synth([300, 190], 0.2, "sawtooth", 0.35));
    case "warn":
      return sample(sfxWarning, 0.8, () => synth([880, 660], 0.1, "square", 0.25));
    case "win":
      return synth([523, 659, 784, 1046], 0.16, "sine");
    case "lose":
      return synth([392, 330, 262], 0.2, "triangle", 0.35);
    case "coin":
      return synth([988, 1319], 0.09, "triangle", 0.35);
    case "jingle":
      return synth([1046, 1318, 1568, 2093], 0.12, "sine", 0.35, 0.55);
    case "emoji":
      return synth([740, 1110], 0.07, "sine", 0.3);
  }
}

export function setSfx(on: boolean) {
  state.sfx = on;
}
export function setVolume(v: number) {
  state.volume = v;
  if (musicEl) musicEl.volume = Math.min(1, v * 0.6);
}

/** موسیقی زمینه — فقط با دکمهٔ بالای صفحه کنترل می‌شود */
export function setMusic(on: boolean) {
  state.music = on;
  if (typeof window === "undefined") return;
  if (!musicEl) {
    musicEl = new Audio(bgMusic);
    musicEl.loop = true;
  }
  musicEl.volume = Math.min(1, state.volume * 0.6);
  if (on) void musicEl.play().catch(() => undefined);
  else musicEl.pause();
}

/** اعلان مرورگر (مثل پیام‌رسان‌ها) + جینگ */
export function pushNotify(title: string, body: string, onClick?: () => void) {
  sfx("jingle");
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted" || !document.hidden) return;
  try {
    const n = new Notification(title, { body, icon: undefined, tag: title });
    n.onclick = () => {
      window.focus();
      onClick?.();
      n.close();
    };
  } catch {
    /* بعضی مرورگرهای موبایل فقط از طریق Service Worker اعلان می‌دهند */
  }
}

export async function askNotifyPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/** صدای ملایم برای همهٔ دکمه‌ها و لینک‌ها */
export function installGlobalClickSound() {
  if (typeof window === "undefined") return () => undefined;
  const handler = (e: MouseEvent) => {
    const el = (e.target as HTMLElement | null)?.closest("button, a, summary, select, [role=button]");
    if (el && !(el as HTMLElement).dataset.silent) sfx("tap");
  };
  document.addEventListener("click", handler, true);
  return () => document.removeEventListener("click", handler, true);
}
