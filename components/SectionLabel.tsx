// Szekciócímke a címek fölé, pl. „01 · A TÍPUSOK”
export default function SectionLabel({ sorszam, children }: { sorszam: string; children: string }) {
  return (
    <p className="font-mono text-cimke tracking-[0.14em] text-accent uppercase">
      {sorszam} · {children}
    </p>
  );
}
