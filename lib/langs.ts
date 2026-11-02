export type LangCode =
  | "en-IN" | "hi-IN" | "mr-IN" | "bn-IN" | "gu-IN" | "kn-IN"
  | "ml-IN" | "od-IN" | "pa-IN" | "ta-IN" | "te-IN";

export const LANGS: { code: LangCode; native: string; english: string; hello: string }[] = [
  { code: "hi-IN", native: "हिन्दी", english: "Hindi", hello: "नमस्ते" },
  { code: "mr-IN", native: "मराठी", english: "Marathi", hello: "नमस्कार" },
  { code: "en-IN", native: "English", english: "English", hello: "Namaste" },
  { code: "bn-IN", native: "বাংলা", english: "Bengali", hello: "নমস্কার" },
  { code: "gu-IN", native: "ગુજરાતી", english: "Gujarati", hello: "નમસ્તે" },
  { code: "pa-IN", native: "ਪੰਜਾਬੀ", english: "Punjabi", hello: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ" },
  { code: "ta-IN", native: "தமிழ்", english: "Tamil", hello: "வணக்கம்" },
  { code: "te-IN", native: "తెలుగు", english: "Telugu", hello: "నమస్కారం" },
  { code: "kn-IN", native: "ಕನ್ನಡ", english: "Kannada", hello: "ನಮಸ್ಕಾರ" },
  { code: "ml-IN", native: "മലയാളം", english: "Malayalam", hello: "നമസ്കാരം" },
  { code: "od-IN", native: "ଓଡ଼ିଆ", english: "Odia", hello: "ନମସ୍କାର" },
];

export const LANG_CODES = LANGS.map((l) => l.code);

export const isLang = (v: unknown): v is LangCode => typeof v === "string" && (LANG_CODES as string[]).includes(v);

export const langInfo = (code: LangCode) => LANGS.find((l) => l.code === code) ?? LANGS[2];

/** BCP-47 tag for the html lang attribute and speechSynthesis (od-IN → or-IN). */
export const htmlLang = (code: LangCode) => (code === "od-IN" ? "or-IN" : code);
