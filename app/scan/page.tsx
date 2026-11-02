"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, FileText, Plus, Sparkles, Upload, X } from "lucide-react";
import { usePlan } from "@/components/PlanProvider";
import { Label, LanguagePill, Shell } from "@/components/ui";
import { fill } from "@/lib/i18n";

async function compress(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

export default function Scan() {
  const { t, files, setFiles } = usePlan();
  const router = useRouter();
  const cam = useRef<HTMLInputElement>(null);
  const pick = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    setMsg("");
    const incoming = Array.from(list);
    const next = [...files];
    for (const f of incoming) {
      if (next.length >= 4) { setMsg(t.maxPages); break; }
      const c = await compress(f);
      if (c.size > 4 * 1024 * 1024) { setMsg(t.fileTooBig); continue; }
      next.push(c);
    }
    setFiles(next);
    setBusy(false);
  }

  return (
    <Shell className="bg-paper">
      <header className="flex items-center justify-between px-3 pt-[max(env(safe-area-inset-top),10px)]">
        <button onClick={() => router.push("/")} className="grid size-11 place-items-center rounded-full hover:bg-ink/5" aria-label={t.back}><ArrowLeft className="size-5" /></button>
        <LanguagePill />
      </header>
      <div className="px-5 pb-40">
        <h1 className="mt-4 text-[1.5rem] font-light leading-tight tracking-tight">{t.scanTitle}</h1>
        <div className="mt-4 flex items-start gap-3 rounded-[22px] bg-white p-4 text-[0.9rem] text-ink/75 shadow-sm">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-teal" aria-hidden /> {t.scanTip}
        </div>

        <input ref={cam} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => { void add(e.target.files); e.target.value = ""; }} />
        <input ref={pick} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={(e) => { void add(e.target.files); e.target.value = ""; }} />

        {files.length === 0 ? (
          <button onClick={() => cam.current?.click()}
            className="mt-6 flex aspect-[3/4] w-full flex-col items-center justify-center gap-4 rounded-[28px] border-2 border-dashed border-ink/15 bg-white/60 text-ink/70 transition active:scale-[0.99]">
            <span className="grid size-20 place-items-center rounded-full bg-night text-white"><Camera className="size-8" /></span>
            <span className="text-[1.1rem] font-medium text-ink">{t.takePhoto}</span>
          </button>
        ) : (
          <>
            <Label className="mt-6 text-ink/55">{fill(t.pages, { n: files.length })}</Label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {files.map((f, i) => (
                <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-ink/5">
                  {f.type.startsWith("image/") ? (
                    <Image src={URL.createObjectURL(f)} alt={`Page ${i + 1}`} fill unoptimized className="object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-ink/60"><FileText className="size-10" /><span className="text-xs">{f.name}</span></div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-night/80 px-2.5 py-1 font-mono text-[0.65rem] text-white">{i + 1}</span>
                  <button onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={t.removePage}
                    className="absolute right-2 top-2 grid size-10 place-items-center rounded-full bg-white/90 shadow"><X className="size-4" /></button>
                </div>
              ))}
              {files.length < 4 && (
                <button onClick={() => cam.current?.click()} className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-ink/15 text-ink/70">
                  <Plus className="size-7" /> {t.addPage}
                </button>
              )}
            </div>
          </>
        )}
        <button onClick={() => pick.current?.click()} className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white text-ink ring-1 ring-ink/10">
          <Upload className="size-5" /> {t.uploadFile}
        </button>
        {msg && <p role="alert" className="mt-3 text-center text-[0.9rem] text-alert">{msg}</p>}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[440px] bg-gradient-to-t from-paper via-paper to-transparent px-5 pt-8 pb-[max(env(safe-area-inset-bottom),18px)]">
        <button disabled={!files.length || busy} onClick={() => router.push("/reading")}
          className="h-16 w-full rounded-full bg-night text-[1.05rem] font-medium text-white shadow-xl transition disabled:opacity-35 active:scale-[0.98]">
          {t.explainPaper}
        </button>
      </div>
    </Shell>
  );
}
