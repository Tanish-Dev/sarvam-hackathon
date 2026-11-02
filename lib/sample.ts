import type { DischargePlan } from "./schema";
import type { LangCode } from "./langs";

// Fictional patient. Used by "Try a sample" (no network needed) and rendered at /sample-paper.
export const SAMPLE_TEXT = `CITY CARE HOSPITAL, PUNE — DISCHARGE SUMMARY
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
Come to ER immediately if chest pain not relieved by SL Sorbitrate, breathlessness, giddiness, black stools.`;

const sched = (m: boolean, a: boolean, e: boolean, n: boolean, sos = false) => ({ morning: m, afternoon: a, evening: e, night: n, sos });

const BASE: DischargePlan = {
  patient: {
    name: "Ramesh Patil", age: "62", sex: "Male", hospital: "City Care Hospital, Pune",
    doctor: "Dr. A. Kulkarni (Cardiology)", admitted_on: "2026-10-24", discharged_on: "2026-10-30",
  },
  diagnosis_simple: "",
  what_happened: "",
  medicines: [
    { name: "Tab. Ecosprin 75mg", generic_name: "Aspirin", purpose_simple: "", dose: "", form: "tablet", schedule: sched(true, false, false, false), food: "after", duration_days: null, special_instructions: "", source_text: "Tab. Ecosprin 75mg 1-0-0 after food — continue", confidence: "high" },
    { name: "Tab. Brilinta 90mg", generic_name: "Ticagrelor", purpose_simple: "", dose: "", form: "tablet", schedule: sched(true, false, false, true), food: "any", duration_days: 365, special_instructions: "", source_text: "Tab. Brilinta 90mg 1-0-1 — x 1 yr, do not stop", confidence: "high" },
    { name: "Tab. Atorva 80mg", generic_name: "Atorvastatin", purpose_simple: "", dose: "", form: "tablet", schedule: sched(false, false, false, true), food: "any", duration_days: null, special_instructions: "", source_text: "Tab. Atorva 80mg 0-0-1 HS", confidence: "high" },
    { name: "Tab. Telma 40mg", generic_name: "Telmisartan", purpose_simple: "", dose: "", form: "tablet", schedule: sched(true, false, false, false), food: "any", duration_days: null, special_instructions: "", source_text: "Tab. Telma 40mg 1-0-0", confidence: "high" },
    { name: "Tab. Metformin 500mg", generic_name: "Metformin", purpose_simple: "", dose: "", form: "tablet", schedule: sched(true, false, false, true), food: "after", duration_days: null, special_instructions: "", source_text: "Tab. Metformin 500mg 1-0-1 PC", confidence: "high" },
    { name: "Tab. Pan 40mg", generic_name: "Pantoprazole", purpose_simple: "", dose: "", form: "tablet", schedule: sched(true, false, false, false), food: "before", duration_days: 14, special_instructions: "", source_text: "Tab. Pan 40mg 1-0-0 AC x 2 wks", confidence: "high" },
    { name: "Tab. Sorbitrate 5mg", generic_name: "Isosorbide dinitrate", purpose_simple: "", dose: "", form: "tablet", schedule: sched(false, false, false, false, true), food: "any", duration_days: null, special_instructions: "", source_text: "Tab. Sorbitrate 5mg SL SOS for chest pain", confidence: "high" },
  ],
  follow_ups: [
    { what: "", date_iso: "2026-11-06", relative_text: "", where: "", source_text: "Review in Cardio OPD after 1/52 with CBC, RFT, Lipid profile." },
    { what: "", date_iso: "2026-11-30", relative_text: "", where: "", source_text: "Echo after 1 month." },
  ],
  tests_pending: [
    { name: "", when: "", source_text: "with CBC, RFT, Lipid profile" },
    { name: "", when: "", source_text: "with CBC, RFT, Lipid profile" },
    { name: "", when: "", source_text: "with CBC, RFT, Lipid profile" },
    { name: "", when: "", source_text: "Echo after 1 month." },
  ],
  diet: [],
  activity: [],
  warning_signs: [],
  checklist_7_days: [],
  unclear_items: [],
  glossary: [
    "NSTEMI", "HTN", "T2DM", "PTCA", "DES", "LAD", "CAG", "SVD", "ECG", "Trop I",
    "Tab.", "1-0-0", "1-0-1", "0-0-1", "HS", "AC", "PC", "SL", "SOS", "BD", "1/52", "OPD", "CBC", "RFT", "Lipid profile", "Echo", "ER",
  ].map((term) => ({ term, meaning_simple: "" })),
};

