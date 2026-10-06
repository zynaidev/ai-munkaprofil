// „A heti 40 órád” blokk – szöveg: landing-copy.md, 2. fejezet.
// Az oldal egyetlen keretezett eleme a visszanyert órák kiemelése.
import { ora } from "@/lib/format";
import BontasSav, { Jelolo, KATEGORIAK, type Bontas } from "./BontasSav";

const MAGYARAZAT: Record<keyof Bontas, string> = {
  kivalthato: "az AI egyedül is el tudja végezni, neked ellenőrizned kell",
  felgyorsul: "továbbra is te csinálod, de AI-val gyorsabban",
  emberi: "ezt az AI érdemben nem tudja",
};

export default function OraBontas({
  orak,
  hetiOra,
  visszanyertOra,
}: {
  orak: Bontas;
  hetiOra: number;
  visszanyertOra: number;
}) {
  const cimke = `${ora(orak.kivalthato)} kiváltható, ${ora(orak.felgyorsul)} felgyorsul, ${ora(orak.emberi)} emberi mag, összesen ${ora(hetiOra)}`;

  return (
    <>
      <BontasSav bontas={orak} osszes={hetiOra} cimke={cimke} vastag />

      <ul className="mt-8 space-y-4">
        {KATEGORIAK.map(({ kulcs, minta, nev }) => (
          <li key={kulcs} className="flex gap-4">
            <Jelolo minta={minta} className="mt-[0.45em]" />
            <p className="text-torzs text-secondary">
              <strong className="font-medium text-primary">{ora(orak[kulcs])}</strong> – {nev}: {MAGYARAZAT[kulcs]}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-10 rounded-2xl border border-accent-20 bg-accent-05 px-6 py-5 text-lead text-secondary">
        A felgyorsuló munkán kb.{" "}
        <strong className="font-medium text-accent">{ora(visszanyertOra, "targy")} nyerhetsz vissza hetente.</strong>
      </p>
    </>
  );
}
