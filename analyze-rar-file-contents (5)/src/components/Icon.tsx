import { iconPaths } from "../data/icons";

type Props = {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 20, className = "", strokeWidth = 1.7 }: Props) {
  const path = iconPaths[name] || iconPaths.spark || "";
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

export const fa = (n: number | undefined) => new Intl.NumberFormat("fa-IR").format(n ?? 0);
export const faDate = (t: number) =>
  new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" }).format(new Date(t));
export const faTime = (t: number) =>
  new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(new Date(t));

export function relTime(t: number) {
  const diff = Date.now() - t;
  const m = Math.round(diff / 60000);
  if (m < 1) return "همین حالا";
  if (m < 60) return `${fa(m)} دقیقه پیش`;
  const h = Math.round(m / 60);
  if (h < 24) return `${fa(h)} ساعت پیش`;
  const d = Math.round(h / 24);
  if (d < 30) return `${fa(d)} روز پیش`;
  return faDate(t);
}
