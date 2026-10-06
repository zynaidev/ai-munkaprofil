import type { ReactNode } from "react";

// Oldalszélesség: max. 1280 px, belül keskenyebb oszlop a tartalomnak (max-w-2xl / 3xl / 5xl mx-auto)
export default function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-site px-6 lg:px-12 ${className}`}>{children}</div>;
}
