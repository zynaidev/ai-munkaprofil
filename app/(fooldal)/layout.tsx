import Lablec from "@/components/Lablec";

// Kezdőoldal és az általános oldalak (módszertan): lábléc a copy szerinti teljes szöveggel.
export default function FooldalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex-1">{children}</div>
      <Lablec />
    </>
  );
}
