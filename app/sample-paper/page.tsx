import { Caveat } from "next/font/google";

const hand = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

export const metadata = { title: "Sample discharge summary — Samjho demo" };

const RX = [
  ["Tab. Ecosprin", "75 mg", "1-0-0", "after food — continue"],
  ["Tab. Brilinta", "90 mg", "1-0-1", "x 1 yr, do not stop"],
  ["Tab. Atorva", "80 mg", "0-0-1", "HS"],
  ["Tab. Telma", "40 mg", "1-0-0", ""],
  ["Tab. Metformin", "500 mg", "1-0-1", "PC"],
  ["Tab. Pan", "40 mg", "1-0-0", "AC x 2 wks"],
  ["Tab. Sorbitrate", "5 mg", "SL SOS", "for chest pain"],
];

export default function SamplePaper() {
  return (
    <main className="min-h-dvh bg-[#d9d6cf] px-3 py-6 font-serif text-black">
      <div className="mx-auto max-w-[720px] bg-[#fdfcf8] p-6 shadow-2xl sm:p-10" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        <div className="flex items-center justify-between border-b-4 border-double border-[#14507a] pb-3">
          <div>
            <div className="text-[1.5rem] font-bold tracking-wide text-[#14507a]">CITY CARE HOSPITAL</div>
            <div className="text-[0.7rem]">Multispeciality & Cardiac Centre · FC Road, Pune 411004 · Ph: 020-2555 0000</div>
          </div>
          <div className="grid size-14 place-items-center rounded-full border-2 border-[#14507a] text-[1.6rem] font-bold text-[#14507a]">✚</div>
        </div>
        <h1 className="mt-3 text-center text-[1.1rem] font-bold underline">DISCHARGE SUMMARY</h1>
        <table className="mt-3 w-full text-[0.8rem]">
          <tbody>
            <tr><td><b>Patient:</b> Ramesh Patil</td><td><b>Age/Sex:</b> 62/M</td><td><b>IP No:</b> 24-11873</td></tr>
            <tr><td><b>DOA:</b> 24/10/2026</td><td><b>DOD:</b> 30/10/2026</td><td><b>Consultant:</b> Dr. A. Kulkarni (Cardiology)</td></tr>
          </tbody>
        </table>
        <p className="mt-3 text-[0.85rem]"><b>Diagnosis:</b> Acute NSTEMI, HTN, T2DM. S/p PTCA to LAD with DES x1.</p>
        <p className="mt-2 text-[0.85rem]"><b>Course in hospital:</b> Pt presented with chest pain since 6 hrs. ECG s/o ST depression. Trop I raised. CAG done — SVD (LAD 90%). PTCA + DES to LAD done on 25/10. Post procedure uneventful. Discharged in stable condition.</p>
        <p className="mt-3 text-[0.85rem] font-bold">Rx on discharge:</p>
        <table className="mt-1 w-full border-collapse text-[0.85rem]">
          <thead><tr className="bg-[#eef3f7]">{["#", "Drug", "Strength", "Dose", "Remarks"].map((h) => <th key={h} className="border border-black/60 px-2 py-1 text-left">{h}</th>)}</tr></thead>
          <tbody>
            {RX.map(([d, s, dose, r], i) => (
              <tr key={d}>
                <td className="border border-black/60 px-2">{i + 1}.</td>
                <td className="border border-black/60 px-2">{d}</td>
                <td className="border border-black/60 px-2">{s}</td>
                <td className={`border border-black/60 px-2 text-[1.25rem] text-[#1a2f8a] ${hand.className}`}>{dose}</td>
                <td className={`border border-black/60 px-2 text-[1.15rem] text-[#1a2f8a] ${hand.className}`}>{r}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-[0.85rem]"><b>Advice:</b> Low salt, low fat diabetic diet. Walk 10 min BD, increase gradually. No heavy lifting x 4 wks. Avoid smoking.</p>
        <p className={`mt-2 text-[1.3rem] leading-tight text-[#1a2f8a] ${hand.className}`}>Review in Cardio OPD after 1/52 with CBC, RFT, Lipid profile. Echo after 1 month.</p>
        <p className="mt-2 text-[0.85rem]"><b>Come to ER immediately if</b> chest pain not relieved by SL Sorbitrate, breathlessness, giddiness, black stools.</p>
        <div className="mt-8 flex items-end justify-between">
          <div className="grid size-28 -rotate-12 place-items-center rounded-full border-[3px] border-[#7a2a8a]/70 text-center text-[0.6rem] font-bold leading-tight text-[#7a2a8a]/80">
            CITY CARE<br />HOSPITAL<br />PUNE<br />★ CARDIOLOGY ★
          </div>
          <div className="text-right text-[0.8rem]">
            <div className={`text-[1.9rem] leading-none text-[#1a2f8a] ${hand.className}`}>A. Kulkarni</div>
            <div className="border-t border-black/60 pt-1">Dr. A. Kulkarni, MD, DM (Cardiology)</div>
          </div>
        </div>
        <p className="mt-6 text-center text-[0.6rem] text-black/50">Fictional sample for the Samjho demo. Not a real patient.</p>
      </div>
    </main>
  );
}
