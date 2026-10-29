import type { Role } from "@/lib/types";

/** Iniciales con el degradado de cada rol. */
export function Initials({ name, role, size = "md" }: { name: string; role: Role; size?: "md" | "xl" }) {
  const bg = role === "owner" ? "linear-gradient(135deg, #0b1b2b, #035e94)" : role === "seller" ? "linear-gradient(135deg, #0096d6, #3fd0ff)" : "linear-gradient(135deg, #12b886, #3fd0ff)";
  const letters = name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <span className={`grid shrink-0 place-items-center rounded-2xl font-display font-extrabold text-white ${size === "xl" ? "h-24 w-24 rounded-[28px] text-3xl sm:h-28 sm:w-28 sm:text-4xl" : "h-12 w-12 text-base"}`} style={{ background: bg }}>
      {letters}
    </span>
  );
}
