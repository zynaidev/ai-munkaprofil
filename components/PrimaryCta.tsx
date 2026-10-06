import type { ButtonHTMLAttributes, ReactNode } from "react";

// Fő CTA: lime pill nyíllal és glow-val. Linkként (href) vagy gombként használható.
// Hook nélküli, így szerver- és kliens-komponensben is működik.
const osztaly =
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-8 py-4 text-cta leading-none font-medium text-on-accent " +
  "shadow-[0_0_40px_rgba(189,255,0,0.3),0_0_80px_rgba(189,255,0,0.1)] transition-[filter,box-shadow] hover:brightness-110 " +
  "hover:shadow-[0_0_48px_rgba(189,255,0,0.4),0_0_96px_rgba(189,255,0,0.15)]";

function Nyil() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" className="shrink-0">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props =
  | { href: string; children: ReactNode; className?: string }
  | ({ href?: undefined; children: ReactNode; className?: string } & ButtonHTMLAttributes<HTMLButtonElement>);

export default function PrimaryCta(props: Props) {
  if (props.href !== undefined) {
    return (
      <a href={props.href} className={`${osztaly} ${props.className ?? ""}`}>
        {props.children}
        <Nyil />
      </a>
    );
  }
  const { children, className, ...gomb } = props;
  return (
    <button type="button" {...gomb} className={`${osztaly} ${className ?? ""}`}>
      {children}
      <Nyil />
    </button>
  );
}
