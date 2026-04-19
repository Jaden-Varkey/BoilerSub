import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand-blue text-white hover:bg-[#003ea0]",
  secondary: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
  ghost: "bg-transparent text-slate-700 hover:bg-white/70",
  danger: "bg-brand-coral text-white hover:bg-[#872f0d]",
};

export function buttonClassName(variant: Variant = "primary", className = "") {
  return `inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`;
}

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={buttonClassName(variant, className)}
      {...props}
    />
  );
}
