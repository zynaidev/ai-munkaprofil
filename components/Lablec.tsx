import Image from "next/image";
import { adatVerzioFelirat, getAdatVerzio } from "@/lib/data";
import { zynaiUrl } from "@/lib/linkek";
import Container from "./Container";

const link =
  "inline-flex min-h-11 items-center font-medium text-primary underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent";

// Lábléc – szöveg: landing-copy.md, 1. fejezet. Szerverkomponens (az adatverziót az adatból olvassa).
// `becsles={false}`: a „becslések…” mondat nélkül, ahol az oldal saját disclaimer-blokkja ezt már részletesen
// elmondja (eredményoldal), hogy ugyanaz a figyelmeztetés ne szerepeljen kétszer. Az adatverzió mindig látszik.
export default function Lablec({ becsles = true }: { becsles?: boolean }) {
  const adatVerzio = adatVerzioFelirat(getAdatVerzio());

  return (
    <footer className="border-t border-hairline bg-elevated">
      <Container className="py-10 text-kicsi leading-[1.8] text-secondary">
        <a href={zynaiUrl("/", "lablec-logo")} className="mb-2 inline-flex min-h-11 items-center">
          <Image src="/brand/ZynAI_logo_light.webp" alt="ZynAI" width={180} height={60} unoptimized className="h-8 w-auto lg:h-9 xl:h-[42px] 2xl:h-[46px]" />
        </a>
        <p>
          Készítette a ZynAI · AI-integráció magyar KKV-knak ·{" "}
          <a href={zynaiUrl("/", "lablec")} className={link}>
            zynai.hu
          </a>
        </p>
        <nav aria-label="Lábléc" className="mt-1 flex flex-wrap gap-x-6">
          {/* Sima <a>: a next/link kliens-JS-t hozna (CLAUDE.md 6.) */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/modszertan" className={link}>
            Módszertan
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/adatkezeles" className={link}>
            Adatkezelés
          </a>
        </nav>
        <p className="mt-2 text-xs">
          {becsles && "Az eredmények becslések kutatási adatok alapján, nem egyéni előrejelzések. "}Adatverzió:{" "}
          {adatVerzio}
        </p>
      </Container>
    </footer>
  );
}
