import { useCallback, useEffect, useRef, useState } from "react";
import { Layout } from "./components/Layout";
import { Assistant, InterestsPrompt, InviteModal, LoginDialog, NotifyPrompt, PushToast } from "./components/Overlays";
import { HomePage } from "./pages/Home";
import { TopicsPage } from "./pages/Topics";
import { ChallengePage } from "./pages/Challenge";
import { LeaderboardPage } from "./pages/Leaderboard";
import { FeedPage, MessagesPage, PlayersPage } from "./pages/Social";
import { EventsPage, LeaguesPage, OrgsPage, RewardsPage, ShopPage, SuggestPage, SupportPage } from "./pages/Community";
import { LearnPage } from "./pages/Learn";
import { SettingsPage } from "./pages/Settings";
import { MatchPage } from "./pages/Match";
import { AdminPanel } from "./pages/admin/AdminPanel";
import { getStore, makeProfile, notify, resetStore, today, useStore } from "./lib/store";
import { createMatch, dailyQuestions, pick, STAGE_MS } from "./lib/engine";
import { startLive } from "./lib/live";
import { installGlobalClickSound, pushNotify, setMusic, sfx } from "./lib/sound";
import type { GameEvent, MatchState, Mode, Notice, Player } from "./lib/types";

type BIP = Event & { prompt: () => Promise<void> };

