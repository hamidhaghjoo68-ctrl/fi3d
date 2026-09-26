import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Empty, Icon, ImagePick, Modal, PageHead, fa, faTime, relTime } from "../components/ui";
import { allCategories, levelOf } from "../lib/engine";
import { canChat, canSee, notify, uid } from "../lib/store";
import { scheduleReply } from "../lib/live";
import { sfx } from "../lib/sound";
import type { Player, Post, Store } from "../lib/types";

type Up = (fn: (s: Store) => Store) => void;

/* =================== فید و پست‌ها =================== */
export function FeedPage({ store, update, onLogin }: { store: Store; update: Up; onLogin: () => void }) {
  const [body, setBody] = useState("");
  const [cat, setCat] = useState("work");
  const [media, setMedia] = useState("");
  const [tab, setTab] = useState<"all" | "saved" | "mine">("all");
  const [openC, setOpenC] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [storyImg, setStoryImg] = useState("");
  const p = store.profile;
  const cats = allCategories(store);
  const list = store.posts.filter((x) => (x.status === "approved" || (x.authorId === p?.id && x.status === "pending")) && (tab === "saved" ? x.saved : tab === "mine" ? x.authorId === p?.id : true));

  const publish = () => {
    if (!p) return onLogin();
    if (body.trim().length < 8 && !media) return;
    const status = store.settings.moderatePosts ? "pending" : "approved";
    const post: Post = { id: uid("post"), author: p.name, authorId: p.id, avatar: p.avatar, category: cat, body: body.trim(), media, likes: 0, liked: false, saved: false, comments: [], at: Date.now(), status };
    update((s) => ({ ...s, posts: [post, ...s.posts], profile: s.profile ? { ...s.profile, coins: s.profile.coins + 5 } : s.profile }));
    sfx("coin");
    if (status === "pending") notify({ title: "پست تو ثبت شد", body: "پس از بررسی مدیر منتشر می‌شود.", link: "feed", kind: "system" });
    setBody("");
    setMedia("");
  };
  const toggle = (id: string, key: "liked" | "saved") => update((s) => ({ ...s, posts: s.posts.map((x) => (x.id === id ? { ...x, [key]: !x[key], likes: key === "liked" ? x.likes + (x.liked ? -1 : 1) : x.likes } : x)) }));
  const comment = (id: string) => {
    if (!p || draft.trim().length < 2) return;
    update((s) => ({ ...s, posts: s.posts.map((x) => (x.id === id ? { ...x, comments: [...x.comments, { id: uid("c"), author: p.name, avatar: p.avatar, body: draft.trim(), at: Date.now() }] } : x)) }));
    setDraft("");
  };
  const addStory = () => {
    if (!p || (!storyText.trim() && !storyImg)) return;
    update((s) => ({ ...s, stories: [{ id: uid("story"), author: p.name, avatar: p.avatar, text: storyText.trim(), image: storyImg, color: "#8960c5", at: Date.now(), status: s.settings.moderateStories ? "pending" : "approved", views: 0 }, ...s.stories] }));
    setStoryOpen(false);
    setStoryText("");
    setStoryImg("");
    notify({ title: "استوری ثبت شد", body: store.settings.moderateStories ? "پس از بررسی نمایش داده می‌شود." : "استوری تو منتشر شد.", link: "home", kind: "system" });
  };

  return (
    <>
      <PageHead title="فید و پست‌ها" sub="دانشگاه تجربه؛ یاد بگیر و تجربه‌ات را بنویس" action={
        <div className="flex flex-wrap gap-2">
          <button className="btn sm" onClick={() => (p ? setStoryOpen(true) : onLogin())}><Icon name="plus" size={14} /> استوری / وضعیت</button>
          {(["all", "mine", "saved"] as const).map((t) => <button key={t} className={`btn sm ${tab === t ? "primary" : "ghost"}`} onClick={() => setTab(t)}>{t === "all" ? "همه" : t === "mine" ? "پست‌های من" : "ذخیره‌ها"}</button>)}
        </div>
      } />
      <div className="mx-auto max-w-2xl">
        <div className="gm-panel mb-5 p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <Avatar a={p?.avatar ?? 6} size={40} />
            <div className="text-[13px] font-bold">{p ? `${p.name}، امروز چه یاد گرفتی؟` : "برای نوشتن، وارد شو"}</div>
          </div>
          <textarea className="field min-h-24 resize-y leading-7" placeholder="چه اتفاقی افتاد، چه کردی و چه چیزی یاد گرفتی؟" value={body} onChange={(e) => setBody(e.target.value)} />
          {media && <div className="relative mt-3"><img src={media} alt="" className="max-h-72 rounded-xl" /><button className="absolute top-2 left-2 rounded-full bg-black/70 p-1.5" onClick={() => setMedia("")}><Icon name="close" size={14} /></button></div>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select className="field max-w-44" value={cat} onChange={(e) => setCat(e.target.value)}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <ImagePick onPick={setMedia} label="افزودن عکس" />
            <button className="btn sm mr-auto" onClick={publish} disabled={body.trim().length < 8 && !media}><Icon name="send" size={14} /> انتشار (۵+ سکه)</button>
          </div>
          {store.settings.moderatePosts && <p className="mt-2 text-[10px] text-[var(--muted)]">پست‌ها پیش از انتشار توسط مدیر بررسی می‌شوند.</p>}
        </div>
        <div className="grid gap-4">
          {list.map((post) => {
            const c = cats.find((x) => x.id === post.category);
            return (
              <article key={post.id} className="gm-panel gm-pop overflow-hidden">
                <div className="flex items-center gap-3 px-5 pt-4">
                  <Avatar a={post.avatar} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold">{post.author} {post.status === "pending" && <span className="pill gold">در انتظار بررسی</span>}</div>
                    <div className="text-[10px] text-[var(--muted)]">{relTime(post.at)} · {c?.name}</div>
                  </div>
                </div>
                <p className="px-5 py-4 text-[13px] leading-8 whitespace-pre-line">{post.body}</p>
                {post.media && <img src={post.media} alt="" className="w-full border-y border-[var(--line)]" />}
                <div className="flex gap-1 px-3 py-2">
                  <Act icon="heart" active={post.liked} label={fa(post.likes)} onClick={() => toggle(post.id, "liked")} />
                  <Act icon="chat" label={fa(post.comments.length)} onClick={() => setOpenC(openC === post.id ? null : post.id)} />
                  <Act icon="bookmark" active={post.saved} label="ذخیره" onClick={() => toggle(post.id, "saved")} />
                </div>
                {openC === post.id && (
                  <div className="border-t border-[var(--line)] bg-[#1f1729] px-5 py-4">
                    {post.comments.map((cm) => (
                      <div key={cm.id} className="mb-2.5 flex gap-2.5"><Avatar a={cm.avatar} size={30} /><div className="rounded-xl bg-[#291f37] px-3 py-1.5"><div className="text-[11px] font-bold">{cm.author}</div><p className="text-xs leading-6">{cm.body}</p></div></div>
                    ))}
                    <div className="flex gap-2"><input className="field" placeholder="نظرت را بنویس…" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && comment(post.id)} /><button className="btn sm" onClick={() => comment(post.id)} disabled={!p}><Icon name="send" size={14} /></button></div>
                  </div>
                )}
              </article>
            );
          })}
          {!list.length && <Empty title="چیزی اینجا نیست" body="اولین تجربه‌ات را بنویس." />}
        </div>
      </div>
      <Modal open={storyOpen} onClose={() => setStoryOpen(false)} title="استوری / وضعیت تازه">
        <textarea className="field min-h-20" placeholder="وضعیتت را بنویس…" value={storyText} onChange={(e) => setStoryText(e.target.value)} />
        {storyImg && <img src={storyImg} alt="" className="mt-3 max-h-60 rounded-xl" />}
        <div className="mt-3 flex gap-2"><ImagePick onPick={setStoryImg} /><button className="btn mr-auto" onClick={addStory}>انتشار</button></div>
      </Modal>
    </>
  );
}
function Act({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean; onClick: () => void }) {
  return <button className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] hover:bg-[#2f2440] ${active ? "text-[var(--gold)]" : "text-[var(--muted)]"}`} onClick={onClick}><Icon name={icon} size={16} /> {label}</button>;
}

