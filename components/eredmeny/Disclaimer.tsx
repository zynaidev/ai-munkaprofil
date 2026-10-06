// Disclaimer az oldal alján – szöveg: landing-copy.md, 2. fejezet
import Container from "../Container";

export default function Disclaimer() {
  return (
    <div className="border-t border-hairline py-14">
      <Container>
        <p className="mx-auto max-w-3xl text-kicsi leading-[1.8] text-secondary">
          Az eredmény becslés: nemzetközi kutatások feladatszintű adatait fordítottuk le magyar munkakörökre. Egy adott
          munkahely ettől jelentősen eltérhet. Nem egyéni előrejelzés, és nem karrier-tanácsadás. Részletek a{" "}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- sima <a>: nincs kliens-JS (CLAUDE.md 6.) */}
          <a
            href="/modszertan"
            className="py-3 text-primary underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
          >
            módszertani oldalon
          </a>
          .
        </p>
      </Container>
    </div>
  );
}