export default function App() {
  const [store, update] = useStore();
  const [route, setRoute] = useState(() => location.hash.replace("#", "") || "home");
  const [search, setSearch] = useState("");
  const [login, setLogin] = useState(false);
  const [match, setMatchState] = useState<MatchState | null>(null);
  const [toast, setToast] = useState<Notice | null>(null);
  const [waiting, setWaiting] = useState<string | null>(null);
  const [install, setInstall] = useState<BIP | null>(null);
  const [laterInterests, setLaterInterests] = useState(false);
  const seen = useRef(new Set(store.notices.map((n) => n.id)));
  const matchRef = useRef(match);
  matchRef.current = match;

  const setMatch = useCallback((fn: (p: MatchState) => MatchState) => setMatchState((m) => (m ? fn(m) : m)), []);

  const go = useCallback((r: string) => {
    const clean = r.replace(/^#/, "");
    setRoute(clean);
    if (location.hash !== `#${clean}`) location.hash = clean;
    window.scrollTo({ top: 0 });
    sfx("nav");
  }, []);

  useEffect(() => {
    const sync = () => setRoute(location.hash.replace("#", "") || "home");
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  /* صدای ملایم کلیک + موسیقی پس از اولین تعامل (سیاست پخش خودکار مرورگر) */
  useEffect(() => {
    const off = installGlobalClickSound();
    const first = () => { if (getStore().music) setMusic(true); window.removeEventListener("pointerdown", first); };
    window.addEventListener("pointerdown", first);
    const bip = (e: Event) => { e.preventDefault(); setInstall(e as BIP); };
    window.addEventListener("beforeinstallprompt", bip);
    return () => { off(); window.removeEventListener("pointerdown", first); window.removeEventListener("beforeinstallprompt", bip); };
  }, []);

  /* موتور زنده (کادر ۲۴ ساعته) */
  useEffect(() => startLive({ isBusy: () => !!matchRef.current, go }), [go]);

  /* اعلان کشویی برای اعلان‌های تازه */
  useEffect(() => {
    const fresh = store.notices.find((n) => !seen.current.has(n.id));
    store.notices.forEach((n) => seen.current.add(n.id));
    if (fresh && !match) setToast(fresh);
  }, [store.notices, match]);

  const startMatch = useCallback(
    (category: string, mode: Mode, opts: { rival?: Player | null; eventId?: string } = {}) => {
      const s = getStore();
      if (!s.profile) return setLogin(true);
      sfx("whoosh");
      setMatchState(createMatch(s, category, mode, opts));
      window.scrollTo({ top: 0 });
    },
    []
  );

  /* ارسال دعوت به یک بازیکن مشخص */
  const invitePlayer = useCallback(
    (p: Player, category?: string) => {
      const s = getStore();
      if (!s.profile) return setLogin(true);
      const cat = category || s.profile.interests[0] || "general";
      setWaiting(p.name);
      setTimeout(() => {
        setWaiting(null);
        if (p.chatPrivacy === "off" && p.kind !== "staff") {
          notify({ title: "دعوت پذیرفته نشد", body: `${p.name} دعوت‌ها را بسته است.`, link: "challenge", kind: "invite" });
          return;
        }
        if (Math.random() < 0.9) {
          sfx("jingle");
          startMatch(cat, "computer", { rival: p });
        } else notify({ title: "دعوت رد شد", body: `${p.name} الان در دسترس نیست. حریف دیگری انتخاب کن.`, link: "challenge", kind: "invite" });
      }, 1600 + Math.random() * 1600);
    },
    [startMatch]
  );

  const invite = !match ? store.invites[0] : undefined;
  const acceptInvite = () => {
    if (!invite) return;
    const p = store.players.find((x) => x.id === invite.from) || null;
    update((s) => ({ ...s, invites: s.invites.filter((i) => i.id !== invite.id) }));
    startMatch(invite.category, "computer", { rival: p, eventId: invite.eventId });
  };
  const declineInvite = useCallback(() => update((s) => ({ ...s, invites: s.invites.slice(1) })), [update]);

  const playEvent = (e: GameEvent) => {
    const rival = pick(store.players.filter((p) => p.kind === "staff"));
    startMatch(e.category, "event", { rival, eventId: e.id });
  };
  const playDaily = () => {
    const s = getStore();
    if (!s.profile) return setLogin(true);
    const qs = dailyQuestions(s, today());
    setMatchState(createMatch(s, qs[0]?.category || "general", "daily", { questions: qs }));
  };

  const resume = () => {
    if (!store.openMatch) return;
    const m = store.openMatch;
    setMatchState({ ...m, phase: m.phase === "reveal" || m.phase === "intro" ? "playing" : m.phase, roundAt: Date.now() + STAGE_MS.timer, rivalPlan: null });
  };

  const [name, arg = ""] = route.split("/");
  const p = store.profile;
  const reset = () => { if (confirm("همهٔ پیشرفت و داده‌های تو پاک می‌شود. مطمئنی؟")) { resetStore(); go("home"); } };

  const page = () => {
    switch (name) {
      case "topics": return <TopicsPage store={store} search={search} onSearch={setSearch} onStart={(c, m) => startMatch(c, m)} />;
      case "challenge": return <ChallengePage store={store} onStart={(c, m, r) => startMatch(c, m, { rival: r })} onInvite={invitePlayer} onLogin={() => setLogin(true)} />;
      case "leaderboard": return <LeaderboardPage store={store} onInvite={(id) => { const pl = store.players.find((x) => x.id === id); if (pl) invitePlayer(pl); }} />;
      case "feed": return <FeedPage store={store} update={update} onLogin={() => setLogin(true)} />;
      case "messages": return <MessagesPage store={store} update={update} thread={arg} go={go} onInvite={(pl) => invitePlayer(pl)} />;
      case "events": return <EventsPage store={store} id={arg} go={go} onPlay={playEvent} onLogin={() => setLogin(true)} />;
      case "rewards": return <RewardsPage store={store} update={update} />;
      case "shop": return <ShopPage store={store} update={update} />;
      case "suggest": return <SuggestPage store={store} update={update} onLogin={() => setLogin(true)} />;
      case "learn": return <LearnPage store={store} update={update} onStart={(c) => startMatch(c, "practice")} />;
      case "players": return <PlayersPage store={store} update={update} go={go} onInvite={(pl) => invitePlayer(pl)} />;
      case "orgs": return <OrgsPage store={store} />;
      case "leagues": return <LeaguesPage store={store} update={update} go={go} onLogin={() => setLogin(true)} />;
      case "support": return <SupportPage store={store} update={update} onLogin={() => setLogin(true)} />;
      case "settings":
      case "profile": return <SettingsPage store={store} update={update} onReset={reset} onLogin={() => setLogin(true)} canInstall={!!install} onInstall={() => (install ? void install.prompt() : alert("در کروم اندروید: منوی ⋮ ← «افزودن به صفحهٔ اصلی» (Add to Home screen). در آیفون: دکمهٔ اشتراک ← Add to Home Screen."))} />;
      case "admin": return <AdminPanel store={store} update={update} />;
      default: return <HomePage store={store} go={go} onStart={(c, m) => startMatch(c, m)} onLogin={() => setLogin(true)} onResume={resume} onForfeit={() => update((s) => ({ ...s, openMatch: null }))} onDaily={playDaily} onInvite={(pl) => invitePlayer(pl)} />;
    }
  };

  return (
    <>
      {match ? (
        <MatchPage
          match={match}
          setMatch={setMatch}
          store={store}
          onExit={() => { setMatchState(null); go("home"); }}
          onRematch={(category, rival) => { setMatchState(null); setTimeout(() => startMatch(category, rival ? "computer" : "practice", { rival }), 60); }}
          onEvent={(id) => { setMatchState(null); go(`events/${id}`); }}
        />
      ) : (
        <Layout
          route={route}
          go={go}
          store={store}
          onLogin={() => setLogin(true)}
          onMusic={() => update((s) => ({ ...s, music: !s.music }))}
          onNotice={(link, id) => { update((s) => ({ ...s, notices: s.notices.map((n) => (n.id === id ? { ...n, read: true } : n)) })); if (link !== "invite") go(link); }}
          onReadAll={() => update((s) => ({ ...s, notices: s.notices.map((n) => ({ ...n, read: true })) }))}
          search={search}
          onSearch={setSearch}
        >
          {page()}
        </Layout>
      )}

      {!match && <Assistant go={go} />}

      {waiting && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-black/60 backdrop-blur-sm">
          <div className="gm-panel gm-pop p-7 text-center"><div className="mx-auto size-12 animate-spin rounded-full border-4 border-[var(--purple)] border-t-transparent" /><p className="mt-4 text-sm">دعوت برای <b>{waiting}</b> ارسال شد…</p><p className="text-[11px] text-[var(--muted)]">منتظر پذیرش هستیم</p></div>
        </div>
      )}

      {invite && <InviteModal key={invite.id} store={store} invite={invite} onAccept={acceptInvite} onDecline={declineInvite} />}

      {toast && (
        <PushToast
          notice={toast}
          onClose={() => setToast(null)}
          onOpen={() => { update((s) => ({ ...s, notices: s.notices.map((n) => (n.id === toast.id ? { ...n, read: true } : n)) })); if (toast.link !== "invite") go(toast.link); setToast(null); }}
        />
      )}

      {p && !store.notifAsked && !match && <NotifyPrompt onDone={() => update((s) => ({ ...s, notifAsked: true }))} />}

      {p && !p.interestsSet && !laterInterests && !match && (
        <InterestsPrompt store={store} onLater={() => setLaterInterests(true)} onSave={(v) => { update((s) => (s.profile ? { ...s, profile: { ...s.profile, interests: v, interestsSet: true } } : s)); sfx("coin"); }} />
      )}

      {login && (
        <LoginDialog
          store={store}
          onClose={() => setLogin(false)}
          onDone={(d) => {
            update((s) => ({ ...s, profile: makeProfile(d.name, d.avatar, d.interests, d.provider, { phone: d.phone, email: d.email }) }));
            sfx("win");
            setLogin(false);
            if (!d.interests.length) {
              notify({ title: "علاقه‌مندی‌هایت را انتخاب کن", body: "سه موضوع دلخواهت را از تنظیمات مشخص کن تا پیشنهادها دقیق شوند.", link: "settings", kind: "system" });
              pushNotify("خوش آمدی!", "سه موضوع دلخواهت را انتخاب کن.");
            }
            go("home");
          }}
        />
      )}
    </>
  );
}
