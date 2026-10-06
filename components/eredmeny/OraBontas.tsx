// „A heti 40 órád” blokk – szöveg: landing-copy.md, 2. fejezet
import { ora } from "@/lib/format";
import BontasSav, { type Bontas } from "./BontasSav";

const MAGYARAZAT: Record<keyof Bontas, { cimke: string; szoveg: string; minta: string }> = {
  kivalthato: {
    cimke: "kiváltható",
    szoveg: "az AI egyedül is el tudja végezni, neked ellenőrizned kell",
    minta: "minta-kivalthato",
  },
  felgyorsul: {
    cimke: "felgyorsul",
    szoveg: "továbbra is te csinálod, de AI-val gyorsabban",
    minta: "minta-felgyorsul",
  },
  emberi: {
    cimke: "emberi mag",
    szoveg: "ezt az AI érdemben nem tudja",
    minta: "minta-emberi",
  },
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

      <ul className="mt-8 space-y-5">
        {(Object.keys(MAGYARAZAT) as (keyof Bontas)[]).map((k) => (
          <li key={k} className="flex gap-4">
            <span aria-hidden="true" className={`mt-1.5 size-4 shrink-0 rounded ${MAGYARAZAT[k].minta}`} />
            <p className="text-torzs text-secondary">
              <strong className="font-medium text-primary">{ora(orak[k])}</strong> – {MAGYARAZAT[k].cimke}:{" "}
              {MAGYARAZAT[k].szoveg}
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
