// Lábléc – szöveg: landing-copy.md, 1. fejezet
export default function Lablec({ adatVerzio }: { adatVerzio: string }) {
  return (
    <footer className="border-t border-vonal">
      <div className="mx-auto max-w-5xl px-5 py-8 text-sm text-halvany sm:px-8">
        <p>
          Készítette a ZynAI · AI-integráció magyar KKV-knak ·{" "}
          <a
            href="https://zynai.hu"
            className="inline-flex min-h-erintes items-center font-medium text-szoveg underline decoration-vonal underline-offset-4 hover:decoration-kiemelo"
          >
            zynai.hu
          </a>
        </p>
        <p className="mt-2 text-xs">
          Az eredmények becslések kutatási adatok alapján, nem egyéni előrejelzések. Adatverzió: {adatVerzio}
        </p>
      </div>
    </footer>
  );
}