interface Texts {
  diagnosis: string;
  happened: string;
  meds: [purpose: string, dose: string, note: string][];
  follow: [what: string, relative: string, where: string][];
  tests: [name: string, when: string][];
  diet: string[];
  activity: string[];
  warnings: [sign: string, action: string][];
  days: string[][];
  unclear: string[];
  glossary: string[];
}

function build(t: Texts): DischargePlan {
  const p: DischargePlan = structuredClone(BASE);
  p.diagnosis_simple = t.diagnosis;
  p.what_happened = t.happened;
  p.medicines.forEach((m, i) => { [m.purpose_simple, m.dose, m.special_instructions] = t.meds[i]; });
  p.follow_ups.forEach((f, i) => { [f.what, f.relative_text, f.where] = t.follow[i]; });
  p.tests_pending.forEach((x, i) => { [x.name, x.when] = t.tests[i]; });
  p.diet = t.diet;
  p.activity = t.activity;
  p.warning_signs = t.warnings.map(([sign_simple, action]) => ({ sign_simple, action }));
  p.checklist_7_days = t.days.map((tasks, i) => ({ day: i + 1, tasks }));
  p.unclear_items = t.unclear;
  p.glossary.forEach((g, i) => { g.meaning_simple = t.glossary[i]; });
  return p;
}

const EN = build({
  diagnosis: "You had a heart attack because a blood vessel of your heart got blocked. You also have high blood pressure and diabetes.",
  happened: "You came to the hospital with chest pain for 6 hours. Tests showed that one main blood vessel of your heart was 90% blocked. On 25 October the doctors opened it with a small balloon and put in a stent, a tiny tube that keeps it open. You recovered well and went home in stable condition.",
  meds: [
    ["to keep the stent open and stop clots", "1 tablet", "Keep taking it every day."],
    ["to keep the stent open — very important", "1 tablet", "Take for 1 year. Do not stop it without asking your heart doctor."],
    ["to lower cholesterol and protect the heart", "1 tablet", "Take at bedtime."],
    ["for blood pressure", "1 tablet", ""],
    ["for diabetes (blood sugar)", "1 tablet", ""],
    ["to protect the stomach", "1 tablet", "Take before breakfast. Only for 2 weeks."],
    ["for sudden chest pain", "1 tablet under the tongue", "Only if chest pain comes. Keep it under the tongue, do not swallow. If the pain does not go away, go to the emergency room immediately."],
  ],
  follow: [
    ["Heart check-up with Dr. A. Kulkarni. Bring your blood test reports.", "after 1 week", "Cardio OPD, City Care Hospital, Pune"],
    ["Heart ultrasound (Echo)", "after 1 month", "City Care Hospital, Pune"],
  ],
  tests: [
    ["Blood count test (CBC)", "Before your check-up in 1 week"],
    ["Kidney test (RFT)", "Before your check-up in 1 week"],
    ["Cholesterol test (Lipid profile)", "Before your check-up in 1 week"],
    ["Heart ultrasound (Echo)", "After 1 month"],
  ],
  diet: ["Eat less salt.", "Eat less oil, ghee and fried food.", "Diabetic diet: very little sugar, sweets and sweet drinks."],
  activity: ["Walk for 10 minutes, twice a day. Slowly walk a little more each day.", "Do not lift anything heavy for 4 weeks.", "Do not smoke."],
  warnings: [
    ["Chest pain that does not go away after the Sorbitrate tablet", "Go to the emergency room immediately or call 108."],
    ["Difficulty in breathing", "Go to the emergency room immediately or call 108."],
    ["Feeling very dizzy or about to faint", "Go to the emergency room immediately or call 108."],
    ["Black stools", "Go to the emergency room immediately."],
  ],
  days: [
    ["Take all morning and night medicines on time", "Walk 10 minutes in the morning and 10 minutes in the evening", "Eat low-salt, low-oil food", "Keep the Sorbitrate tablet with you"],
    ["Take all medicines on time", "Walk 10 minutes, twice", "Do not lift anything heavy", "Check you have enough Brilinta tablets"],
    ["Take all medicines on time", "Walk 10–12 minutes, twice", "Call the hospital to book your heart check-up"],
    ["Take all medicines on time", "Walk 12 minutes, twice", "Get blood tests done: blood count, kidney test, cholesterol"],
    ["Take all medicines on time", "Walk 12–15 minutes, twice", "Collect your blood test reports"],
    ["Take all medicines on time", "Walk 15 minutes, twice", "Keep this paper and your reports ready for the check-up"],
    ["Take all medicines on time", "Go for your heart check-up at Cardio OPD", "Take this paper, your reports and all medicine strips"],
  ],
  unclear: [
    "Your paper does not say for how long to take Atorva, Telma and Metformin. Ask your doctor at the check-up.",
    "Your paper does not say exactly when to give the blood tests. Ask the hospital if they should be done before the check-up.",
  ],
  glossary: [
    "A type of heart attack", "High blood pressure", "Type 2 diabetes (high blood sugar)", "Opening a blocked heart blood vessel with a small balloon",
    "A stent (tiny tube) coated with medicine that keeps the vessel open", "A main blood vessel at the front of the heart",
    "An X-ray test that shows the heart's blood vessels", "One blood vessel of the heart is diseased", "A heart tracing test",
    "A blood test that shows heart damage", "Tablet", "Morning only", "Morning and night", "Night only", "At bedtime", "Before food",
    "After food", "Under the tongue", "Only when needed", "Twice a day", "1 week", "Outpatient clinic", "Complete blood count test",
    "Kidney function test", "Cholesterol test", "Ultrasound scan of the heart", "Emergency room",
  ],
});

