import type { AvatarCfg } from "./types";

export const SKINS = ["#f6d2b8", "#e9b493", "#d39a72", "#b27650", "#8a5537", "#b7e4c7", "#c9b6f2"];
export const HAIR_COLORS = ["#2b1d2e", "#5a3825", "#a0643a", "#e8c170", "#d8d8e0", "#c2410c", "#8960c5", "#2f8f83"];
export const BGS = ["#8960c5", "#f2ca7c", "#7cd7b6", "#76bfec", "#eda0b9", "#efa877", "#99a9ee", "#3a294b"];
export const OUTFITS = ["#453653", "#8960c5", "#2f6f63", "#b24a5c", "#2c4f7c", "#d69838", "#272034"];

export const OPTIONS = {
  hair: [
    ["short", "کوتاه"],
    ["long", "بلند"],
    ["wavy", "موج‌دار"],
    ["curly", "فرفری"],
    ["spiky", "سیخ‌سیخی"],
    ["bun", "گوجه‌ای"],
    ["hijab", "حجاب"],
    ["bald", "بدون مو"],
  ],
  eyes: [
    ["normal", "معمولی"],
    ["happy", "خندان"],
    ["wink", "چشمک"],
    ["star", "ستاره‌ای"],
    ["sleepy", "خواب‌آلود"],
  ],
  glasses: [
    ["none", "بدون عینک"],
    ["round", "گرد"],
    ["square", "مستطیلی"],
    ["sun", "آفتابی"],
    ["heart", "قلبی"],
  ],
  facial: [
    ["none", "بدون"],
    ["mustache", "سبیل"],
    ["curly", "سبیل فانتزی"],
    ["beard", "ریش"],
    ["goatee", "بزی"],
  ],
  mouth: [
    ["smile", "لبخند"],
    ["grin", "خندهٔ بلند"],
    ["open", "شگفت‌زده"],
    ["neutral", "آرام"],
    ["tongue", "زبان‌درازی"],
  ],
  extra: [
    ["none", "بدون"],
    ["crown", "تاج"],
    ["headphones", "هدفون"],
    ["flower", "گل"],
    ["cap", "کلاه"],
    ["horns", "شاخ فانتزی"],
  ],
} as const;

export const defaultCfg = (): AvatarCfg => ({
  bg: BGS[0],
  skin: SKINS[1],
  hair: "short",
  hairColor: HAIR_COLORS[0],
  eyes: "happy",
  glasses: "none",
  facial: "none",
  mouth: "smile",
  extra: "none",
  outfit: OUTFITS[0],
});

export const randomCfg = (): AvatarCfg => {
  const p = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
  return {
    bg: p(BGS),
    skin: p(SKINS),
    hair: p(OPTIONS.hair)[0],
    hairColor: p(HAIR_COLORS),
    eyes: p(OPTIONS.eyes)[0],
    glasses: Math.random() < 0.35 ? p(OPTIONS.glasses)[0] : "none",
    facial: Math.random() < 0.3 ? p(OPTIONS.facial)[0] : "none",
    mouth: p(OPTIONS.mouth)[0],
    extra: Math.random() < 0.3 ? p(OPTIONS.extra)[0] : "none",
    outfit: p(OUTFITS),
  };
};

/** آواتارهای آمادهٔ فانتزی (از جمله بانوی محجبه، سبیلو، عینکی) */
export const presetCfgs: AvatarCfg[] = [
  { ...defaultCfg(), hair: "hijab", hairColor: "#8960c5", bg: "#f2ca7c", eyes: "happy", mouth: "smile", extra: "flower", outfit: "#8960c5" },
  { ...defaultCfg(), hair: "short", facial: "curly", glasses: "round", bg: "#7cd7b6", skin: "#d39a72", mouth: "grin", outfit: "#2c4f7c" },
  { ...defaultCfg(), hair: "hijab", hairColor: "#2f8f83", glasses: "heart", bg: "#eda0b9", skin: "#f6d2b8", eyes: "wink", outfit: "#2f6f63" },
  { ...defaultCfg(), hair: "spiky", hairColor: "#c2410c", glasses: "sun", bg: "#76bfec", mouth: "tongue", extra: "headphones", outfit: "#b24a5c" },
  { ...defaultCfg(), hair: "bald", facial: "beard", hairColor: "#5a3825", bg: "#efa877", skin: "#b27650", glasses: "square", extra: "crown", outfit: "#453653" },
  { ...defaultCfg(), hair: "bun", hairColor: "#e8c170", bg: "#99a9ee", eyes: "star", mouth: "open", outfit: "#d69838" },
  { ...defaultCfg(), hair: "curly", hairColor: "#2b1d2e", facial: "mustache", bg: "#8960c5", skin: "#8a5537", eyes: "sleepy", extra: "cap", outfit: "#272034" },
  { ...defaultCfg(), hair: "wavy", hairColor: "#8960c5", bg: "#3a294b", skin: "#c9b6f2", eyes: "star", extra: "horns", mouth: "grin", outfit: "#2f6f63" },
];