/* =================== گفت‌وگو =================== */
export function MessagesPage({ store, update, thread, go, onInvite }: { store: Store; update: Up; thread: string; go: (r: string) => void; onInvite: (p: Player) => void }) {
  const [text, setText] = useState("");
  const [img, setImg] = useState("");
  const [q, setQ] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const p = store.profile;
  const threads = useMemo(() => {
    const ids = [...new Set(store.messages.map((m) => m.thread))];
    return ids.map((id) => store.players.find((x) => x.id === id)).filter((x): x is Player => !!x && canSee(store, x));
  }, [store]);
  const peer = store.players.find((x) => x.id === thread);
  const msgs = store.messages.filter((m) => m.thread === thread);
  const perm = peer ? canChat(store, peer) : { ok: false };
  const contacts = store.players.filter((x) => x.kind !== "bot" && canSee(store, x) && (!q.trim() || x.name.includes(q.trim()))).slice(0, 30);

  useEffect(() => {
    if (!thread) return;
    update((s) => ({ ...s, messages: s.messages.map((m) => (m.thread === thread && m.from !== "me" && !m.read ? { ...m, read: true } : m)) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread, msgs.length]);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs.length]);

  const send = () => {
    if (!peer || !perm.ok || (!text.trim() && !img)) return;
    update((s) => ({ ...s, messages: [...s.messages, { id: uid("msg"), thread: peer.id, from: "me", text: text.trim(), image: img || undefined, at: Date.now(), read: true }] }));
    sfx("pop");
    setText("");
    setImg("");
    scheduleReply(peer.id, go);
  };

  if (!p) return <Empty title="گفت‌وگو" body="برای گفت‌وگو ابتدا وارد شو." />;

  return (
    <>
      <PageHead title="گفت‌وگو" sub={p.chatPrivacy === "off" ? "گفت‌وگوی تو در تنظیمات خاموش است." : p.chatPrivacy === "friends" ? "فقط دوستانت می‌توانند به تو پیام دهند." : "همه می‌توانند به تو پیام دهند."} action={<button className="btn ghost sm" onClick={() => go("settings")}><Icon name="lock" size={14} /> حریم خصوصی گفت‌وگو</button>} />
      <div className="gm-panel grid min-h-[70vh] overflow-hidden md:grid-cols-[280px_1fr]">
        <div className={`border-l border-[var(--line)] ${thread ? "hidden md:block" : ""}`}>
          <div className="border-b border-[var(--line)] p-3"><input className="field" placeholder="جست‌وجوی مخاطب…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="max-h-[62vh] overflow-y-auto">
            {(q ? contacts : threads.length ? threads : contacts).map((x) => {
              const last = [...store.messages].reverse().find((m) => m.thread === x.id);
              const unread = store.messages.filter((m) => m.thread === x.id && m.from !== "me" && !m.read).length;
              return (
                <button key={x.id} className={`flex w-full items-center gap-2.5 border-b border-[#2f2440] px-3 py-3 text-right hover:bg-[#2c2039] ${thread === x.id ? "bg-[#2d2140]" : ""}`} onClick={() => go(`messages/${x.id}`)}>
                  <Avatar a={x.avatar} size={40} online={Date.now() - x.lastSeen < 600000} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-bold">{x.name}</span><span className="block truncate text-[11px] text-[var(--muted)]">{last ? (last.image ? "📷 عکس" : last.text) : "شروع گفت‌وگو"}</span></span>
                  {unread > 0 && <span className="rounded-full bg-[var(--gold)] px-1.5 text-[10px] font-bold text-[#302132]">{fa(unread)}</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className={`flex min-h-0 flex-col ${!thread ? "hidden md:flex" : ""}`}>
          {peer ? (
            <>
              <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3">
                <button className="md:hidden" onClick={() => go("messages")}><Icon name="chevron" size={20} className="rotate-180" /></button>
                <Avatar a={peer.avatar} size={38} online={Date.now() - peer.lastSeen < 600000} />
                <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-bold">{peer.name}</div><div className="text-[10px] text-[var(--muted)]">{Date.now() - peer.lastSeen < 600000 ? "آنلاین" : `آخرین بازدید ${relTime(peer.lastSeen)}`}</div></div>
                <button className="btn sm primary" onClick={() => onInvite(peer)}><Icon name="bolt" size={13} /> مسابقه</button>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ maxHeight: "56vh" }}>
                {msgs.map((m) => (
                  <div key={m.id} className={`flex ${m.from === "me" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-[13px] leading-7 ${m.from === "me" ? "rounded-br-sm bg-[#4a3366]" : "rounded-bl-sm bg-[#2c203b]"}`}>
                      {m.deleted ? <i className="text-[11px] text-[var(--muted)]">این پیام توسط مدیر حذف شد.</i> : <>
                        {m.image && <img src={m.image} alt="" className="mb-1.5 max-h-64 rounded-xl" />}
                        {m.text}
                      </>}
                      <div className="text-left text-[9px] text-white/50">{faTime(m.at)}</div>
                    </div>
                  </div>
                ))}
                {!msgs.length && <p className="py-10 text-center text-xs text-[var(--muted)]">اولین پیام را بفرست 👋</p>}
                <div ref={endRef} />
              </div>
              {perm.ok ? (
                <div className="border-t border-[var(--line)] p-3">
                  {img && <div className="relative mb-2 inline-block"><img src={img} alt="پیش‌نمایش" className="max-h-32 rounded-xl" /><button className="absolute top-1 left-1 rounded-full bg-black/70 p-1" onClick={() => setImg("")}><Icon name="close" size={12} /></button><span className="mt-1 block text-[10px] text-[var(--green)]">پیش‌نمایش عکس — آمادهٔ ارسال</span></div>}
                  <div className="flex items-center gap-2">
                    <ImagePick onPick={setImg} label="" className="btn secondary sm !px-3" max={1024} />
                    <input className="field" placeholder="پیام…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
                    <button type="button" className="btn !px-4" onClick={send} disabled={!text.trim() && !img}><Icon name="send" size={16} /></button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-[var(--line)] p-4 text-center text-xs text-[var(--red)]"><Icon name="lock" size={14} className="ml-1 inline" /> {perm.reason}</div>
              )}
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-10 text-center text-xs text-[var(--muted)]">یک گفت‌وگو را انتخاب کن یا مخاطب تازه جست‌وجو کن.</div>
          )}
        </div>
      </div>
    </>
  );
}

/* =================== بازیکنان =================== */
export function PlayersPage({ store, update, go, onInvite }: { store: Store; update: Up; go: (r: string) => void; onInvite: (p: Player) => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Player | null>(null);
  const list = store.players.filter((p) => p.kind !== "bot" && canSee(store, p) && (!q.trim() || p.name.includes(q.trim())));
  const friends = store.profile?.friends || [];
  const toggleFriend = (id: string) => update((s) => (s.profile ? { ...s, profile: { ...s.profile, friends: s.profile.friends.includes(id) ? s.profile.friends.filter((x) => x !== id) : [...s.profile.friends, id] } } : s));

  return (
    <>
      <PageHead title="بازیکنان" sub={`${fa(list.length)} بازیکن قابل مشاهده · اعضای صفحه‌های سازمانی محرمانه فقط برای هم‌سازمانی‌ها نمایش داده می‌شوند.`} />
      <div className="mb-5 flex items-center gap-2 rounded-xl border border-[#33283d] bg-[#231a2c] px-4"><Icon name="search" size={16} /><input className="w-full bg-transparent py-3 text-[13px] outline-none" placeholder="جست‌وجوی بازیکن…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((p) => (
          <button key={p.id} className="gm-panel p-4 text-center transition hover:-translate-y-1" onClick={() => setSel(p)}>
            <Avatar a={p.avatar} size={64} online={Date.now() - p.lastSeen < 600000} />
            <div className="mt-2 truncate text-[13px] font-bold">{p.name}</div>
            <div className="text-[10px] text-[var(--muted)]">سطح {fa(levelOf(p.xp))} · {fa(p.cups)} جام</div>
            <div className="mt-2 flex justify-center gap-1">{p.kind === "staff" && <span className="pill">کادر</span>}{p.org && <span className="pill gold">{store.orgs.find((o) => o.id === p.org)?.name}</span>}{friends.includes(p.id) && <span className="pill green">دوست</span>}</div>
          </button>
        ))}
      </div>
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.name || ""}>
        {sel && (
          <div className="text-center">
            <Avatar a={sel.avatar} size={96} ring="#f2ca7c" />
            <p className="mt-3 text-xs text-[var(--muted)]">{sel.bio}</p>
            <div className="my-4 grid grid-cols-4 gap-2">{[["سطح", levelOf(sel.xp)], ["برد", sel.wins], ["جام", sel.cups], ["رتبه", sel.rating]].map(([l, v]) => <div key={l as string} className="rounded-xl bg-[#221a2d] py-2"><div className="font-black text-[var(--gold)]">{fa(v as number)}</div><div className="text-[10px] text-[var(--muted)]">{l}</div></div>)}</div>
            <div className="flex flex-wrap justify-center gap-2">
              <button className="btn" onClick={() => { onInvite(sel); setSel(null); }}><Icon name="bolt" size={14} /> دعوت به مسابقه</button>
              <button className="btn secondary" onClick={() => { go(`messages/${sel.id}`); setSel(null); }}><Icon name="chat" size={14} /> پیام</button>
              <button className="btn ghost" onClick={() => toggleFriend(sel.id)}><Icon name={friends.includes(sel.id) ? "check" : "plus"} size={14} /> {friends.includes(sel.id) ? "دوست هستید" : "افزودن دوست"}</button>
            </div>
            {!canChat(store, sel).ok && <p className="mt-3 text-[11px] text-[var(--red)]">{canChat(store, sel).reason}</p>}
          </div>
        )}
      </Modal>
    </>
  );
}
