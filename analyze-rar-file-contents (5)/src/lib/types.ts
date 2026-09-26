import type { Category, Question } from "../data/quiz";

export type Mode = "practice" | "computer" | "friendly" | "event" | "daily";
export type LifelineKey = "fifty" | "hint" | "time";
export type ChatPrivacy = "all" | "friends" | "off";

/* ---------- آواتار‌ساز ---------- */
export type AvatarCfg = {
  bg: string;
  skin: string;
  hair: "short" | "long" | "curly" | "bald" | "bun" | "spiky" | "hijab" | "wavy";
  hairColor: string;
  eyes: "normal" | "happy" | "wink" | "star" | "sleepy";
  glasses: "none" | "round" | "square" | "sun" | "heart";
  facial: "none" | "mustache" | "curly" | "beard" | "goatee";
  mouth: "smile" | "grin" | "open" | "neutral" | "tongue";
  extra: "none" | "crown" | "headphones" | "flower" | "cap" | "horns";
  outfit: string;
};
export type AvatarRef = number | AvatarCfg;

export type Profile = {
  id: string;
  name: string;
  avatar: AvatarRef;
  bio: string;
  provider: "guest" | "phone" | "google";
  phone?: string;
  email?: string;
  xp: number;
  coins: number;
  cups: number;
  rating: number;
  streak: number;
  lastDaily: string;
  played: number;
  wins: number;
  interests: string[];
  interestsSet: boolean;
  chatPrivacy: ChatPrivacy;
  friends: string[];
  org: string;
  createdAt: number;
  inventory: string[];
  title: string;
};

export type Player = {
  id: string;
  name: string;
  avatar: AvatarRef;
  bio: string;
  xp: number;
  cups: number;
  rating: number;
  wins: number;
  played: number;
  weekXp: number;
  org: string;
  publicVisible: boolean;
  chatPrivacy: ChatPrivacy;
  kind: "staff" | "bot" | "member" | "real";
  accuracy: number;
  banned: boolean;
  lastSeen: number;
  prevRank?: number;
};

export type Message = {
  id: string;
  thread: string;
  from: "me" | string;
  text: string;
  image?: string;
  at: number;
  read: boolean;
  deleted?: boolean;
};

export type Notice = {
  id: string;
  title: string;
  body: string;
  link: string;
  at: number;
  read: boolean;
  kind: "message" | "invite" | "system" | "reward" | "event";
};

export type Invite = {
  id: string;
  from: string;
  category: string;
  kind: "invite" | "rematch";
  at: number;
  eventId?: string;
};

export type MedalSet = { gold: string; silver: string; bronze: string; cup: string };

export type GameEvent = {
  id: string;
  title: string;
  category: string;
  kind: "event" | "challenge" | "tournament" | "league";
  startsAt: number;
  endsAt: number;
  description: string;
  logo: string;
  medals: Partial<MedalSet>;
  hasCup: boolean;
  leagueId?: string;
  org?: string;
  active: boolean;
  results: { playerId: string; name: string; score: number; at: number }[];
};

export type League = {
  id: string;
  title: string;
  org: string;
  description: string;
  capacity: number;
  status: "open" | "closed";
  logo: string;
  members: string[];
  startsAt: number;
  endsAt: number;
};

export type Org = {
  id: string;
  name: string;
  description: string;
  logo: string;
  color: string;
  private: boolean;
  posts: { id: string; body: string; at: number }[];
};

export type Story = {
  id: string;
  author: string;
  avatar: AvatarRef;
  text: string;
  image: string;
  color: string;
  at: number;
  status: "pending" | "approved" | "rejected";
  views: number;
};

export type Comment = { id: string; author: string; avatar: AvatarRef; body: string; at: number };

export type Post = {
  id: string;
  author: string;
  authorId: string;
  avatar: AvatarRef;
  category: string;
  body: string;
  media: string;
  likes: number;
  liked: boolean;
  saved: boolean;
  comments: Comment[];
  at: number;
  status: "pending" | "approved" | "rejected";
  demo?: boolean;
  scheduledAt?: number;
};

export type Ticket = { id: string; subject: string; body: string; status: "open" | "answered" | "closed"; reply: string; at: number };
export type Resource = { id: string; title: string; url: string; kind: string; category: string };
export type Suggestion = Question & { status: "pending" | "approved" | "rejected"; at: number };
export type Audit = { id: string; admin: string; action: string; at: number };
export type Medal = { id: string; eventId: string; eventTitle: string; tier: "gold" | "silver" | "bronze" | "cup"; image: string; at: number; score: number };

export type ReviewItem = {
  questionId: string;
  title: string;
  options: string[];
  correct: number;
  explanation: string;
  category: string;
  at: number;
};

export type HistoryItem = {
  id: string;
  category: string;
  mode: Mode;
  score: number;
  rival: number;
  rivalName: string;
  win: 1 | 0 | -1;
  at: number;
  eventId?: string;
};

export type Settings = {
  siteTitle: string;
  tagline: string;
  logo: string;
  banners: { id: string; text: string; link: string; color: string }[];
  lifelines: Record<Mode, Record<LifelineKey, boolean>>;
  dailyOverride: Record<string, string>;
  dailyCount: number;
  botEnabled: boolean;
  botAccuracy: number;
  botDelayMin: number;
  botDelayMax: number;
  staffActivity: boolean;
  moderatePosts: boolean;
  moderateStories: boolean;
  chatEnabled: boolean;
  shopEnabled: boolean;
  loginMethods: { guest: boolean; phone: boolean; google: boolean };
  languages: { id: string; name: string; active: boolean }[];
  defaultMedals: MedalSet;
  welcome: string;
  roundSeconds: number;
};

export type AnswerLog = { round: number; choice: number; correct: boolean; points: number; elapsed: number };
export type Reaction = { id: string; from: "me" | "rival"; emoji: string; at: number };

export type MatchState = {
  id: string;
  category: string;
  mode: Mode;
  eventId?: string;
  questions: Question[];
  round: number;
  phase: "intro" | "playing" | "reveal" | "finished";
  roundAt: number;
  score: number;
  rivalScore: number;
  rival: { id: string; name: string; avatar: AvatarRef; accuracy: number } | null;
  answers: AnswerLog[];
  rivalAnswers: AnswerLog[];
  lifelines: Record<LifelineKey, number>;
  eliminated: number[];
  hint: string;
  bonusSeconds: number;
  rivalPlan: { at: number; choice: number } | null;
  reactions: Reaction[];
  reward?: { xp: number; coins: number; cups: number; daily: boolean };
  medal?: Medal | null;
};

export type Store = {
  profile: Profile | null;
  players: Player[];
  stats: Record<string, { xp: number; wins: number; played: number }>;
  reviews: ReviewItem[];
  history: HistoryItem[];
  posts: Post[];
  stories: Story[];
  messages: Message[];
  notices: Notice[];
  invites: Invite[];
  events: GameEvent[];
  leagues: League[];
  orgs: Org[];
  tickets: Ticket[];
  resources: Resource[];
  suggestions: Suggestion[];
  audit: Audit[];
  medals: Medal[];
  custom: Question[];
  removed: string[];
  customCategories: Category[];
  categoryImages: Record<string, string>;
  hiddenCategories: string[];
  settings: Settings;
  openMatch: MatchState | null;
  dailyDone: Record<string, number>;
  rewardDays: string[];
  sound: boolean;
  music: boolean;
  volume: number;
  admin: boolean;
  adminName: string;
  notifAsked: boolean;
  completedMatches: number;
};
