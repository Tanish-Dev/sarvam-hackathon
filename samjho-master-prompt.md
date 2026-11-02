# MASTER PROMPT — "Samjho" (Discharge-Summary Decoder) · Sarvam AI Hackathon

You are building a complete, demo-ready, deployed web app in one go. Read this whole prompt before writing code. The Sarvam SDK is already installed and `SARVAM_API_KEY` is in `.env` (bootstrap done). Never hardcode, log or expose the key — it is used **only in server-side route handlers**.

---

## 1. The product

**Name:** Samjho — *"Your discharge paper, explained in your language."*

**Problem:** Patients leave hospital with a dense discharge summary full of jargon and abbreviations (BD, TDS, SOS, HS, AC/PC, "review after 1/52"). They don't understand which medicine is for what, when to take it, when to come back, or which symptoms mean "go to hospital now". Missed doses and missed follow-ups cause readmissions. The person most affected (often elderly, often not fluent in English) can't read the paper at all.

**Solution:** Photograph the discharge paper → Sarvam Vision reads it (even messy print/handwriting) → Sarvam-105B turns it into a simple, structured recovery plan → Bulbul **reads it aloud in the patient's language** → patient (or caregiver) can **ask questions by voice** (Saaras) → app generates a **7-day recovery checklist** and a follow-up reminder.

