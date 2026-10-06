// Saját 404: ismeretlen URL és ismeretlen munkakör (notFound()) is ezt kapja. A státusz 404, és a Next.js
// automatikusan noindex-et tesz rá. A gyökér-layoutban jelenik meg, ezért a láblécet maga rendereli.
import Container from "@/components/Container";
import KeresoLusta from "@/components/KeresoLusta";
import Lablec from "@/components/Lablec";
import SectionLabel from "@/components/SectionLabel";

export default function NemTalalhato() {
  return (
    <>
      <main className="flex-1">
        <Container className="py-20 lg:py-28">
          <div className="mx-auto max-w-2xl">
            <SectionLabel>404</SectionLabel>
            <h1 className="mt-5 font-display text-h2 font-medium text-balance text-primary">
              Ezt az oldalt nem találjuk.
            </h1>
            <p className="mt-6 text-lead text-secondary">Keresd meg a munkakörödet itt:</p>
            <div className="mt-8">
              <KeresoLusta />
            </div>
            {/* Sima <a>: a next/link kliens-JS-t hozna (CLAUDE.md 6.) */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="mt-8 inline-flex min-h-11 items-center font-mono text-xs tracking-[0.08em] text-secondary transition-colors hover:text-accent"
            >
              <span aria-hidden="true">←</span>&nbsp;Vissza a főoldalra
            </a>
          </div>
        </Container>
      </main>
      <Lablec />
    </>
  );
}
