import { useState } from "react";
import { Avatar, AvatarBuilder, Icon, PageHead, Toggle, fa, faDate } from "../components/ui";
import { allCategories, levelOf } from "../lib/engine";
import { askNotifyPermission, sfx } from "../lib/sound";
import type { AvatarRef, ChatPrivacy, Store } from "../lib/types";

type Props = { store: Store; update: (fn: (s: Store) => Store) => void; onReset: () => void; onLogin: () => void; onInstall: () => void; canInstall: boolean };

export function SettingsPage({ store, update, onReset, onLogin, onInstall, canInstall }: Props) {
  const p = store.profile;
  const [name, setName] = useState(p?.name || "");
  const [bio, setBio] = useState(p?.bio || "");
  const [avatar, setAvatar] = useState<AvatarRef>(p?.avatar ?? 0);
  const [perm, setPerm] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  const setProfile = (patch: Partial<NonNullable<Store["profile"]>>) => update((s) => (s.profile ? { ...s, profile: { ...s.profile, ...patch } } : s));

  if (!p) return (
    <div className="gm-panel mx-auto max-w-md p-8 text-center">
      <Icon name="user" size={34} className="mx-auto text-[var(--purple)]" />
      <h2 className="mt-3 font-bold">برای تنظیمات پروفایل وارد شو</h2>
      <button className="btn gm-glow mt-4" onClick={onLogin}>ورود / ثبت‌نام</button>
    </div>
  );

  const org = store.orgs.find((o) => o.id === p.org);
  return (
    <>
      <PageHead title="پروفایل و تنظیمات" sub={`عضو از ${faDate(p.createdAt)} · ورود با ${p.provider === "phone" ? `موبایل ${p.phone}` : p.provider === "google" ? `گوگل ${p.email || ""}` : "حساب میهمان"}`} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="gm-panel p-6 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold"><Icon name="user" size={17} className="text-[var(--gold)]" /> آواتارساز و پروفایل</h2>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <Avatar a={avatar} size={72} ring="#f2ca7c" />
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="نام نمایشی" />
              <input className="field" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="یک جمله دربارهٔ خودت" />
            </div>
            <div className="text-center text-[11px] text-[var(--muted)]">سطح {fa(levelOf(p.xp))}<br />{fa(p.wins)} برد از {fa(p.played)}</div>
          </div>
          <AvatarBuilder value={avatar} onChange={setAvatar} />
          <button className="btn gm-glow mt-4" onClick={() => { setProfile({ name: name.trim() || p.name, bio, avatar }); sfx("coin"); }}><Icon name="check" size={15} /> ذخیرهٔ پروفایل و آواتار</button>
        </section>

        <section className="gm-panel p-6">
          <h2 className="mb-2 flex items-center gap-2 text-[15px] font-bold"><Icon name="chat" size={17} className="text-[var(--gold)]" /> گفت‌وگو و حریم خصوصی</h2>
          <p className="mb-3 text-[11px] text-[var(--muted)]">انتخاب کن چه کسانی بتوانند به تو پیام بدهند یا دعوت به مسابقه بفرستند.</p>
          {([["all", "گفت‌وگو با همه", "همهٔ بازیکنان می‌توانند پیام بدهند"], ["friends", "فقط دوستانم", "فقط کسانی که به دوستانت اضافه کرده‌ای"], ["off", "خاموش", "هیچ‌کس پیام نمی‌دهد؛ دعوت‌ها هم نمی‌آید"]] as [ChatPrivacy, string, string][]).map(([id, l, h]) => (
            <button key={id} className={`mb-2 flex w-full items-center gap-3 rounded-xl border p-3 text-right ${p.chatPrivacy === id ? "border-[var(--gold)] bg-[#302535]" : "border-[var(--line)]"}`} onClick={() => setProfile({ chatPrivacy: id })}>
              <span className={`size-4 rounded-full border-2 ${p.chatPrivacy === id ? "border-[var(--gold)] bg-[var(--gold)]" : "border-[#6b5182]"}`} />
              <span><span className="block text-[13px]">{l}</span><span className="text-[10px] text-[var(--muted)]">{h}</span></span>
            </button>
          ))}
          <div className="mt-3 rounded-xl bg-[#221a2d] p-3 text-[11px] text-[var(--muted)]">
            <Icon name="briefcase" size={13} className="ml-1 inline" /> سازمان: {org ? <b className="text-[var(--gold)]">{org.name}</b> : "عمومی (عضو هیچ سازمانی نیستی)"} — عضویت سازمانی توسط مدیر تعیین می‌شود.
          </div>
        </section>

        <section className="gm-panel p-6">
          <h2 className="mb-2 flex items-center gap-2 text-[15px] font-bold"><Icon name="heart" size={17} className="text-[var(--gold)]" /> علاقه‌مندی‌ها (دست‌کم ۳ مورد)</h2>
          <div className="flex flex-wrap gap-2">
            {allCategories(store).map((c) => {
              const on = p.interests.includes(c.id);
              return <button key={c.id} className={`pill !py-1.5 ${on ? "gold" : ""}`} onClick={() => setProfile({ interests: on ? p.interests.filter((x) => x !== c.id) : [...p.interests, c.id], interestsSet: true })}><Icon name={c.icon} size={12} /> {c.name}</button>;
            })}
          </div>
        </section>

        <section className="gm-panel p-6">
          <h2 className="mb-3 flex items-center gap-2 text-[15px] font-bold"><Icon name="headphones" size={17} className="text-[var(--gold)]" /> صدا و اعلان</h2>
          <Toggle label="افکت‌های صوتی" hint="صدای کلیک، پاسخ درست/غلط، هشدار زمان" on={store.sound} onChange={(v) => update((s) => ({ ...s, sound: v }))} />
          <Toggle label="موسیقی زمینه" hint="همان دکمهٔ بالای صفحه" on={store.music} onChange={(v) => update((s) => ({ ...s, music: v }))} />
          <div className="my-3"><div className="mb-1 flex justify-between text-[12px]"><span>بلندی صدا</span><span className="text-[var(--gold)]">{fa(Math.round(store.volume * 100))}٪</span></div><input type="range" min={0} max={1} step={0.05} value={store.volume} onChange={(e) => update((s) => ({ ...s, volume: Number(e.target.value) }))} className="w-full accent-[var(--purple)]" /></div>
          <button className="btn secondary sm" onClick={async () => { const r = await askNotifyPermission(); setPerm(r); sfx("jingle"); }}>
            <Icon name="bell" size={14} /> {perm === "granted" ? "اعلان مرورگر فعال است ✓" : perm === "denied" ? "اعلان در مرورگر مسدود است (از تنظیمات مرورگر باز کن)" : "فعال‌سازی اعلان مرورگر"}
          </button>
        </section>

        <section className="gm-panel p-6">
          <h2 className="mb-3 flex items-center gap-2 text-[15px] font-bold"><Icon name="download" size={17} className="text-[var(--gold)]" /> اپ اندروید و داده‌ها</h2>
          <button className="btn sm mb-2" onClick={onInstall}><Icon name="download" size={14} /> {canInstall ? "نصب اپ روی گوشی" : "راهنمای نصب روی صفحهٔ اصلی گوشی"}</button>
          <p className="mb-3 text-[10px] leading-5 text-[var(--muted)]">در کروم اندروید: منوی ⋮ ← «افزودن به صفحهٔ اصلی». فایل APK از پنل مدیریت ← «ورود و زبان‌ها» ← کیت ساخت اندروید.</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn secondary sm" onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(store)], { type: "application/json" })); a.download = "gamify2-backup.json"; a.click(); }}><Icon name="download" size={14} /> پشتیبان</button>
            <button className="btn danger sm" onClick={onReset}><Icon name="logout" size={14} /> خروج و پاک کردن حساب</button>
          </div>
        </section>
      </div>
    </>
  );
}