**Who uses it:** the patient on their phone; the caregiver/son/daughter on phone or laptop. On a laptop, the caregiver can dictate notes and questions with **Kivi** (Sarvam's voice layer, Fn-to-talk) into any text field — so every text input must be a normal, focusable `<textarea>/<input>` that works with system dictation.

**Sarvam stack used (show these on an "How it works" screen and in the README):**
| Step | Sarvam product |
|---|---|
| Read the paper | **Sarvam Vision** (Document AI, `client.docAi.parse`) |
| Understand + simplify + structure | **Sarvam-105B** (`/v2/chat/completions`, JSON schema output) |
| Speak it in 11 Indian languages | **Bulbul** (`/text-to-speech`) |
| Patient asks questions by voice | **Saaras** (`/speech-to-text`) |
| Caregiver dictation on desktop | **Kivi** (works natively with our text fields) |

---

## 2. Tech stack (keep it minimal)

- Next.js (App Router, latest stable) + TypeScript + Tailwind CSS
- `sarvamai` (already installed), `framer-motion` (motion), `lucide-react` (icons), `jszip` (unzip Vision output)
- No database, no auth. Patient data stays in the browser (`localStorage`, wrapped in try/catch). Say so in the UI: "Nothing is stored on our servers."
- Mobile-first (390px design width), but fully usable on desktop (centered phone-width column with a soft gradient backdrop on large screens).
- Deploy to **Vercel**.

Do not add other dependencies unless strictly required.

---

## 3. Sarvam API integration (verified against docs.sarvam.ai — follow exactly, re-check the docs if a call errors)

All calls live in `app/api/*/route.ts`, `export const runtime = "nodejs"`, `export const maxDuration = 60`. Auth header for REST: `api-subscription-key: process.env.SARVAM_API_KEY`. Create `lib/sarvam.ts` with one helper per API and typed errors. Every route returns `{ error: string }` with a friendly message on failure.

### 3a. Sarvam Vision — read the photo
SDK (current Doc AI path):
```ts
const client = new SarvamAIClient({ apiSubscriptionKey: process.env.SARVAM_API_KEY! });
const job = await client.docAi.parse({ file: [fileStreamOrBlob], language: "en-IN", output_format: "md" });
// poll client.docAi.getStatus(job.job_id) until status in completed|partially_completed|failed|rejected
// then client.docAi.getDownloadUrl(job.job_id) → fetch the ZIP → unzip with jszip → concatenate the .md files
```
- Inputs: JPG/PNG/PDF (≤10 pages). Allow up to 4 photos per discharge (multi-page) — send as a flat ZIP of JPG/PNGs when >1 image.
- Limit: 10 requests/min. Don't retry in a tight loop.
- **Split into two routes** so we never hit serverless timeouts: `POST /api/scan` (upload + start, returns `jobId`) and `GET /api/scan/[jobId]` (returns `{status}` or `{status:"completed", markdown}`). The client polls every 3s and shows a live progress UI.
- Compress images client-side before upload (canvas → JPEG, longest side 2000px, quality 0.85).
- If the SDK method signature differs from above in the installed version, inspect `node_modules/sarvamai` types and adapt — do not guess silently.

### 3b. Sarvam-105B — decode into a structured plan
`POST https://api.sarvam.ai/v2/chat/completions`, model `sarvam-105b`, `response_format: { type: "json_schema", json_schema: { name: "discharge_plan", strict: true, schema } }`, `max_tokens: 4000`.

Schema (`lib/schema.ts`, also export a matching TS type):
```
{
  patient: { name, age, sex, hospital, doctor, admitted_on, discharged_on },          // strings, "" if unknown
  diagnosis_simple: string,            // 1–2 sentences, plain words, no jargon
  what_happened: string,               // 2–3 sentence story of the hospital stay in plain words
  medicines: [{
    name, generic_name, purpose_simple,            // "for blood pressure", "to protect stomach"
    dose, form,                                     // "1 tablet", "5 ml"
    schedule: { morning: bool, afternoon: bool, evening: bool, night: bool, sos: bool },
    food: "before" | "after" | "with" | "any",
    duration_days: number | null,                   // null = continue until doctor says
    special_instructions: string,
    source_text: string,                            // EXACT line copied from the paper
    confidence: "high" | "low"                      // low if illegible/ambiguous
  }],
  follow_ups: [{ what, date_iso | "", relative_text, where, source_text }],
  tests_pending: [{ name, when, source_text }],
  diet: [string], activity: [string],
  warning_signs: [{ sign_simple, action }],         // "Chest pain or breathlessness" → "Go to emergency immediately"
  checklist_7_days: [{ day: 1..7, tasks: [string] }],
  unclear_items: [string],                          // things the patient must confirm with the doctor
  glossary: [{ term, meaning_simple }]              // every abbreviation found (BD, TDS, HS, SOS, 1/52...)
}
```
System prompt rules (write them into `lib/prompts.ts`):
- You are a careful medical document explainer, **not** a doctor. Never invent a medicine, dose, date or diagnosis that is not on the paper. If something is unreadable → `confidence:"low"` and add to `unclear_items`. Never change doses or suggest stopping medicines.
- Expand all abbreviations (OD, BD, TDS, QID, HS, SOS, AC, PC, Tab, Cap, Syp, 1/52 = 1 week, 2/7 = 2 days, etc.).
- `source_text` must be copied verbatim from the input so the UI can show "From your paper: …".
- Resolve relative follow-up dates against `discharged_on` when possible.
- Plain language at a 6th-grade level. Short sentences.
- Output English in the JSON (translation happens in the next step).

### 3c. Translation for display + speech
After decode, if the chosen language ≠ English, make **one more** `sarvam-105b` call: translate all patient-facing string fields of the JSON into the target language, keeping keys, medicine names, numbers and dates unchanged (same JSON schema). Cache per language in `localStorage` so switching back is instant. Supported languages = Bulbul's: `en-IN, hi-IN, mr-IN, bn-IN, gu-IN, kn-IN, ml-IN, od-IN, pa-IN, ta-IN, te-IN` (show native names: हिन्दी, मराठी, বাংলা, ગુજરાતી, ಕನ್ನಡ, മലയാളം, ଓଡ଼ିଆ, ਪੰਜਾਬੀ, தமிழ், తెలుగు, English).

### 3d. Bulbul — read aloud
`POST https://api.sarvam.ai/text-to-speech` JSON `{ text, language_code, model: "bulbul:v3", pace: 0.9, output_audio_codec: "mp3" }` → response `audios[]` base64 → return to client as `audio/mpeg`.
- Max 2500 chars per call → `lib/chunk.ts` splits on sentence boundaries; play chunks sequentially; prefetch the next chunk while the current one plays.
- Use the default speaker for v3 unless the Voices guide (docs.sarvam.ai → Text to Speech → Voices) lists a better one per language; speaker names are lowercase and must match the model.
- Spoken scripts are generated per section (overview, each medicine, follow-up, warning signs, today's checklist) so the patient can tap ▶ on any card. Numbers > 4 digits written with commas.
- Cache audio blobs in memory by `hash(text+lang)`.

### 3e. Saaras — ask by voice
Browser `MediaRecorder` (webm/opus; fall back to mp4 on Safari) → `POST /api/ask` multipart → server calls `POST https://api.sarvam.ai/speech-to-text` (multipart `file`, `model: "saaras:v3"`, `mode: "transcribe"`, `language_code` = selected language or `"unknown"`) → transcript → `sarvam-105b` answers **only from the decoded plan JSON** (if not in the paper: "Your paper doesn't say — please ask your doctor", plus show the hospital/doctor name) → Bulbul speaks the answer. Keep recordings ≤ 30s (show a countdown ring). Also allow typed questions (same endpoint with `text`).
- Add a hard safety rule in the answer prompt: if the question describes an emergency symptom that matches `warning_signs` or is obviously serious (chest pain, can't breathe, unconscious, heavy bleeding, stroke signs), first answer "This could be serious. Go to the nearest emergency or call 108 now." and show a red banner with a `tel:108` button.

---

## 4. Screens & UX (super easy — elderly-first)

Rules: one primary action per screen; tap targets ≥ 56px; base font 18px, "Large text" toggle → 22px; every text block has a ▶ listen button; no medical jargon anywhere in the UI; works one-handed; loading states always say what's happening in plain words.

1. **Welcome / Language** — big greeting ("Namaste 🙏 Let's understand your discharge paper together"), language grid with native script names (big tiles), selected language persists. CTA: **Scan your paper**. Secondary: **Try a sample** (demo mode, see §6).
2. **Scan** — camera capture (`<input type="file" accept="image/*" capture="environment" multiple>`) + upload from gallery/PDF. Page thumbnails with "Add page" / remove. Tip card: "Flat surface, good light, all corners visible". CTA **Explain my paper**.
3. **Reading (progress)** — the "thinking" screen. Calm animated gradient; 3 steps ticking through in the user's language: "Reading your paper (Sarvam Vision)" → "Understanding medicines (Sarvam-105B)" → "Preparing your voice guide (Bulbul)". Show the extracted text streaming in faintly behind as proof it's real.
4. **Your Plan (home)** — the hero screen, mirrors the centre reference phone:
   - Large centered spoken-style greeting: "Ramesh ji, you have **4 medicines** today. Next check-up in **6 days**." Auto-plays in their language on first open (with a mute toggle; respect autoplay rules → start on first tap).
   - Floating round **mic button** bottom-center: "Ask anything".
   - Below the fold: **Today** card (dose timeline Morning / Afternoon / Evening / Night with medicine pills to tick), **Follow-up** card (date, countdown, place, "Add to calendar" → generates `.ics`), **Warning signs** card (red accent, always visible, ▶ listen), **Diet & activity**, **Things to confirm with your doctor** (from `unclear_items` + low-confidence items), **Glossary** ("What does BD mean?").
5. **Medicines** — list like the right reference phone: each row `TAB. TELMA 40 · MORNING` in mono caps, sub-line plain-language purpose ("For blood pressure"), chevron expands to: dose, timing icons (☀️ 🌤 🌆 🌙), before/after food, how many days left, special instructions, **"From your paper:" quoted `source_text`**, ▶ listen, and a ⚠️ "Please confirm with your doctor" chip if confidence is low.
6. **Recovery checklist (7 days)** — horizontal day selector (Day 1–7, today highlighted), tasks with big checkboxes, progress bar per day; a slim bar chart of adherence across 7 days (thin vertical bars like the left reference phone's chart). **Slide-to-confirm** pill ("Slide to mark morning doses taken") as the satisfying primary interaction. State persists in `localStorage`.
7. **Ask (voice)** — full-screen centered conversation like the middle reference: big text of the latest answer, mic button, live waveform while recording, transcript shown, answer spoken. 3 suggestion chips in the selected language: "Can I eat rice?", "What if I miss a dose?", "When can I bathe/walk?".
8. **Share with family** — one tap: Web Share API (fallback copy) with a clean plain-text plan in the selected language (medicines + timings + follow-up + warning signs) — perfect for WhatsApp. Plus **Print / Save PDF** of a one-page "fridge sheet" (print CSS: big table of medicines × times with tick boxes).
9. **How it works** (small link in header) — the Sarvam pipeline diagram with each model named, + privacy note + disclaimer.

Persistent elements: top nav of 3 icons like the reference (Plan · Medicines · Checklist), language switcher pill, "Large text" toggle. Footer disclaimer on plan screens: "Samjho explains your paper. It does not replace your doctor. Always follow your doctor's advice."

---

## 5. Visual design — match the attached UI references

The references are a premium voice-first finance app. Adapt that language to calm, trustworthy healthcare:

- **Palette:** deep night `#0B0F14` → slate blue `#1C2A3A` → teal-grey `#3E5C66` → mist `#C9D1D6` → soft paper `#EEF1F3`; one warm accent gradient (dusk peach `#E8B79A` → rose `#C98E8E`) used only for hero header cards (like the "Autonomous Index" card); alert red `#E5484D` only for warning signs; success sage `#7FB59A` for ticks. Big vertical blurred gradients behind hero text (dark top → light bottom), exactly like the centre phone.
- **Type:** UI sans `Inter Tight` or `Geist` (light 300 for huge numerals/greetings, 400/500 body); labels in **monospace uppercase with letter-spacing** (`Geist Mono` / `JetBrains Mono`) like "TOTAL NET WORTH", "CORE GROWTH FOUNDATION · 67%". Load `Noto Sans` families for Devanagari, Bengali, Gujarati, Gurmukhi, Kannada, Malayalam, Odia, Tamil, Telugu via `next/font/google` and switch by language.
- **Components:** rounded-[28px] cards; white/near-white cards on light sections and black cards on dark sections; hairline dividers; huge thin numerals (dose counts, days-to-follow-up); the round white mic button with a minimal waveform glyph; the pill **slide-to-confirm** with an arrow knob; minimal line icons; thin vertical bar chart.
- **Motion (framer-motion):** gentle fade/slide between screens, gradient slowly drifting on Reading + Ask screens, mic button breathing pulse while listening, checkbox tick spring. Respect `prefers-reduced-motion`.
- Dark mode by default on hero/ask screens, light content sections below — just like the references. Ensure WCAG AA contrast everywhere.

Read the frontend-design guidance if available; the result must look like a funded startup's product, not a template.

---

## 6. Demo mode (never let the demo fail)

- Ship `lib/sample.ts` with a realistic **fictional** discharge summary as raw text (it skips Vision and goes straight to decode), plus a pre-computed decoded JSON in English **and** Hindi + Marathi so "Try a sample" works instantly even with no network/credits. Use this sample:

```
CITY CARE HOSPITAL, PUNE — DISCHARGE SUMMARY
Patient: Ramesh Patil  Age/Sex: 62/M  IP No: 24-11873
DOA: 24/10/2026  DOD: 30/10/2026  Consultant: Dr. A. Kulkarni (Cardiology)
Diagnosis: Acute NSTEMI, HTN, T2DM. S/p PTCA to LAD with DES x1.
Course in hospital: Pt presented with chest pain since 6 hrs. ECG s/o ST depression. Trop I raised. CAG done — SVD (LAD 90%). PTCA + DES to LAD done on 25/10. Post procedure uneventful. Discharged in stable condition.
Rx on discharge:
1. Tab. Ecosprin 75mg 1-0-0 after food — continue
2. Tab. Brilinta 90mg 1-0-1 — x 1 yr, do not stop
3. Tab. Atorva 80mg 0-0-1 HS
4. Tab. Telma 40mg 1-0-0
5. Tab. Metformin 500mg 1-0-1 PC
6. Tab. Pan 40mg 1-0-0 AC x 2 wks
7. Tab. Sorbitrate 5mg SL SOS for chest pain
Advice: Low salt, low fat diabetic diet. Walk 10 min BD, increase gradually. No heavy lifting x 4 wks. Avoid smoking.
Review in Cardio OPD after 1/52 with CBC, RFT, Lipid profile. Echo after 1 month.
Come to ER immediately if chest pain not relieved by SL Sorbitrate, breathlessness, giddiness, black stools.
```
- Build a `/sample-paper` page that renders the text above as a realistic printed hospital form (letterhead, table for Rx, a slightly handwritten-style font for the doses, a stamp and signature). During the live demo the presenter photographs this page on a second screen (or prints it), so the real Vision pipeline runs end to end. No image-generation dependencies.
- Every API route has a graceful fallback: if Sarvam errors or times out, show a friendly retry and offer the sample. Never show a stack trace.

---

## 7. Essential features checklist (all must work)

- [ ] Multi-page photo/PDF upload with client-side compression
- [ ] Sarvam Vision OCR with polling + progress UI
- [ ] Sarvam-105B structured decode with verbatim `source_text` per item ("From your paper" proof)
- [ ] Low-confidence flags + "Confirm with your doctor" list (honesty = trust)
- [ ] 11 languages, translated UI content + Bulbul voice per card + "Listen to everything" mode
- [ ] Voice Q&A (Saaras → 105B grounded answer → Bulbul) + typed fallback + emergency guardrail with `tel:108`
- [ ] Today's dose timeline with ticks + 7-day checklist + adherence chart + slide-to-confirm
- [ ] Follow-up countdown + `.ics` calendar download
- [ ] Warning signs card, always visible, red, speakable
- [ ] Glossary of every abbreviation found
- [ ] Share to WhatsApp (Web Share API) + printable fridge sheet
- [ ] Large-text mode, reduced-motion support, keyboard + screen-reader labels (aria) on every control
- [ ] Demo mode + `/sample-paper` page
- [ ] Privacy: no server storage; "Clear my data" button
- [ ] Medical disclaimer on every plan screen

UI copy (labels, buttons, loading text) must also be translated: keep a small `lib/i18n.ts` dictionary for en/hi/mr hand-written; for the other 8 languages translate the dictionary once via `sarvam-105b` at first use and cache it.

---

## 8. Project structure

```
app/
  layout.tsx, page.tsx (welcome), scan/, reading/, plan/, medicines/, checklist/, ask/, how-it-works/, sample-paper/
  api/scan/route.ts, api/scan/[jobId]/route.ts, api/decode/route.ts, api/translate/route.ts, api/tts/route.ts, api/ask/route.ts
components/  (MicButton, SlideToConfirm, GradientHero, MedicineRow, DoseTimeline, DayChecklist, AdherenceBars, ListenButton, LanguagePicker, WarningCard, ShareSheet)
lib/  sarvam.ts, schema.ts, prompts.ts, chunk.ts, i18n.ts, storage.ts, ics.ts, sample.ts, audio.ts
```
Use a small React context (`PlanProvider`) for the current plan, language and checklist state.

---

## 9. Quality bar before deploying

1. `npm run build` passes with zero TypeScript errors and zero lint errors.
2. Manually test the full flow with the sample text AND with one real photo (`/sample-paper` screenshot): scan → plan → listen in Hindi → ask "Can I stop Brilinta?" (must answer: don't stop, it says "do not stop", ask your doctor) → tick checklist → share → print.
3. Test at 390px and 1440px widths. No horizontal scroll. Lighthouse accessibility ≥ 95.
4. Verify the API key never appears in client bundles (`grep -r SARVAM .next/static` returns nothing).

---

## 10. Deploy to Vercel

1. `git init` (if needed), add `.gitignore` (`.env*`, `.next`, `node_modules`), commit.
2. `npx vercel login` — **stop and ask me to complete login** if not already logged in.
3. `npx vercel link` → create project `samjho`.
4. `npx vercel env add SARVAM_API_KEY production` (and `preview`) — ask me to paste the key into the prompt; never echo it.
5. `npx vercel --prod`. Print the production URL.
6. Open the production URL and re-run the sample flow + one TTS call + one voice question to confirm the live deploy works (env vars are applied).

---

## 11. Also produce (for the pitch)

- `README.md`: problem, solution, Sarvam pipeline diagram (Mermaid), features, how Kivi fits (caregiver dictation on HP/Mac laptops), privacy & safety design, how to run locally, live URL.
- `PITCH.md`: a 2-minute demo script — (1) hook: "1 in 5 patients is readmitted within 30 days; most can't read their discharge paper" — present this as an illustrative framing, not a cited statistic, unless you find a real source; (2) photograph the `/sample-paper` live; (3) plan appears, greeting speaks in Marathi; (4) tap Brilinta → "From your paper: x 1 yr, do not stop"; (5) ask by voice in Hindi "Kya main Brilinta band kar sakta hoon?" → spoken answer; (6) ask "seene mein dard ho raha hai" → emergency banner; (7) slide-to-confirm doses, share to WhatsApp; (8) close on the Sarvam stack slide + impact + next steps (hospital EMR integration, WhatsApp bot, daily Bulbul reminder calls).

Work through everything end-to-end without stopping, except for the two explicit stops (Vercel login, pasting the key). At the end, give me: the live URL, a list of what works, and anything you had to change from this spec and why.
