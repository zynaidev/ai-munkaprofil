// Szekciócímke a címek fölé, pl. „01 · A TÍPUSOK”. Sorszám nélkül is használható (pl. felcím),
// és ha a címke maga az oldal főcíme, `as="h1"`-gyel címsorként renderelhető.
export default function SectionLabel({
  sorszam,
  as: Elem = "p",
  children,
}: {
  sorszam?: string;
  as?: "p" | "h1" | "h2";
  children: string;
}) {
  return (
    <Elem className="font-mono text-cimke leading-normal font-normal tracking-[0.14em] text-accent uppercase">
      {sorszam ? `${sorszam} · ${children}` : children}
    </Elem>
  );
}
