import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

/** Card dasar design system — radius modern + shadow lembut */
export function Card({ padded = true, className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-2xl bg-white shadow-card ring-1 ring-slate-900/5 ${
        padded ? "p-4" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
