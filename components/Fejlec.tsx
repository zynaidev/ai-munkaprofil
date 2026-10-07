import Image from "next/image";
import { zynaiUrl } from "@/lib/linkek";
import Container from "./Container";

// Minimális fejléc: logó és link a fő oldalra. Nem sticky.
export default function Fejlec() {
  return (
    <header className="relative z-10">
      <Container className="flex h-16 items-center justify-between">
        {/* Sima <a>: a next/link kb. 3 KB kliens-JS-t hozna; a kezdőoldal statikus, a teljes betöltés olcsó (CLAUDE.md 6.) */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="inline-flex min-h-11 items-center">
          {/* unoptimized: 3,7 KB-os, már WebP; nincs szükség a /_next/image optimalizálóra */}
          <Image src="/brand/ZynAI_logo_light.webp" alt="ZynAI" width={180} height={60} priority unoptimized className="h-8 w-auto lg:h-9 xl:h-[42px] 2xl:h-[46px]" />
        </a>
        <a
          href={zynaiUrl("/", "fejlec")}
          className="inline-flex min-h-11 items-center font-mono text-xs text-secondary transition-colors hover:text-accent"
        >
          zynai.hu
        </a>
      </Container>
    </header>
  );
}
