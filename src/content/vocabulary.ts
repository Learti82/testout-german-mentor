import type { CEFR, VocabWord } from "@/lib/types";

type Seed = [
  german: string,
  albanian: string,
  article: VocabWord["article"],
  plural: string | null,
  pos: VocabWord["partOfSpeech"],
  example: string,
  exampleSq: string,
  level: CEFR,
  difficulty: 1 | 2 | 3,
  tags: string[],
];

// The words the learner already encountered come first (tag "encountered").
// They are NOT assumed mastered — they start as "new" and must be proven through reviews.
const SEED: Seed[] = [
  ["Anfrage", "kërkesa, pyetja (zyrtare)", "die", "die Anfragen", "noun", "Ich habe Ihre Anfrage bekommen.", "E kam marrë kërkesën Tuaj.", "A2", 2, ["encountered", "callcenter"]],
  ["Bestellung", "porosia", "die", "die Bestellungen", "noun", "Meine Bestellung ist noch nicht angekommen.", "Porosia ime nuk ka arritur ende.", "A2", 1, ["encountered", "callcenter"]],
  ["Rechnung", "fatura", "die", "die Rechnungen", "noun", "Die Rechnung ist leider falsch.", "Fatura fatkeqësisht është e gabuar.", "A1", 1, ["encountered", "callcenter"]],
  ["Ersatz", "zëvendësimi", "der", null, "noun", "Sie bekommen kostenlos einen Ersatz.", "Ju merrni falas një zëvendësim.", "A2", 2, ["encountered", "callcenter"]],
  ["Rückerstattung", "rimbursimi", "die", "die Rückerstattungen", "noun", "Die Rückerstattung dauert fünf Tage.", "Rimbursimi zgjat pesë ditë.", "B1", 3, ["encountered", "callcenter"]],
  ["senden", "dërgoj", null, null, "verb", "Ich sende Ihnen die Rechnung per E-Mail.", "Po Ju dërgoj faturën me email.", "A1", 1, ["encountered"]],
  ["machen", "bëj", null, null, "verb", "Was machst du am Wochenende?", "Çfarë bën në fundjavë?", "A1", 1, ["encountered"]],
  ["bereit sein", "jam gati", null, null, "phrase", "Sind Sie bereit? Dann fangen wir an.", "A jeni gati? Atëherë fillojmë.", "A1", 1, ["encountered"]],
  ["Zeit haben", "kam kohë", null, null, "phrase", "Haben Sie morgen Zeit?", "A keni kohë nesër?", "A1", 1, ["encountered"]],
  // Everyday core
  ["Termin", "takimi (i caktuar)", "der", "die Termine", "noun", "Ich möchte einen Termin vereinbaren.", "Dua të caktoj një takim.", "A1", 1, ["everyday"]],
  ["Frage", "pyetja", "die", "die Fragen", "noun", "Ich habe eine Frage.", "Kam një pyetje.", "A1", 1, ["everyday"]],
  ["helfen", "ndihmoj", null, null, "verb", "Wie kann ich Ihnen helfen?", "Si mund t'Ju ndihmoj?", "A1", 1, ["everyday", "callcenter"]],
  ["brauchen", "kam nevojë", null, null, "verb", "Ich brauche Ihre Kundennummer.", "Më duhet numri Juaj i klientit.", "A1", 1, ["everyday"]],
  ["Kunde", "klienti", "der", "die Kunden", "noun", "Der Kunde ist nicht zufrieden.", "Klienti nuk është i kënaqur.", "A1", 1, ["callcenter"]],
  ["Paket", "pakoja", "das", "die Pakete", "noun", "Das Paket liegt vor der Tür.", "Pakoja është para derës.", "A1", 1, ["everyday"]],
  ["Lieferung", "dërgesa", "die", "die Lieferungen", "noun", "Die Lieferung kommt morgen.", "Dërgesa vjen nesër.", "A2", 2, ["callcenter"]],
  ["beschädigt", "i dëmtuar", null, null, "adjective", "Das Produkt ist beschädigt.", "Produkti është i dëmtuar.", "A2", 2, ["callcenter"]],
  ["stornieren", "anuloj (porosi)", null, null, "verb", "Ich möchte die Bestellung stornieren.", "Dua ta anuloj porosinë.", "A2", 2, ["callcenter"]],
  ["überprüfen", "kontrolloj, verifikoj", null, null, "verb", "Ich werde das für Sie überprüfen.", "Do ta kontrolloj këtë për Ju.", "A2", 2, ["callcenter"]],
  ["Geduld", "durimi", "die", null, "noun", "Vielen Dank für Ihre Geduld.", "Faleminderit për durimin Tuaj.", "A2", 2, ["callcenter"]],
  ["wiederholen", "përsëris", null, null, "verb", "Könnten Sie das bitte wiederholen?", "A mund ta përsërisnit, ju lutem?", "A2", 2, ["callcenter"]],
  ["aufstehen", "ngrihem", null, null, "verb", "Ich stehe um sieben Uhr auf.", "Ngrihem në orën shtatë.", "A1", 1, ["everyday"]],
  ["anrufen", "telefonoj", null, null, "verb", "Ich rufe Sie morgen an.", "Do t'Ju telefonoj nesër.", "A1", 1, ["everyday", "callcenter"]],
  ["Wochenende", "fundjava", "das", "die Wochenenden", "noun", "Am Wochenende besuche ich meine Familie.", "Në fundjavë vizitoj familjen.", "A1", 1, ["everyday"]],
  ["Arbeit", "puna", "die", null, "noun", "Ich fahre mit dem Bus zur Arbeit.", "Shkoj me autobus në punë.", "A1", 1, ["everyday"]],
  ["Kollege", "kolegu", "der", "die Kollegen", "noun", "Mein Kollege hilft mir.", "Kolegu im më ndihmon.", "A1", 1, ["work"]],
  ["sich freuen", "gëzohem", null, null, "verb", "Ich freue mich auf das Wochenende.", "Gëzohem për fundjavën.", "A2", 2, ["everyday"]],
  ["sich beschweren", "ankohem", null, null, "verb", "Der Kunde beschwert sich über die Lieferung.", "Klienti ankohet për dërgesën.", "B1", 3, ["callcenter"]],
  ["Unannehmlichkeit", "bezdi, shqetësim", "die", "die Unannehmlichkeiten", "noun", "Es tut mir leid für die Unannehmlichkeiten.", "Më vjen keq për shqetësimin.", "B1", 3, ["callcenter"]],
  ["Kundennummer", "numri i klientit", "die", "die Kundennummern", "noun", "Wie lautet Ihre Kundennummer?", "Cili është numri Juaj i klientit?", "A2", 2, ["callcenter"]],
];

export function seedVocabulary(now = new Date().toISOString()): VocabWord[] {
  return SEED.map(([german, albanian, article, plural, partOfSpeech, example, exampleSq, level, difficulty, tags]) => ({
    id: "seed-" + german.toLowerCase().replace(/[^a-zäöüß]+/g, "-"),
    german,
    albanian,
    article,
    plural,
    partOfSpeech,
    example,
    exampleSq,
    level,
    difficulty,
    tags,
    status: "new",
    statusManual: false,
    source: "seed",
    createdAt: now,
  }));
}

export function displayWord(w: Pick<VocabWord, "german" | "article">): string {
  return w.article ? `${w.article} ${w.german}` : w.german;
}