function eyes(c: AvatarCfg) {
  const d = "#29202c";
  switch (c.eyes) {
    case "happy":
      return `<path d="M44 63q5-6 10 0M68 63q5-6 10 0" stroke="${d}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
    case "wink":
      return `<ellipse cx="49" cy="63" rx="3" ry="4" fill="${d}"/><path d="M68 63q5-5 10 0" stroke="${d}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
    case "star":
      return `<path d="m49 57 2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5zm24 0 2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z" fill="#f2ca7c" stroke="${d}" stroke-width="1"/>`;
    case "sleepy":
      return `<path d="M44 64h10M68 64h10" stroke="${d}" stroke-width="3.2" stroke-linecap="round"/>`;
    default:
      return `<ellipse cx="49" cy="63" rx="3.2" ry="4.2" fill="${d}"/><ellipse cx="73" cy="63" rx="3.2" ry="4.2" fill="${d}"/><circle cx="50.2" cy="61.6" r="1.1" fill="#fff"/><circle cx="74.2" cy="61.6" r="1.1" fill="#fff"/>`;
  }
}

function glasses(c: AvatarCfg) {
  const s = `stroke="#1d1527" stroke-width="2.6" fill="none"`;
  switch (c.glasses) {
    case "round":
      return `<circle cx="49" cy="63" r="9" ${s}/><circle cx="73" cy="63" r="9" ${s}/><path d="M58 63h6" ${s}/>`;
    case "square":
      return `<rect x="39" y="55" width="19" height="15" rx="4" ${s}/><rect x="64" y="55" width="19" height="15" rx="4" ${s}/><path d="M58 62h6" ${s}/>`;
    case "sun":
      return `<path d="M38 57h22l-2 10q-9 6-18 0zM62 57h22l-2 10q-9 6-18 0z" fill="#1d1527"/><path d="M60 59h2" stroke="#1d1527" stroke-width="3"/><path d="M43 60l5 0" stroke="#fff" stroke-width="1.6" opacity=".5"/>`;
    case "heart":
      return `<path d="M49 71s-11-7-11-13a5.5 5.5 0 0 1 11-1 5.5 5.5 0 0 1 11 1c0 6-11 13-11 13zM73 71s-11-7-11-13a5.5 5.5 0 0 1 11-1 5.5 5.5 0 0 1 11 1c0 6-11 13-11 13z" fill="#f499a7" stroke="#b24a5c" stroke-width="1.5" opacity=".92"/>`;
    default:
      return "";
  }
}

