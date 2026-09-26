import { useState } from "react";
import { Avatar, Icon, Modal, PageHead, fa, faDate, relTime } from "../components/ui";
import { experienceArt, trophyArt } from "../data/art";
import { allCategories, countByCategory, dailyQuestions, findCategory, levelFloor, levelOf } from "../lib/engine";
import { canSee, today } from "../lib/store";
import type { Mode, Player, Store, Story } from "../lib/types";
import { CategoryGrid } from "./Topics";

type Props = {
  store: Store;
  go: (r: string) => void;
  onStart: (category: string, mode: Mode) => void;
  onLogin: () => void;
  onResume: () => void;
  onForfeit: () => void;
  onDaily: () => void;
  onInvite: (p: Player) => void;
};

export function HomePage({ store, go, onStart, onLogin, onResume, onForfeit, onDaily, onInvite }: Props) {
  const [story, setStory] = useState<Story | null>(null);
  const counts = countByCategory(store);
  const p = store.profile;
  const level = levelOf(p?.xp ?? 0);
  const floor = levelFloor(level);
  const next = levelFloor(level + 1);
  const pct = p ? Math.min(100, Math.round(((p.xp - floor) / Math.max(1, next - floor)) * 100)) : 0;
  const cats = allCategories(store);
  const favourites = cats.filter((c) => p?.interests.includes(c.id)).slice(0, 6);
  const day = today();
  const daily = dailyQuestions(store, day);
  const dailyScore = store.dailyDone[day];
  const rivals = store.players.filter((x) => (x.kind === "staff" || x.kind === "member") && canSee(store, x)).sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 6);
  const stories = store.stories.filter((s) => s.status === "approved").slice(0, 12);
  const open = store.openMatch;

  return (
    <>
      <PageHead
        title="امروز، یک چیز تازه یاد بگیر."
        sub={p ? `سلام ${p.name}، آماده‌ای؟` : store.settings.welcome}
        action={<span className="flex items-center gap-2 text-[11px] text-[var(--muted)]"><Icon name="clock" size={16} /> {faDate(Date.now())}</span>}
      />

      {open && (
        <div className="gm-pop gm-glow mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[#75613e] bg-[#302535] px-5 py-4">
          <Icon name="play" size={22} className="text-[var(--gold)]" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold">یک بازی باز داری!</div>
            <div className="text-[11px] text-[var(--muted)]">{findCategory(store, open.category).name} · سؤال {fa(open.round + 1)} از {fa(open.questions.length)} {open.rival ? `· مقابل ${open.rival.name}` : ""}</div>
          </div>
          <button className="btn" onClick={onResume}><Icon name="play" size={15} /> ادامهٔ بازی</button>
          <button className="btn ghost sm" onClick={onForfeit}>انصراف</button>
        </div>
      )}

      {stories.length > 0 && (
        <div className="mb-5 flex gap-3 overflow-x-auto pb-2">
          {stories.map((s) => (
            <button key={s.id} className="shrink-0 text-center" onClick={() => setStory(s)}>
              <span className="block rounded-full p-[3px]" style={{ background: `conic-gradient(${s.color}, #f2ca7c, ${s.color})` }}>
                <Avatar a={s.avatar} size={58} ring="#17111f" />
              </span>
              <span className="mt-1 block w-16 truncate text-[10px] text-[var(--muted)]">{s.author.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <section className="gm-motion relative grid overflow-hidden rounded-[24px] border border-[#513662] bg-[linear-gradient(110deg,#251930,#342044)] md:grid-cols-[1.1fr_1fr]">
            <span className="gm-orb size-24 bg-[#f2ca7c44]" style={{ top: 20, left: 40 }} />
            <span className="gm-orb size-16 bg-[#8960c566]" style={{ bottom: 30, left: "38%", animationDelay: "2s" }} />
            <span className="gm-orb size-10 bg-[#2f8f8366]" style={{ top: 50, left: "45%", animationDelay: "4s" }} />
            <div className="relative z-2 px-7 pt-7 pb-6">
              <span className="mb-3 inline-flex items-center gap-2 text-[11px] text-[var(--gold)]"><Icon name="spark" size={14} /> رقابت کن • یاد بگیر • بدرخش</span>
              <h2 className="text-[27px] leading-tight font-black tracking-tight sm:text-[34px]">
                <span className="gm-reveal-text">دانستن، هیجان دارد.</span>
                <em className="block text-[var(--gold)] not-italic">نوبت توست بدرخشی.</em>
              </h2>
              <p className="my-3 max-w-md text-[11px] leading-7 text-[#c5b2d1]">هفت سؤال، چهار گزینه، {fa(store.settings.roundSeconds)} ثانیه. {fa(store.completedMatches)} مسابقه تا امروز کامل شده؛ نوبت توست.</p>
              <div className="flex flex-wrap items-center gap-2.5">
                <button className="btn gm-glow" onClick={() => (p ? go("challenge") : onLogin())}><Icon name="play" size={17} /> شروع رقابت</button>
                <button className="btn secondary" onClick={() => go("events")}><Icon name="flag" size={16} /> رویدادهای زنده</button>
              </div>
            </div>
            <div className="relative hidden items-center justify-center md:flex">
              <img src={trophyArt} alt="" className="gm-float w-[62%] drop-shadow-[0_18px_30px_#14092299]" />
            </div>
          </section>

          {/* چالش روزانه */}
          <section className="gm-panel gm-motion mt-5 overflow-hidden p-5">
            <div className="flex flex-wrap items-center gap-4">
              <span className="grid size-14 place-items-center rounded-2xl bg-[#493723] text-3xl">☀️</span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold">چالش روزانه · {faDate(Date.now())}</div>
                <p className="text-[11px] leading-6 text-[var(--muted)]">{fa(daily.length)} سؤال تازهٔ امروز که هر روز خودکار عوض می‌شود. نمونه: «{daily[0]?.title}»</p>
              </div>
              {dailyScore !== undefined ? (
                <span className="pill green !text-[12px]"><Icon name="check" size={13} /> امروز {fa(dailyScore)} امتیاز گرفتی</span>
              ) : (
                <button className="btn" onClick={() => (p ? onDaily() : onLogin())}><Icon name="bolt" size={15} /> شرکت در چالش</button>
              )}
            </div>
          </section>

          {/* حریف بعدی */}
          <div className="mt-7 mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[17px] font-bold"><Icon name="users" size={18} className="text-[var(--gold)]" /> حریف بعدی تو کیست؟</h2>
            <button className="text-[11px] text-[var(--purple)]" onClick={() => go("challenge")}>جست‌وجوی بازیکن ←</button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {rivals.map((r) => (
              <div key={r.id} className="gm-panel flex flex-col items-center gap-1.5 p-4 text-center transition hover:-translate-y-1">
                <Avatar a={r.avatar} size={56} online={Date.now() - r.lastSeen < 600000} />
                <div className="w-full truncate text-[13px] font-bold">{r.name}</div>
                <div className="text-[10px] text-[var(--muted)]">سطح {fa(levelOf(r.xp))} · {fa(r.cups)} جام</div>
                <button className="btn sm primary mt-1 w-full" onClick={() => (p ? onInvite(r) : onLogin())}><Icon name="bolt" size={13} /> دعوت به مسابقه</button>
              </div>
            ))}
          </div>
          <button className="btn secondary full mt-3" onClick={() => (p ? onStart(p.interests[0] || "general", "computer") : onLogin())}>
            <Icon name="refresh" size={15} /> حریف تصادفی
          </button>

          <div className="mt-7 mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[17px] font-bold"><Icon name="grid" size={18} className="text-[var(--gold)]" /> موضوع‌های پیشنهادی</h2>
            <button className="text-[11px] text-[var(--purple)]" onClick={() => go("topics")}>همه ←</button>
          </div>
          <CategoryGrid list={favourites.length ? favourites : cats.slice(0, 6)} counts={counts} onPick={(id) => onStart(id, "computer")} />
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <div className="gm-panel p-5">
            {p ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar a={p.avatar} size={58} ring="#f2ca7c" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">{p.name}</div>
                    <div className="text-[10px] text-[var(--muted)]">سطح {fa(level)} · امتیاز رقابتی {fa(p.rating)}</div>
                  </div>
                </div>
                <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-[#2f2440]"><div className="h-full rounded-full bg-[linear-gradient(90deg,#8960c5,#f2ca7c)]" style={{ width: `${pct}%` }} /></div>
                <div className="mt-1.5 flex justify-between text-[10px] text-[var(--muted)]"><span>{fa(p.xp)} تجربه</span><span>تا سطح بعد {fa(Math.max(0, next - p.xp))}</span></div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[["crown", p.cups, "جام"], ["fire", p.streak, "روز پیاپی"], ["medal", store.medals.length, "مدال"]].map(([ic, v, l]) => (
                    <div key={l as string} className="rounded-xl border border-[var(--line)] bg-[#221a2d] py-2.5">
                      <Icon name={ic as string} size={15} className="mx-auto text-[var(--gold)]" />
                      <div className="text-sm font-black">{fa(v as number)}</div>
                      <div className="text-[9px] text-[var(--muted)]">{l}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center">
                <Icon name="user" size={30} className="mx-auto text-[var(--purple)]" />
                <h3 className="mt-2 text-sm font-bold">به جمع ما بپیوند</h3>
                <p className="my-2 text-[11px] text-[var(--muted)]">با موبایل، گوگل یا حساب میهمان وارد شو.</p>
                <button className="btn gm-glow full" onClick={onLogin}>ورود / ثبت‌نام</button>
              </div>
            )}
          </div>

          <div className="gm-panel p-5">
            <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold"><Icon name="flag" size={16} className="text-[var(--gold)]" /> رویدادهای زنده</h3>
            <div className="grid gap-2">
              {store.events.filter((e) => e.active && e.kind !== "league").slice(0, 3).map((e) => (
                <button key={e.id} className="flex items-center gap-2.5 rounded-xl p-1.5 text-right hover:bg-[#2c2039]" onClick={() => go(`events/${e.id}`)}>
                  <img src={e.logo} alt="" className="size-10" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-bold">{e.title}</span><span className="text-[10px] text-[var(--muted)]">{fa(e.results.length)} شرکت‌کننده</span></span>
                </button>
              ))}
            </div>
          </div>

          <div className="gm-panel overflow-hidden">
            <img src={experienceArt} alt="" className="w-full" />
            <div className="p-5">
              <h3 className="text-[13px] font-bold">دانشگاه تجربه</h3>
              <p className="my-1.5 text-[11px] leading-6 text-[var(--muted)]">آخرین پست: {store.posts.find((x) => x.status === "approved")?.author} · {relTime(store.posts[0]?.at || Date.now())}</p>
              <button className="btn secondary sm full" onClick={() => go("feed")}><Icon name="feed" size={14} /> رفتن به فید</button>
            </div>
          </div>
        </aside>
      </div>

      <Modal open={!!story} onClose={() => setStory(null)} title={story?.author || ""}>
        {story && (
          <div className="grid min-h-72 place-items-center rounded-2xl p-6 text-center" style={{ background: `linear-gradient(160deg, ${story.color}, #241b30)` }}>
            {story.image && <img src={story.image} alt="" className="mb-3 max-h-72 rounded-xl" />}
            <p className="text-lg font-bold">{story.text}</p>
            <span className="text-[10px] text-white/70">{relTime(story.at)} · {fa(story.views)} بازدید</span>
          </div>
        )}
      </Modal>
    </>
  );
}
