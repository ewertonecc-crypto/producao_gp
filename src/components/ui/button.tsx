import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-[12.5px] font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-[0_3px_12px_rgba(99,102,241,0.3)] hover:shadow-[0_5px_18px_rgba(99,102,241,0.4)] hover:-translate-y-px",
        secondary:
          "bg-[#141424] text-[var(--text-primary)] border border-white/[0.12] hover:border-indigo-500/35 hover:text-[var(--accent-bright)]",
        ghost:
          "bg-transparent text-[var(--text-secondary)] border border-transparent hover:bg-[#141424] hover:text-[var(--text-primary)]",
        danger:
          "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/18",
        success:
          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/18",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 px-3 text-[11.5px]",
        lg: "h-10 px-5 text-[14px]",
        icon: "h-8 w-8 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