const HI = build({
  diagnosis: "आपको दिल का दौरा पड़ा था, क्योंकि दिल की एक नस बंद हो गई थी। आपको हाई बीपी और शुगर (डायबिटीज़) भी है।",
  happened: "आप 6 घंटे से सीने में दर्द के साथ अस्पताल आए थे। जाँच में पता चला कि दिल की एक मुख्य नस 90% बंद थी। 25 अक्टूबर को डॉक्टरों ने उसे एक छोटे गुब्बारे से खोला और एक स्टेंट डाला। स्टेंट एक छोटी नली है जो नस को खुला रखती है। आप अच्छे से ठीक हुए और स्थिर हालत में घर गए।",
  meds: [
    ["स्टेंट खुला रखने और खून का थक्का रोकने के लिए", "1 गोली", "इसे रोज़ लेते रहें।"],
    ["स्टेंट खुला रखने के लिए — बहुत ज़रूरी", "1 गोली", "1 साल तक लें। दिल के डॉक्टर से पूछे बिना बंद न करें।"],
    ["कोलेस्ट्रॉल कम करने और दिल को बचाने के लिए", "1 गोली", "सोने से पहले लें।"],
    ["बीपी के लिए", "1 गोली", ""],
    ["शुगर (डायबिटीज़) के लिए", "1 गोली", ""],
    ["पेट को बचाने के लिए", "1 गोली", "नाश्ते से पहले लें। सिर्फ़ 2 हफ़्ते के लिए।"],
    ["अचानक सीने में दर्द के लिए", "1 गोली जीभ के नीचे", "सिर्फ़ सीने में दर्द होने पर। जीभ के नीचे रखें, निगलें नहीं। अगर दर्द न जाए, तो तुरंत इमरजेंसी में जाएँ।"],
  ],
  follow: [
    ["डॉ. ए. कुलकर्णी से दिल की जाँच। खून की जाँच की रिपोर्ट साथ लाएँ।", "1 हफ़्ते बाद", "कार्डियो OPD, सिटी केयर हॉस्पिटल, पुणे"],
    ["दिल का अल्ट्रासाउंड (इको)", "1 महीने बाद", "सिटी केयर हॉस्पिटल, पुणे"],
  ],
  tests: [
    ["खून की जाँच (CBC)", "1 हफ़्ते वाली जाँच से पहले"],
    ["किडनी की जाँच (RFT)", "1 हफ़्ते वाली जाँच से पहले"],
    ["कोलेस्ट्रॉल की जाँच (लिपिड प्रोफ़ाइल)", "1 हफ़्ते वाली जाँच से पहले"],
    ["दिल का अल्ट्रासाउंड (इको)", "1 महीने बाद"],
  ],
  diet: ["नमक कम खाएँ।", "तेल, घी और तली हुई चीज़ें कम खाएँ।", "शुगर वाला खाना: चीनी, मिठाई और मीठे पेय बहुत कम।"],
  activity: ["दिन में दो बार 10 मिनट चलें। धीरे-धीरे हर दिन थोड़ा ज़्यादा चलें।", "4 हफ़्ते तक कोई भारी चीज़ न उठाएँ।", "धूम्रपान न करें।"],
  warnings: [
    ["सोर्बिट्रेट की गोली के बाद भी सीने का दर्द न जाए", "तुरंत इमरजेंसी में जाएँ या 108 पर कॉल करें।"],
    ["साँस लेने में तकलीफ़", "तुरंत इमरजेंसी में जाएँ या 108 पर कॉल करें।"],
    ["बहुत चक्कर आना या बेहोशी जैसा लगना", "तुरंत इमरजेंसी में जाएँ या 108 पर कॉल करें।"],
    ["काले रंग का मल (टट्टी)", "तुरंत इमरजेंसी में जाएँ।"],
  ],
  days: [
    ["सुबह और रात की सारी दवाइयाँ समय पर लें", "सुबह 10 मिनट और शाम 10 मिनट चलें", "कम नमक, कम तेल वाला खाना खाएँ", "सोर्बिट्रेट की गोली हमेशा साथ रखें"],
    ["सारी दवाइयाँ समय पर लें", "दो बार 10 मिनट चलें", "कोई भारी चीज़ न उठाएँ", "देख लें कि ब्रिलिंटा की गोलियाँ काफ़ी हैं"],
    ["सारी दवाइयाँ समय पर लें", "दो बार 10–12 मिनट चलें", "दिल की जाँच के लिए अस्पताल में अपॉइंटमेंट लें"],
    ["सारी दवाइयाँ समय पर लें", "दो बार 12 मिनट चलें", "खून की जाँच करवाएँ: CBC, किडनी, कोलेस्ट्रॉल"],
    ["सारी दवाइयाँ समय पर लें", "दो बार 12–15 मिनट चलें", "खून की जाँच की रिपोर्ट ले आएँ"],
    ["सारी दवाइयाँ समय पर लें", "दो बार 15 मिनट चलें", "जाँच के लिए यह पेपर और रिपोर्ट तैयार रखें"],
    ["सारी दवाइयाँ समय पर लें", "कार्डियो OPD में दिल की जाँच के लिए जाएँ", "यह पेपर, रिपोर्ट और सारी दवाइयों के पत्ते साथ ले जाएँ"],
  ],
  unclear: [
    "आपके पेपर में यह नहीं लिखा कि अटोरवा, टेल्मा और मेटफ़ॉर्मिन कितने दिन लेनी हैं। जाँच के समय डॉक्टर से पूछें।",
    "आपके पेपर में यह साफ़ नहीं लिखा कि खून की जाँच कब करवानी है। अस्पताल से पूछें कि क्या यह जाँच से पहले करवानी है।",
  ],
  glossary: [
    "एक तरह का दिल का दौरा", "हाई बीपी", "टाइप 2 डायबिटीज़ (शुगर)", "बंद नस को छोटे गुब्बारे से खोलना",
    "दवा लगा स्टेंट (छोटी नली) जो नस को खुला रखता है", "दिल के आगे की एक मुख्य नस", "दिल की नसें देखने वाला एक्स-रे टेस्ट",
    "दिल की एक नस में बीमारी", "दिल की धड़कन का टेस्ट", "दिल को हुए नुकसान का खून टेस्ट", "गोली", "सिर्फ़ सुबह", "सुबह और रात",
    "सिर्फ़ रात", "सोने से पहले", "खाने से पहले", "खाने के बाद", "जीभ के नीचे", "सिर्फ़ ज़रूरत पड़ने पर", "दिन में दो बार", "1 हफ़्ता",
    "बाहर के मरीज़ों का क्लिनिक", "पूरे खून की जाँच", "किडनी की जाँच", "कोलेस्ट्रॉल की जाँच", "दिल का अल्ट्रासाउंड", "इमरजेंसी विभाग",
  ],
});

