import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Icon, fa } from "../components/ui";
import { trophyArt } from "../data/art";
import type { AvatarRef, MatchState, Player, Store } from "../lib/types";
import { REVEAL_MS, STAGE_MS, eloDelta, findCategory, hintFor, medalFor, planRival, questionSeconds, rewardFor, scoreFor, streakOf } from "../lib/engine";
import { setStore, today, uid } from "../lib/store";
import { sfx } from "../lib/sound";

type Props = {
  match: MatchState;
  setMatch: (fn: (p: MatchState) => MatchState) => void;
  store: Store;
  onExit: () => void;
  onRematch: (category: string, rival: Player | null) => void;
  onEvent: (eventId: string) => void;
};

const KEYS = ["الف", "ب", "ج", "د"];
export const EMOJIS = ["😂", "😢", "😡", "😮", "🤝", "❤️", "👋", "🔥", "👏", "😎"];

export function MatchPage({ match, setMatch, store, onExit, onRematch, onEvent }: Props) {
  const [now, setNow] = useState(Date.now());
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [rematch, setRematch] = useState<"idle" | "waiting" | "declined">("idle");
  const settled = useRef(false);
  const stageRef = useRef(-1);
  const warned = useRef(-1);
  const cat = findCategory(store, match.category);
  const q = match.questions[match.round];
  const total = questionSeconds(match);
  const allow = store.settings.lifelines[match.mode];
  const stageStart = match.roundAt - STAGE_MS.timer;
  const since = now - stageStart;
  const stage = match.phase !== "playing" ? 3 : since < STAGE_MS.question ? 0 : since < STAGE_MS.options ? 1 : since < STAGE_MS.timer ? 2 : 3;
  const elapsed = Math.max(0, now - match.roundAt);
  const left = Math.max(0, total * 1000 - elapsed);
  const myAnswer = match.answers.find((a) => a.round === match.round);
  const rivalAnswer = match.rivalAnswers.find((a) => a.round === match.round);
  const rivalPlayer = store.players.find((p) => p.id === match.rival?.id) || null;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 90);
    return () => clearInterval(t);
  }, []);

  /* ذخیرهٔ بازی باز برای ادامه پس از بستن صفحه */
  useEffect(() => {
    setStore((s) => ({ ...s, openMatch: match.phase === "finished" ? null : match }));
  }, [match]);

  /* صدای هر مرحلهٔ ورود سؤال */
  useEffect(() => {
    if (match.phase !== "playing") return;
    const key = match.round * 10 + stage;
    if (stageRef.current === key) return;
    stageRef.current = key;
    if (stage === 0) sfx("whoosh");
    if (stage === 1) sfx("reveal");
    if (stage === 2) sfx("pop");
    if (stage === 3) sfx("tick");
  }, [stage, match.round, match.phase]);

  useEffect(() => {
    if (match.phase === "intro" && now >= match.roundAt - STAGE_MS.timer) setMatch((m) => ({ ...m, phase: "playing" }));
  }, [match.phase, match.roundAt, now, setMatch]);

  useEffect(() => {
    if (match.phase === "playing" && stage === 3 && !myAnswer && left < 6000 && left > 0 && warned.current !== match.round) {
      warned.current = match.round;
      sfx("warn");
    }
  }, [left, match.phase, match.round, myAnswer, stage]);

  useEffect(() => {
    if (match.phase !== "playing" || !match.rival || match.rivalPlan) return;
    setMatch((m) => ({ ...m, rivalPlan: planRival(m, store) }));
  }, [match.phase, match.rival, match.rivalPlan, match.round, setMatch, store]);

  useEffect(() => {
    if (match.phase !== "playing" || !match.rivalPlan || rivalAnswer || now < match.rivalPlan.at) return;
    setMatch((m) => {
      if (!m.rivalPlan || m.rivalAnswers.some((a) => a.round === m.round)) return m;
      const el = m.rivalPlan.at - m.roundAt;
      const correct = m.rivalPlan.choice === m.questions[m.round].correct;
      const pts = scoreFor(correct, el, questionSeconds(m), streakOf(m.rivalAnswers), false);
      return { ...m, rivalScore: m.rivalScore + pts, rivalAnswers: [...m.rivalAnswers, { round: m.round, choice: m.rivalPlan.choice, correct, points: pts, elapsed: el }] };
    });
  }, [now, match.phase, match.rivalPlan, rivalAnswer, setMatch]);

  useEffect(() => {
    if (match.phase !== "playing" || !myAnswer || (match.rival && !rivalAnswer)) return;
    setMatch((m) => (m.phase === "playing" ? { ...m, phase: "reveal", roundAt: Date.now() } : m));
  }, [match.phase, myAnswer, rivalAnswer, match.rival, setMatch]);

  useEffect(() => {
    if (match.phase !== "playing" || stage < 3 || left > 0) return;
    setMatch((m) => {
      const next = { ...m };
      if (!next.answers.some((a) => a.round === next.round)) next.answers = [...next.answers, { round: next.round, choice: -1, correct: false, points: 0, elapsed: total * 1000 }];
      if (next.rival && !next.rivalAnswers.some((a) => a.round === next.round)) next.rivalAnswers = [...next.rivalAnswers, { round: next.round, choice: -1, correct: false, points: 0, elapsed: total * 1000 }];
      return { ...next, phase: "reveal", roundAt: Date.now() };
    });
    if (!myAnswer) sfx("wrong");
  }, [left, match.phase, setMatch, total, stage, myAnswer]);

  useEffect(() => {
    if (match.phase !== "reveal" || now - match.roundAt < REVEAL_MS) return;
    setMatch((m) =>
      m.round + 1 >= m.questions.length
        ? { ...m, phase: "finished" }
        : { ...m, round: m.round + 1, phase: "playing", roundAt: Date.now() + STAGE_MS.timer, rivalPlan: null, eliminated: [], hint: "", bonusSeconds: 0 }
    );
    /* واکنش ایموجی حریف */
    if (match.rival && Math.random() < 0.3) setTimeout(() => react("rival", EMOJIS[Math.floor(Math.random() * EMOJIS.length)]), 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, match.phase, match.roundAt, setMatch]);

  /* ثبت نتیجه */
  useEffect(() => {
    if (match.phase !== "finished" || settled.current) return;
    settled.current = true;
    const correctCount = match.answers.filter((a) => a.correct).length;
    const win: 1 | 0 | -1 = !match.rival ? -1 : match.score > match.rivalScore ? 1 : match.score === match.rivalScore ? -1 : 0;
    const ev = match.eventId ? store.events.find((e) => e.id === match.eventId) : undefined;
    const medal = ev ? medalFor(store, ev, match.score) : null;
    const day = today();
    setStore((s) => {
      if (!s.profile) return s;
      const daily = s.profile.lastDaily !== day;
      const r = rewardFor(correctCount, win, daily);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const wrongs = match.answers.filter((a) => !a.correct).map((a) => {
        const qq = match.questions[a.round];
        return { questionId: qq.id, title: qq.title, options: qq.options, correct: qq.correct, explanation: qq.explanation, category: qq.category, at: Date.now() };
      });
      const stat = s.stats[match.category] || { xp: 0, wins: 0, played: 0 };
      const actual = win === 1 ? 1 : win === 0 ? 0 : 0.5;
      return {
        ...s,
        openMatch: null,
        completedMatches: s.completedMatches + 1,
        profile: {
          ...s.profile,
          xp: s.profile.xp + r.xp, coins: s.profile.coins + r.coins, cups: s.profile.cups + r.cups + (medal?.tier === "cup" ? 1 : 0), played: s.profile.played + 1, wins: s.profile.wins + (win === 1 ? 1 : 0),
          rating: match.rival && match.mode === "computer" ? s.profile.rating + eloDelta(s.profile.rating, 980 + Math.round(match.rival.accuracy * 400), actual) : s.profile.rating,
          streak: daily ? (s.profile.lastDaily === yesterday ? s.profile.streak + 1 : 1) : s.profile.streak,
          lastDaily: daily ? day : s.profile.lastDaily,
        },
        stats: { ...s.stats, [match.category]: { xp: stat.xp + r.xp, wins: stat.wins + r.cups, played: stat.played + 1 } },
        reviews: [...wrongs, ...s.reviews.filter((x) => !wrongs.some((w) => w.questionId === x.questionId))].slice(0, 80),
        history: [{ id: match.id, category: match.category, mode: match.mode, score: match.score, rival: match.rivalScore, rivalName: match.rival?.name || "تمرین انفرادی", win, at: Date.now(), eventId: match.eventId }, ...s.history].slice(0, 60),
        medals: medal ? [medal, ...s.medals] : s.medals,
        dailyDone: match.mode === "daily" ? { ...s.dailyDone, [day]: match.score } : s.dailyDone,
        events: ev ? s.events.map((e) => (e.id === ev.id ? { ...e, results: [...e.results.filter((x) => x.playerId !== s.profile!.id), { playerId: s.profile!.id, name: s.profile!.name, score: match.score, at: Date.now() }] } : e)) : s.events,
      };
    });
    setMatch((m) => ({ ...m, reward: rewardFor(correctCount, win, true), medal }));
    sfx(win === 0 ? "lose" : "win");
    /* گاهی حریف خودش درخواست مبارزهٔ مجدد می‌دهد */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.phase]);

  const react = (from: "me" | "rival", emoji: string) => {
    sfx("emoji");
    const id = uid("r");
    setMatch((m) => ({ ...m, reactions: [...m.reactions.slice(-6), { id, from, emoji, at: Date.now() }] }));
    if (from === "me" && Math.random() < 0.45) setTimeout(() => react("rival", EMOJIS[Math.floor(Math.random() * EMOJIS.length)]), 1400 + Math.random() * 1500);
  };

  const answer = (choice: number) => {
    if (match.phase !== "playing" || myAnswer || stage < 3) return;
    const el = Date.now() - match.roundAt;
    const correct = choice === q.correct;
    const perfect = match.round === match.questions.length - 1 && streakOf(match.answers) === match.round;
    const pts = scoreFor(correct, el, total, streakOf(match.answers), perfect && correct);
    sfx(correct ? "correct" : "wrong");
    setMatch((m) => ({ ...m, score: m.score + pts, answers: [...m.answers, { round: m.round, choice, correct, points: pts, elapsed: el }] }));
  };

  const useFifty = () => {
    if (match.lifelines.fifty < 1 || match.eliminated.length || myAnswer) return;
    const wrongs = [0, 1, 2, 3].filter((i) => i !== q.correct).sort(() => Math.random() - 0.5).slice(0, 2);
    sfx("pop");
    setMatch((m) => ({ ...m, lifelines: { ...m.lifelines, fifty: m.lifelines.fifty - 1 }, eliminated: wrongs }));
  };
  const useHint = () => {
    if (match.lifelines.hint < 1 || match.hint || myAnswer) return;
    sfx("reveal");
    setMatch((m) => ({ ...m, lifelines: { ...m.lifelines, hint: m.lifelines.hint - 1 }, hint: hintFor(q) }));
  };
  const useTime = () => {
    if (match.lifelines.time < 1 || myAnswer) return;
    sfx("coin");
    setMatch((m) => ({ ...m, lifelines: { ...m.lifelines, time: m.lifelines.time - 1 }, bonusSeconds: m.bonusSeconds + 10 }));
  };

  const requestRematch = () => {
    setRematch("waiting");
    setTimeout(() => {
      if (Math.random() < 0.85) {
        sfx("jingle");
        onRematch(match.category, rivalPlayer);
      } else setRematch("declined");
    }, 1600 + Math.random() * 1800);
  };

  const progress = useMemo(() => Math.max(0, Math.min(100, (left / (total * 1000)) * 100)), [left, total]);
  const recentReactions = match.reactions.filter((r) => now - r.at < 2300);

  if (match.phase === "intro" && match.rival) {
    return (
      <div className="gm-motion grid min-h-screen place-items-center px-5">
        <div className="gm-pop w-full max-w-2xl text-center">
          <span className="pill gold mx-auto mb-5">{match.eventId ? "رویداد" : "در حال آماده‌سازی میدان"}</span>
          <div className="flex items-center justify-center gap-6 sm:gap-12">
            <Side name={store.profile?.name || "تو"} a={store.profile?.avatar ?? 0} />
            <div className="gm-reveal-text text-4xl font-black">VS</div>
            <Side name={match.rival.name} a={match.rival.avatar} />
          </div>
          <h2 className="mt-8 text-xl font-bold">{cat.name}</h2>
          <p className="mt-2 text-xs text-[var(--muted)]">هفت سؤال، چهار گزینه و یک فرصت تازه برای یادگیری.</p>
        </div>
      </div>
    );
  }

  if (match.phase === "finished") {
    const correctCount = match.answers.filter((a) => a.correct).length;
    const win = match.rival ? (match.score > match.rivalScore ? 1 : match.score === match.rivalScore ? -1 : 0) : -1;
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="gm-panel gm-pop overflow-hidden text-center">
          <div className="gm-motion px-6 pt-8 pb-6">
            <img src={match.medal?.image || trophyArt} alt="" className="gm-float mx-auto w-28" />
            <h1 className="mt-4 text-2xl font-black">{!match.rival ? "آزمون تمام شد" : win === 1 ? "بردی! 🎉" : win === 0 ? "این دور را باختی" : "مساوی شد"}</h1>
            <p className="mt-2 text-xs text-[var(--muted)]">{fa(correctCount)} پاسخ درست از {fa(match.questions.length)} سؤال {cat.name}</p>
            {match.medal && <p className="mt-2 text-sm font-bold text-[var(--gold)]">{match.medal.tier === "cup" ? "جام قهرمانی" : match.medal.tier === "gold" ? "مدال طلا" : match.medal.tier === "silver" ? "مدال نقره" : "مدال برنز"} رویداد «{match.medal.eventTitle}» مال توست!</p>}
          </div>
          <div className="grid grid-cols-2 gap-3 px-6 pb-2">
            <ScoreBox label="امتیاز تو" value={match.score} tone="gold" />
            <ScoreBox label={match.rival ? match.rival.name : "حداکثر ممکن"} value={match.rival ? match.rivalScore : match.questions.length * 180} tone="purple" />
          </div>
          {match.reward && (
            <div className="mx-6 my-5 flex flex-wrap justify-center gap-2 rounded-2xl border border-[#4d395e] bg-[#2a2038] p-4">
              <span className="pill gold"><Icon name="spark" size={12} /> {fa(match.reward.xp)}+ تجربه</span>
              <span className="pill"><Icon name="coin" size={12} /> {fa(match.reward.coins)}+ سکه</span>
              {match.reward.cups > 0 && <span className="pill green"><Icon name="crown" size={12} /> {fa(match.reward.cups)}+ جام</span>}
            </div>
          )}
          <div className="px-6 pb-7">
            <div className="mb-6 flex flex-wrap justify-center gap-2.5">
              {match.eventId && (
                <button className="btn gm-glow" onClick={() => onEvent(match.eventId!)}>
                  <Icon name="flag" size={16} /> بازگشت به صفحهٔ رویداد
                </button>
              )}
              {match.rival && !match.eventId && (
                <button className="btn primary" onClick={requestRematch} disabled={rematch === "waiting"}>
                  <Icon name="refresh" size={16} /> {rematch === "waiting" ? `منتظر پاسخ ${match.rival.name}…` : rematch === "declined" ? "رد شد؛ دوباره؟" : "درخواست مبارزهٔ مجدد"}
                </button>
              )}
              {!match.rival && !match.eventId && match.mode !== "daily" && (
                <button className="btn primary" onClick={() => onRematch(match.category, null)}><Icon name="refresh" size={16} /> آزمون دوباره</button>
              )}
              <button className="btn secondary" onClick={onExit}><Icon name="home" size={16} /> خانه</button>
            </div>
            <div className="grid gap-2 text-right">
              {match.questions.map((qq, i) => {
                const a = match.answers.find((x) => x.round === i);
                return (
                  <details key={qq.id + i} className="rounded-xl border border-[var(--line)] bg-[#221a2d] px-4 py-3">
                    <summary className="flex cursor-pointer items-center gap-2 text-[13px]">
                      <Icon name={a?.correct ? "check" : "close"} size={15} className={a?.correct ? "text-[var(--green)]" : "text-[var(--red)]"} />
                      <span className="flex-1">{qq.title}</span>
                      <span className="pill">{fa(a?.points || 0)}</span>
                    </summary>
                    <p className="mt-2 text-xs text-[var(--green)]">پاسخ درست: {qq.options[qq.correct]}</p>
                    <p className="mt-1 text-xs leading-7 text-[var(--muted)]">{qq.explanation}</p>
                  </details>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const revealing = match.phase === "reveal";
  return (
    <div className="mx-auto max-w-4xl px-3 py-4 sm:py-7">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button className="btn ghost sm" onClick={onExit}><Icon name="close" size={15} /> خروج</button>
        <div className="flex items-center gap-1.5">
          {match.questions.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i < match.round ? "w-4 bg-[var(--purple)]" : i === match.round ? "w-8 bg-[var(--gold)]" : "w-4 bg-[#3a2c46]"}`} />
          ))}
        </div>
        <span className={`pill ${left < 6000 && stage === 3 && !revealing ? "red" : "gold"}`}>
          <Icon name="clock" size={12} /> {fa(stage < 3 ? total : Math.ceil(left / 1000))}
        </span>
      </div>

      <div className="gm-panel relative mb-4 flex items-center justify-between gap-3 px-4 py-3">
        <div className="relative">
          <Player name={store.profile?.name || "تو"} a={store.profile?.avatar ?? 0} score={match.score} done={!!myAnswer} tone="gold" />
          {recentReactions.filter((r) => r.from === "me").map((r) => <span key={r.id} className="gm-emoji-fly">{r.emoji}</span>)}
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[var(--muted)]">{cat.name}</div>
          <div className="text-[11px] font-bold text-[var(--purple)]">سؤال {fa(match.round + 1)} از {fa(match.questions.length)}</div>
        </div>
        {match.rival ? (
          <div className="relative">
            <Player name={match.rival.name} a={match.rival.avatar} score={match.rivalScore} done={!!rivalAnswer} tone="purple" flip />
            {recentReactions.filter((r) => r.from === "rival").map((r) => <span key={r.id} className="gm-emoji-fly">{r.emoji}</span>)}
          </div>
        ) : (
          <div className="w-24 text-left text-[11px] text-[var(--muted)]">{match.mode === "daily" ? "چالش روزانه" : "حالت تمرین"}</div>
        )}
      </div>

      <div className="mb-5 h-2 overflow-hidden rounded-full bg-[#2a2038]">
        <div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${stage < 3 ? 100 : progress}%`, background: progress < 25 ? "var(--red)" : progress < 55 ? "var(--gold)" : "var(--purple)" }} />
      </div>

      <div key={`bg-${match.round}`} className="gm-bg-in gm-motion mb-4 min-h-[140px] rounded-[var(--radius)] border border-[var(--line)] px-5 py-6 text-center sm:px-8" style={{ background: `radial-gradient(ellipse at 50% 0%, ${cat.color}33, #241b30 70%)` }}>
        {stage >= 1 && (
          <div className="gm-q-in">
            <span className="pill mx-auto mb-3" style={{ background: `${cat.color}22`, color: cat.color }}><Icon name={cat.icon || "book"} size={12} /> {cat.name}</span>
            <h2 className="text-lg leading-9 font-bold sm:text-xl">{q.title}</h2>
            {match.hint && <p className="gm-pop mt-3 text-xs text-[var(--gold)]">💡 {match.hint}</p>}
          </div>
        )}
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {stage >= 2 &&
          q.options.map((opt, i) => {
            let state: string | undefined;
            if (revealing) state = i === q.correct ? "correct" : myAnswer?.choice === i ? "wrong" : "muted";
            else if (myAnswer) state = myAnswer.choice === i ? (myAnswer.correct ? "correct" : "wrong") : "muted";
            else if (match.eliminated.includes(i)) state = "muted";
            return (
              <button key={i} className={`answer gm-opt-in ${state === "wrong" ? "gm-shake" : ""}`} style={{ animationDelay: `${i * 70}ms` }} data-state={state} disabled={!!myAnswer || revealing || match.eliminated.includes(i) || stage < 3} onClick={() => answer(i)}>
                <span className="key">{KEYS[i]}</span>
                <span className="flex-1 text-right">{opt}</span>
                {revealing && i === q.correct && <Icon name="check" size={17} className="text-[var(--green)]" />}
              </button>
            );
          })}
      </div>

      {!revealing && !myAnswer && stage === 3 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {allow.fifty && <button className="btn secondary sm" onClick={useFifty} disabled={match.lifelines.fifty < 1 || match.eliminated.length > 0}><Icon name="target" size={14} /> ۵۰/۵۰ حذف دو گزینه ({fa(match.lifelines.fifty)})</button>}
          {allow.hint && <button className="btn secondary sm" onClick={useHint} disabled={match.lifelines.hint < 1 || !!match.hint}><Icon name="info" size={14} /> راهنما ({fa(match.lifelines.hint)})</button>}
          {allow.time && <button className="btn secondary sm" onClick={useTime} disabled={match.lifelines.time < 1}><Icon name="clock" size={14} /> ۱۰ ثانیه بیشتر ({fa(match.lifelines.time)})</button>}
        </div>
      )}

      {revealing && (
        <div className="gm-panel gm-pop mt-4 px-5 py-4">
          <div className="mb-1.5 flex items-center gap-2 text-[13px] font-bold"><Icon name="info" size={16} className="text-[var(--gold)]" /> چرا این پاسخ درست است؟</div>
          <p className="text-xs leading-7 text-[var(--muted)]">{q.explanation || "پاسخ درست با رنگ سبز مشخص شده است."}</p>
          {myAnswer && myAnswer.points > 0 && <p className="mt-2 text-xs text-[var(--green)]">{fa(myAnswer.points)} امتیاز گرفتی (پایه ۱۰۰ + سرعت + زنجیره)</p>}
        </div>
      )}

      {match.rival && (
        <div className="fixed bottom-5 left-5 z-40">
          {emojiOpen && (
            <div className="gm-panel gm-pop mb-2 grid grid-cols-5 gap-1 p-2">
              {EMOJIS.map((e) => (
                <button key={e} className="grid size-11 place-items-center rounded-xl text-2xl transition hover:scale-125 hover:bg-[#3a294b]" onClick={() => { react("me", e); setEmojiOpen(false); }} data-silent="1">{e}</button>
              ))}
            </div>
          )}
          <button className="grid size-14 place-items-center rounded-full border border-[#75613e] bg-[#302535] text-3xl shadow-xl transition hover:scale-110" onClick={() => setEmojiOpen(!emojiOpen)} aria-label="ایموجی">😄</button>
        </div>
      )}
    </div>
  );
}

function Side({ name, a }: { name: string; a: AvatarRef }) {
  return (
    <div className="text-center">
      <Avatar a={a} size={104} ring="#f2ca7c" className="gm-float" />
      <div className="mt-2.5 max-w-32 truncate text-sm font-bold">{name}</div>
    </div>
  );
}
function Player({ name, a, score, done, tone, flip }: { name: string; a: AvatarRef; score: number; done: boolean; tone: "gold" | "purple"; flip?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${flip ? "flex-row-reverse text-left" : ""}`}>
      <Avatar a={a} size={42} ring={done ? "#8dd6b5" : "#5b4770"} />
      <div>
        <div className="max-w-[92px] truncate text-[11px]">{name}</div>
        <div className={`text-base font-black ${tone === "gold" ? "text-[var(--gold)]" : "text-[var(--purple)]"}`}>{fa(score)}</div>
      </div>
    </div>
  );
}
function ScoreBox({ label, value, tone }: { label: string; value: number; tone: "gold" | "purple" }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[#221a2d] py-4">
      <div className={`text-2xl font-black ${tone === "gold" ? "text-[var(--gold)]" : "text-[var(--purple)]"}`}>{fa(value)}</div>
      <div className="truncate px-2 text-[11px] text-[var(--muted)]">{label}</div>
    </div>
  );
}
