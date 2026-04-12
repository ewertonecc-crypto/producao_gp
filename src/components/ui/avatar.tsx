import { cn, avatarInitials } from "@/lib/utils";

const AV_GRADIENTS = [
  "from-indigo-500 to-violet-400",
  "from-cyan-400 to-indigo-500",
  "from-emerald-500 to-cyan-400",
  "from-amber-400 to-rose-400",
];

interface AvatarProps {
  nome?: string | null;
  index?: number;
  size?: "sm" | "md";
  className?: string;
}

export function Avatar({ nome, index = 0, size = "sm", className }: AvatarProps) {
  const gradient = AV_GRADIENTS[index % AV_GRADIENTS.length];
  const sizeClass = size === "sm" ? "w-6 h-6 text-[9px]" : "w-8 h-8 text-[11px]";
  return (
    <div className={cn(
      "rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white flex-shrink-0",
      gradient, sizeClass, className
    )}>
      {avatarInitials(nome)}
    </div>
  );
}

interface AvatarStackProps {
  nomes: (string | null | undefined)[];
  max?: number;
}

export function AvatarStack({ nomes, max = 3 }: AvatarStackProps) {
  const visible = nomes.slice(0, max);
  const extra = nomes.length - max;
  return (
    <div className="flex">
      {visible.map((nome, i) => (
        <Avatar
          key={i}
          nome={nome}
          index={i}
          size="sm"
          className={cn("border-2 border-[#141424]", i > 0 && "-ml-1.5")}
        />
      ))}
      {extra > 0 && (
        <div className="w-6 h-6 rounded-full bg-[#1A1A2E] border-2 border-[#141424] -ml-1.5 flex items-center justify-center text-[8px] font-mono text-[var(--text-muted)]">
          +{extra}
        </div>
      )}
    </div>
  );
}