const MR = build({
  diagnosis: "तुम्हाला हृदयविकाराचा झटका आला होता, कारण हृदयाची एक रक्तवाहिनी बंद झाली होती. तुम्हाला उच्च रक्तदाब (बीपी) आणि मधुमेह (शुगर) पण आहे.",
  happened: "तुम्ही 6 तासांपासून छातीत दुखत असल्यामुळे दवाखान्यात आलात. तपासणीत दिसले की हृदयाची एक मुख्य रक्तवाहिनी 90% बंद होती. 25 ऑक्टोबरला डॉक्टरांनी ती एका छोट्या फुग्याने उघडली आणि स्टेंट बसवला. स्टेंट ही एक छोटी नळी आहे जी रक्तवाहिनी उघडी ठेवते. तुम्ही चांगले बरे झालात आणि स्थिर स्थितीत घरी गेलात.",
  meds: [
    ["स्टेंट उघडा ठेवण्यासाठी आणि रक्ताची गाठ थांबवण्यासाठी", "1 गोळी", "हे रोज घेत राहा."],
    ["स्टेंट उघडा ठेवण्यासाठी — खूप महत्त्वाचे", "1 गोळी", "1 वर्ष घ्या. हृदयाच्या डॉक्टरांना विचारल्याशिवाय बंद करू नका."],
    ["कोलेस्टेरॉल कमी करण्यासाठी आणि हृदयाच्या रक्षणासाठी", "1 गोळी", "झोपण्यापूर्वी घ्या."],
    ["बीपीसाठी", "1 गोळी", ""],
    ["मधुमेहासाठी (शुगर)", "1 गोळी", ""],
    ["पोटाच्या रक्षणासाठी", "1 गोळी", "नाश्त्याआधी घ्या. फक्त 2 आठवडे."],
    ["अचानक छातीत दुखल्यास", "1 गोळी जिभेखाली", "फक्त छातीत दुखले तरच. जिभेखाली ठेवा, गिळू नका. दुखणे थांबले नाही तर लगेच इमर्जन्सीमध्ये जा."],
  ],
  follow: [
    ["डॉ. ए. कुलकर्णी यांच्याकडे हृदयाची तपासणी. रक्त तपासणीचे रिपोर्ट सोबत आणा.", "1 आठवड्यानंतर", "कार्डिओ OPD, सिटी केअर हॉस्पिटल, पुणे"],
    ["हृदयाची सोनोग्राफी (इको)", "1 महिन्यानंतर", "सिटी केअर हॉस्पिटल, पुणे"],
  ],
  tests: [
    ["रक्त तपासणी (CBC)", "1 आठवड्याच्या तपासणीआधी"],
    ["किडनीची तपासणी (RFT)", "1 आठवड्याच्या तपासणीआधी"],
    ["कोलेस्टेरॉलची तपासणी (लिपिड प्रोफाइल)", "1 आठवड्याच्या तपासणीआधी"],
    ["हृदयाची सोनोग्राफी (इको)", "1 महिन्यानंतर"],
  ],
  diet: ["मीठ कमी खा.", "तेल, तूप आणि तळलेले पदार्थ कमी खा.", "मधुमेहाचा आहार: साखर, मिठाई आणि गोड पेये अगदी कमी."],
  activity: ["दिवसातून दोनदा 10 मिनिटे चाला. रोज हळूहळू थोडे जास्त चाला.", "4 आठवडे कोणतीही जड वस्तू उचलू नका.", "धूम्रपान करू नका."],
  warnings: [
    ["सॉर्बिट्रेट गोळी घेतल्यावरही छातीत दुखणे थांबत नाही", "लगेच इमर्जन्सीमध्ये जा किंवा 108 ला फोन करा."],
    ["श्वास घ्यायला त्रास", "लगेच इमर्जन्सीमध्ये जा किंवा 108 ला फोन करा."],
    ["खूप चक्कर येणे किंवा बेशुद्ध होईल असे वाटणे", "लगेच इमर्जन्सीमध्ये जा किंवा 108 ला फोन करा."],
    ["काळ्या रंगाची संडास", "लगेच इमर्जन्सीमध्ये जा."],
  ],
  days: [
    ["सकाळची आणि रात्रीची सगळी औषधे वेळेवर घ्या", "सकाळी 10 मिनिटे आणि संध्याकाळी 10 मिनिटे चाला", "कमी मीठ, कमी तेलाचे जेवण घ्या", "सॉर्बिट्रेट गोळी नेहमी जवळ ठेवा"],
    ["सगळी औषधे वेळेवर घ्या", "दोनदा 10 मिनिटे चाला", "कोणतीही जड वस्तू उचलू नका", "ब्रिलिंटाच्या गोळ्या पुरेशा आहेत का ते पाहा"],
    ["सगळी औषधे वेळेवर घ्या", "दोनदा 10–12 मिनिटे चाला", "हृदयाच्या तपासणीसाठी दवाखान्यात वेळ घ्या"],
    ["सगळी औषधे वेळेवर घ्या", "दोनदा 12 मिनिटे चाला", "रक्त तपासणी करून घ्या: CBC, किडनी, कोलेस्टेरॉल"],
    ["सगळी औषधे वेळेवर घ्या", "दोनदा 12–15 मिनिटे चाला", "रक्त तपासणीचे रिपोर्ट घेऊन या"],
    ["सगळी औषधे वेळेवर घ्या", "दोनदा 15 मिनिटे चाला", "तपासणीसाठी हा पेपर आणि रिपोर्ट तयार ठेवा"],
    ["सगळी औषधे वेळेवर घ्या", "कार्डिओ OPD मध्ये हृदयाच्या तपासणीला जा", "हा पेपर, रिपोर्ट आणि सगळ्या औषधांची पाकिटे सोबत न्या"],
  ],
  unclear: [
    "अटोर्वा, टेल्मा आणि मेटफॉर्मिन किती दिवस घ्यायचे ते तुमच्या पेपरमध्ये लिहिलेले नाही. तपासणीच्या वेळी डॉक्टरांना विचारा.",
    "रक्त तपासणी नक्की कधी करायची ते पेपरमध्ये स्पष्ट नाही. ती तपासणीआधी करायची का ते दवाखान्यात विचारा.",
  ],
  glossary: [
    "हृदयविकाराच्या झटक्याचा एक प्रकार", "उच्च रक्तदाब (बीपी)", "टाइप 2 मधुमेह (शुगर)", "बंद रक्तवाहिनी छोट्या फुग्याने उघडणे",
    "औषध लावलेला स्टेंट (छोटी नळी) जो रक्तवाहिनी उघडी ठेवतो", "हृदयाच्या पुढच्या बाजूची एक मुख्य रक्तवाहिनी",
    "हृदयाच्या रक्तवाहिन्या दाखवणारी एक्स-रे तपासणी", "हृदयाच्या एका रक्तवाहिनीत आजार", "हृदयाच्या ठोक्यांची तपासणी",
    "हृदयाला झालेले नुकसान दाखवणारी रक्त तपासणी", "गोळी", "फक्त सकाळी", "सकाळी आणि रात्री", "फक्त रात्री", "झोपण्यापूर्वी",
    "जेवणाआधी", "जेवणानंतर", "जिभेखाली", "फक्त गरज असेल तेव्हा", "दिवसातून दोनदा", "1 आठवडा", "बाह्यरुग्ण विभाग",
    "संपूर्ण रक्त तपासणी", "किडनीची तपासणी", "कोलेस्टेरॉलची तपासणी", "हृदयाची सोनोग्राफी", "इमर्जन्सी विभाग",
  ],
});