function mouth(c: AvatarCfg) {
  const d = "#6b2f3b";
  switch (c.mouth) {
    case "grin":
      return `<path d="M50 79q11 12 22 0z" fill="${d}"/><path d="M53 80h16" stroke="#fff" stroke-width="2.4"/>`;
    case "open":
      return `<ellipse cx="61" cy="82" rx="5" ry="6" fill="${d}"/>`;
    case "neutral":
      return `<path d="M54 81h14" stroke="${d}" stroke-width="3" stroke-linecap="round"/>`;
    case "tongue":
      return `<path d="M51 79q10 8 20 0" stroke="${d}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M58 82q3 8 6 0" fill="#f499a7"/>`;
    default:
      return `<path d="M52 79q9 8 18 0" stroke="${d}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
}

function facial(c: AvatarCfg) {
  const h = c.hairColor;
  switch (c.facial) {
    case "mustache":
      return `<path d="M47 76q7-6 14-1 7-5 14 1-7 3-14 0-7 3-14 0z" fill="${h}"/>`;
    case "curly":
      return `<path d="M61 75q-8-5-15 1-4 4-8 0 3 7 10 5 8-2 13-4 5 2 13 4 7 2 10-5-4 4-8 0-7-6-15-1z" fill="${h}"/>`;
    case "beard":
      return `<path d="M36 64c0 30 50 30 50 0v6c0 24-50 24-50 0z" fill="${h}"/><path d="M48 76q7-5 13-1 6-4 13 1-6 3-13 1-7 2-13-1z" fill="${h}"/>`;
    case "goatee":
      return `<path d="M54 86q7 10 14 0-7 3-14 0z" fill="${h}"/><path d="M50 76q6-4 11 0 5-4 11 0" stroke="${h}" stroke-width="3" fill="none"/>`;
    default:
      return "";
  }
}

function hairBack(c: AvatarCfg) {
  const h = c.hairColor;
  switch (c.hair) {
    case "long":
      return `<path d="M30 50c0-38 62-38 62 0v44H30z" fill="${h}"/>`;
    case "wavy":
      return `<path d="M28 52c0-40 66-40 66 0 0 14 6 20 0 32-4 8 2 12-6 16H34c-8-4-2-8-6-16-6-12 0-18 0-32z" fill="${h}"/>`;
    case "hijab":
      return `<path d="M24 58c0-46 74-46 74 0v30c0 20-14 32-37 32S24 108 24 88z" fill="${h}"/>`;
    default:
      return "";
  }
}

function hairFront(c: AvatarCfg) {
  const h = c.hairColor;
  switch (c.hair) {
    case "short":
      return `<path d="M34 54c-2-26 54-30 54 0-8-8-18-12-28-11-10 1-18 5-26 11z" fill="${h}"/>`;
    case "long":
    case "wavy":
      return `<path d="M33 58c-4-30 58-34 56 0-10-12-18-14-26-14-10 0-20 4-30 14z" fill="${h}"/>`;
    case "curly":
      return `<g fill="${h}"><circle cx="40" cy="44" r="10"/><circle cx="53" cy="36" r="11"/><circle cx="68" cy="36" r="11"/><circle cx="82" cy="44" r="10"/><circle cx="35" cy="56" r="7"/><circle cx="87" cy="56" r="7"/></g>`;
    case "spiky":
      return `<path d="M34 54 32 30l10 10 4-18 9 14 6-18 6 18 9-14 4 18 10-10-2 24c-8-7-18-11-27-11s-19 4-27 11z" fill="${h}"/>`;
    case "bun":
      return `<circle cx="61" cy="24" r="12" fill="${h}"/><path d="M34 54c-2-26 54-30 54 0-6-10-16-13-27-13s-21 3-27 13z" fill="${h}"/>`;
    case "hijab":
      return `<path d="M32 60c0-34 58-34 58 0-6-14-16-18-29-18s-23 4-29 18z" fill="${h}"/><path d="M28 70q4 34 33 40 29-6 33-40" stroke="${h}" stroke-width="8" fill="none"/><circle cx="92" cy="72" r="3" fill="#f2ca7c"/>`;
    default:
      return "";
  }
}

function extra(c: AvatarCfg) {
  switch (c.extra) {
    case "crown":
      return `<path d="M42 30 46 12l8 10 7-14 7 14 8-10 4 18z" fill="#f2ca7c" stroke="#b7862f" stroke-width="1.5"/><circle cx="61" cy="22" r="2.5" fill="#f499a7"/>`;
    case "headphones":
      return `<path d="M28 64c0-44 66-44 66 0" stroke="#1d1527" stroke-width="6" fill="none"/><rect x="22" y="58" width="12" height="20" rx="5" fill="#8960c5"/><rect x="88" y="58" width="12" height="20" rx="5" fill="#8960c5"/>`;
    case "flower":
      return `<g transform="translate(84 40)"><circle r="5" cx="0" cy="-6" fill="#f499a7"/><circle r="5" cx="6" cy="0" fill="#f499a7"/><circle r="5" cx="0" cy="6" fill="#f499a7"/><circle r="5" cx="-6" cy="0" fill="#f499a7"/><circle r="4" fill="#f2ca7c"/></g>`;
    case "cap":
      return `<path d="M32 46c2-24 56-24 58 0z" fill="#b24a5c"/><path d="M60 44h40q-2 6-12 6H60z" fill="#8a2f40"/><circle cx="61" cy="24" r="3" fill="#f2ca7c"/>`;
    case "horns":
      return `<path d="M38 40q-10-16 0-26 0 14 10 20zM84 40q10-16 0-26 0 14-10 20z" fill="#f2ca7c" stroke="#b7862f" stroke-width="1.5"/>`;
    default:
      return "";
  }
}

export function avatarSvg(c: AvatarCfg) {
  const skin = c.skin;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${c.bg}"/><stop offset="1" stop-color="#241b30"/></linearGradient></defs><rect width="120" height="120" rx="40" fill="url(#g)"/><circle cx="96" cy="20" r="26" fill="#fff" opacity=".1"/><circle cx="18" cy="100" r="3" fill="#fff" opacity=".35"/><circle cx="104" cy="88" r="2" fill="#fff" opacity=".35"/>${hairBack(c)}<path d="M14 122c2-26 18-34 47-34s46 8 48 34" fill="${c.outfit}"/><path d="M49 80v14q12 10 24 0V80" fill="${skin}"/><path d="M36 44c0-30 50-30 50 0v24c0 30-50 30-50 0z" fill="${skin}"/><circle cx="35" cy="64" r="6" fill="${skin}"/><circle cx="87" cy="64" r="6" fill="${skin}"/><ellipse cx="44" cy="74" rx="4" ry="2.4" fill="#f499a7" opacity=".45"/><ellipse cx="78" cy="74" rx="4" ry="2.4" fill="#f499a7" opacity=".45"/>${hairFront(c)}${eyes(c)}<path d="m61 66-2 7h4" stroke="#b27650" stroke-width="1.8" fill="none" stroke-linecap="round"/>${facial(c)}${mouth(c)}${glasses(c)}${extra(c)}</svg>`;
}

export const avatarUri = (c: AvatarCfg) => "data:image/svg+xml," + encodeURIComponent(avatarSvg(c));
