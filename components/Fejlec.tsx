import Container from "./Container";

// Minimális fejléc: szöveges logó és link a fő oldalra. Nem sticky.
export default function Fejlec() {
  return (
    <header className="relative z-10">
      <Container className="flex h-16 items-center justify-between">
        {/* Sima <a>: a next/link kb. 3 KB kliens-JS-t hozna; a kezdőoldal statikus, a teljes betöltés olcsó (CLAUDE.md 6.) */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="inline-flex min-h-11 items-center font-display text-lg font-medium tracking-tight text-primary">
          Zyn<span className="text-accent">AI</span>
        </a>
        <a
          href="https://zynai.hu"
          className="inline-flex min-h-11 items-center font-mono text-xs text-secondary transition-colors hover:text-accent"
        >
          zynai.hu
        </a>
      </Container>
    </header>
  );
}
