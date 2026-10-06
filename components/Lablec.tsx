import Container from "./Container";

// Lábléc – szöveg: landing-copy.md, 1. fejezet
export default function Lablec({ adatVerzio }: { adatVerzio: string }) {
  return (
    <footer className="border-t border-hairline bg-elevated">
      <Container className="py-10 text-kicsi leading-[1.8] text-secondary">
        <p>
          Készítette a ZynAI · AI-integráció magyar KKV-knak ·{" "}
          <a
            href="https://zynai.hu"
            className="inline-flex min-h-11 items-center font-medium text-primary underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
          >
            zynai.hu
          </a>
        </p>
        <p className="mt-2 text-xs">
          Az eredmények becslések kutatási adatok alapján, nem egyéni előrejelzések. Adatverzió: {adatVerzio}
        </p>
      </Container>
    </footer>
  );
}
