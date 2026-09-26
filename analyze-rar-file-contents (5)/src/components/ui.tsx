import { useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { avatars } from "../data/art";
import { BGS, HAIR_COLORS, OPTIONS, OUTFITS, SKINS, avatarUri, presetCfgs, randomCfg } from "../lib/avatar";
import type { AvatarCfg, AvatarRef } from "../lib/types";

export { Icon, fa, faDate, faTime, relTime } from "./Icon";

export const avatarSrc = (a: AvatarRef | undefined) =>
  typeof a === "number" ? avatars[((a % avatars.length) + avatars.length) % avatars.length] : a ? avatarUri(a) : avatars[0];

export function Avatar({ a, size = 40, className = "", ring = "#675177", online }: { a: AvatarRef | undefined; size?: number; className?: string; ring?: string; online?: boolean }) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <img src={avatarSrc(a)} alt="" className="size-full rounded-full object-cover" style={{ border: `2px solid ${ring}`, background: "#3b2c4c" }} />
      {online && <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-[#241b30] bg-[#5ee0a0]" />}
    </span>
  );
}

export function PageHead({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="gm-pop mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-[24px] leading-tight font-bold">{title}</h1>
        {sub && <p className="mt-1 text-xs text-[var(--muted)]">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="gm-panel flex flex-col items-center gap-3 px-6 py-14 text-center">
      <Icon name="spark" size={34} className="text-[var(--gold)]" />
      <h3 className="text-base font-bold">{title}</h3>
      <p className="max-w-md text-xs leading-6 text-[var(--muted)]">{body}</p>
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-3 backdrop-blur-sm" onClick={onClose}>
      <div className={`gm-panel gm-pop max-h-[92vh] w-full overflow-y-auto ${wide ? "max-w-3xl" : "max-w-lg"}`} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[#221a2d] px-5 py-3.5">
          <h3 className="text-[15px] font-bold">{title}</h3>
          <button onClick={onClose} aria-label="بستن">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/**
 * خواندن و فشرده‌سازی عکس — روی موبایل هم کار می‌کند.
 * علت مشکل قبلی: فایل‌های حجیم دوربین گوشی (۵ تا ۱۲ مگابایت / HEIC) بدون فشرده‌سازی ارسال نمی‌شدند.
 */
export async function readImage(file: File, max = 1280, quality = 0.82): Promise<string> {
  const raw = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("read"));
    r.readAsDataURL(file);
  });
  if (file.type === "image/svg+xml" || file.type === "image/gif") return raw;
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("decode"));
      i.src = raw;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    if (raw.length < 3_000_000) return raw;
    throw new Error("فرمت این عکس در مرورگر قابل خواندن نیست؛ لطفاً JPG یا PNG انتخاب کن.");
  }
}

export function ImagePick({ onPick, label = "انتخاب عکس", className = "btn secondary sm", max }: { onPick: (d: string) => void; label?: string; className?: string; max?: number }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.click()} disabled={busy}>
        <Icon name="image" size={14} /> {busy ? "در حال آماده‌سازی…" : label}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          try {
            onPick(await readImage(f, max));
          } catch (err) {
            alert((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}

export function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" className="flex w-full items-center gap-3 py-1.5 text-right" onClick={() => onChange(!on)}>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px]">{label}</span>
        {hint && <span className="block text-[10px] text-[var(--muted)]">{hint}</span>}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-[var(--purple2)]" : "bg-[#3a2c46]"}`}>
        <span className={`absolute top-1 size-4 rounded-full bg-white transition-all ${on ? "right-1" : "right-6"}`} />
      </span>
    </button>
  );
}

/* ---------- آواتارساز ---------- */
export function AvatarBuilder({ value, onChange }: { value: AvatarRef; onChange: (a: AvatarRef) => void }) {
  const cfg: AvatarCfg = typeof value === "number" ? presetCfgs[0] : value;
  const set = <K extends keyof AvatarCfg>(k: K, v: AvatarCfg[K]) => onChange({ ...cfg, [k]: v });
  const Row = ({ label, k }: { label: string; k: keyof typeof OPTIONS }) => (
    <div>
      <div className="mb-1.5 text-[11px] text-[var(--muted)]">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {OPTIONS[k].map(([id, name]) => (
          <button key={id} type="button" className={`pill ${cfg[k] === id ? "gold" : ""}`} onClick={() => set(k, id as never)}>
            {name}
          </button>
        ))}
      </div>
    </div>
  );
  const Colors = ({ label, k, list }: { label: string; k: "bg" | "skin" | "hairColor" | "outfit"; list: string[] }) => (
    <div>
      <div className="mb-1.5 text-[11px] text-[var(--muted)]">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {list.map((c) => (
          <button key={c} type="button" aria-label={c} onClick={() => set(k, c)} className="size-7 rounded-full border-2" style={{ background: c, borderColor: cfg[k] === c ? "#f2ca7c" : "#3a2c46" }} />
        ))}
      </div>
    </div>
  );
  return (
    <div className="grid gap-4 md:grid-cols-[180px_1fr]">
      <div className="text-center">
        <img src={avatarUri(cfg)} alt="" className="mx-auto size-40 rounded-[36px] border-4 border-[var(--gold)]" />
        <button type="button" className="btn secondary sm mt-3" onClick={() => onChange(randomCfg())}>
          <Icon name="refresh" size={14} /> تصادفی
        </button>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {presetCfgs.map((p, i) => (
            <button key={i} type="button" onClick={() => onChange(p)} aria-label={`آواتار آماده ${i + 1}`}>
              <img src={avatarUri(p)} alt="" className="rounded-xl border border-[#4a3a5c]" />
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3">
        <Row label="مو / پوشش سر" k="hair" />
        <Colors label="رنگ مو / روسری" k="hairColor" list={HAIR_COLORS} />
        <Colors label="رنگ پوست (فانتزی هم دارد!)" k="skin" list={SKINS} />
        <Row label="چشم" k="eyes" />
        <Row label="عینک" k="glasses" />
        <Row label="سبیل و ریش" k="facial" />
        <Row label="لب" k="mouth" />
        <Row label="تزئین" k="extra" />
        <Colors label="لباس" k="outfit" list={OUTFITS} />
        <Colors label="پس‌زمینه" k="bg" list={BGS} />
      </div>
    </div>
  );
}