export const SAMPLE_PLANS: Partial<Record<LangCode, DischargePlan>> = { "en-IN": EN, "hi-IN": HI, "mr-IN": MR };

// Offline answers so the sample's voice Q&A still works with no network or credits.
const has = (q: string, words: string[]) => words.some((w) => q.includes(w));

export function sampleAnswer(question: string, lang: LangCode): { answer: string; emergency: boolean } | null {
  const q = question.toLowerCase();
  const L = lang === "hi-IN" || lang === "mr-IN" ? lang : "en-IN";
  const A = (en: string, hi: string, mr: string) => ({ "en-IN": en, "hi-IN": hi, "mr-IN": mr })[L];

  if (has(q, ["chest", "seene", "seena", "सीन", "छाती", "chhati", "breath", "saans", "साँस", "सांस", "श्वास", "faint", "बेहोश", "बेशुद्ध", "chakkar", "चक्कर", "black stool", "काल"])) {
    return {
      emergency: true,
      answer: A(
        "This could be serious. Go to the nearest emergency or call 108 now. If you have chest pain, keep one Sorbitrate tablet under your tongue on the way.",
        "यह गंभीर हो सकता है। अभी नज़दीकी इमरजेंसी में जाएँ या 108 पर कॉल करें। सीने में दर्द हो तो रास्ते में सोर्बिट्रेट की एक गोली जीभ के नीचे रखें।",
        "हे गंभीर असू शकते. लगेच जवळच्या इमर्जन्सीमध्ये जा किंवा 108 ला फोन करा. छातीत दुखत असेल तर वाटेत सॉर्बिट्रेटची एक गोळी जिभेखाली ठेवा.",
      ),
    };
  }
  if (has(q, ["brilinta", "ब्रिलिंटा", "ब्रिलिंटा", "brilenta"]) || (has(q, ["stop", "band", "बंद", "थांब"]) && has(q, ["dawa", "दवा", "औषध", "medicine", "goli", "गोली", "गोळी"]))) {
    return {
      emergency: false,
      answer: A(
        "No. Your paper says Brilinta is for 1 year — \"do not stop\". It keeps your stent open. Please don't stop any heart medicine without asking Dr. A. Kulkarni.",
        "नहीं। आपके पेपर में लिखा है कि ब्रिलिंटा 1 साल तक लेनी है — \"do not stop\", यानी बंद न करें। यह आपका स्टेंट खुला रखती है। डॉ. ए. कुलकर्णी से पूछे बिना दिल की कोई दवा बंद न करें।",
        "नाही. तुमच्या पेपरमध्ये लिहिले आहे की ब्रिलिंटा 1 वर्ष घ्यायची आहे — \"do not stop\", म्हणजे बंद करू नका. ती तुमचा स्टेंट उघडा ठेवते. डॉ. ए. कुलकर्णी यांना विचारल्याशिवाय हृदयाचे कोणतेही औषध बंद करू नका.",
      ),
    };
  }
  if (has(q, ["rice", "chawal", "चावल", "भात", "bhaat", "eat", "khana", "खा", "food"])) {
    return {
      emergency: false,
      answer: A(
        "Your paper says: low salt, low fat, diabetic diet. It doesn't say anything about rice specifically, so please ask your doctor how much rice is okay for your sugar.",
        "आपके पेपर में लिखा है: कम नमक, कम तेल और शुगर वाला खाना। चावल के बारे में अलग से कुछ नहीं लिखा, इसलिए डॉक्टर से पूछें कि शुगर के हिसाब से कितना चावल ठीक है।",
        "तुमच्या पेपरमध्ये लिहिले आहे: कमी मीठ, कमी तेल आणि मधुमेहाचा आहार. भाताबद्दल वेगळे काही लिहिलेले नाही, म्हणून शुगरनुसार किती भात चालेल ते डॉक्टरांना विचारा.",
      ),
    };
  }
  if (has(q, ["miss", "forgot", "chhoot", "छूट", "भूल", "चुक", "विसर"])) {
    return {
      emergency: false,
      answer: A(
        "Your paper doesn't say what to do if you miss a dose. Please don't take a double dose. Call City Care Hospital or ask Dr. A. Kulkarni.",
        "आपके पेपर में यह नहीं लिखा कि दवा छूट जाए तो क्या करें। दोगुनी दवा न लें। सिटी केयर हॉस्पिटल को फ़ोन करें या डॉ. ए. कुलकर्णी से पूछें।",
        "औषध चुकले तर काय करायचे ते तुमच्या पेपरमध्ये लिहिलेले नाही. दुप्पट औषध घेऊ नका. सिटी केअर हॉस्पिटलला फोन करा किंवा डॉ. ए. कुलकर्णी यांना विचारा.",
      ),
    };
  }
  if (has(q, ["walk", "bath", "chal", "चल", "nah", "नहा", "अंघोळ", "चाल", "lift", "उठा"])) {
    return {
      emergency: false,
      answer: A(
        "Your paper says: walk 10 minutes twice a day and slowly increase. Don't lift anything heavy for 4 weeks. It doesn't say anything about bathing — please ask your doctor.",
        "आपके पेपर में लिखा है: दिन में दो बार 10 मिनट चलें और धीरे-धीरे बढ़ाएँ। 4 हफ़्ते तक भारी चीज़ न उठाएँ। नहाने के बारे में कुछ नहीं लिखा — डॉक्टर से पूछें।",
        "तुमच्या पेपरमध्ये लिहिले आहे: दिवसातून दोनदा 10 मिनिटे चाला आणि हळूहळू वाढवा. 4 आठवडे जड वस्तू उचलू नका. अंघोळीबद्दल काही लिहिलेले नाही — डॉक्टरांना विचारा.",
      ),
    };
  }
  return null;
}
