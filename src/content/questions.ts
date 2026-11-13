import type { Exercise } from "@/lib/types";
import { builders } from "./exercise-builders";

export const QUESTION_WORDS: { de: string; sq: string; example: string; exampleSq: string; answer: string }[] = [
  { de: "Wer?", sq: "Kush?", example: "Wer ist Ihr Ansprechpartner?", exampleSq: "Kush është personi Juaj i kontaktit?", answer: "Herr Weber." },
  { de: "Was?", sq: "Çfarë?", example: "Was haben Sie bestellt?", exampleSq: "Çfarë keni porositur?", answer: "Einen Laptop." },
  { de: "Wann?", sq: "Kur?", example: "Wann haben Sie die Rechnung bekommen?", exampleSq: "Kur e keni marrë faturën?", answer: "Gestern." },
  { de: "Wo?", sq: "Ku?", example: "Wo wohnen Sie?", exampleSq: "Ku banoni?", answer: "In Hamburg." },
  { de: "Wohin?", sq: "Për ku?", example: "Wohin sollen wir das Paket schicken?", exampleSq: "Ku duhet ta dërgojmë pakon?", answer: "An meine Arbeitsadresse." },
  { de: "Woher?", sq: "Nga?", example: "Woher kommen Sie?", exampleSq: "Nga vini?", answer: "Aus dem Kosovo." },
  { de: "Warum?", sq: "Pse?", example: "Warum möchten Sie den Vertrag kündigen?", exampleSq: "Pse doni ta anuloni kontratën?", answer: "Weil es zu teuer ist." },
  { de: "Wie?", sq: "Si?", example: "Wie kann ich Ihnen helfen?", exampleSq: "Si mund t'Ju ndihmoj?", answer: "Ich habe ein Problem." },
  { de: "Wie lange?", sq: "Sa kohë?", example: "Wie lange dauert die Lieferung?", exampleSq: "Sa zgjat dërgesa?", answer: "Drei Tage." },
  { de: "Wie oft?", sq: "Sa shpesh?", example: "Wie oft lernst du Deutsch?", exampleSq: "Sa shpesh mëson gjermanisht?", answer: "Jeden Tag." },
  { de: "Wie viel?", sq: "Sa? (sasi)", example: "Wie viel kostet das?", exampleSq: "Sa kushton kjo?", answer: "20 Euro." },
  { de: "Mit wem?", sq: "Me kë?", example: "Mit wem habe ich gesprochen?", exampleSq: "Me kë kam folur?", answer: "Mit Frau Klein." },
  { de: "Für wen?", sq: "Për kë?", example: "Für wen ist das Geschenk?", exampleSq: "Për kë është dhurata?", answer: "Für meine Mutter." },
  { de: "Seit wann?", sq: "Që kur?", example: "Seit wann haben Sie das Problem?", exampleSq: "Që kur e keni problemin?", answer: "Seit Montag." },
  { de: "Welche/r/s?", sq: "Cili/cila?", example: "Welches Modell haben Sie?", exampleSq: "Cilin model keni?", answer: "Das Modell X200." },
];

const s1 = builders("a1-questions", "A1");
const s2 = builders("a1-questions", "A2");
const s3 = builders("a1-questions", "A2");
const s4 = builders("b1-nebensatz", "B1");

export interface QuestionStage {
  id: string;
  title: string;
  titleSq: string;
  descriptionSq: string;
  exercises: Exercise[];
}

export const QUESTION_STAGES: QuestionStage[] = [
  {
    id: "qs1",
    title: "Stufe 1: Einfache Fragen mit 'du'",
    titleSq: "Niveli 1: Pyetje të thjeshta me 'du'",
    descriptionSq: "W-Wort + folja + du. Ja/Nein: folja + du.",
    exercises: [
      s1.tr("qs1-01", "Ku banon ti?", ["Wo wohnst du?"], "Wo + wohnst + du?"),
      s1.tr("qs1-02", "Nga vjen ti?", ["Woher kommst du?"], "Woher + kommst + du?"),
      s1.tr("qs1-03", "A banon ti në Berlin?", ["Wohnst du in Berlin?"], "Ja/Nein: folja përpara."),
      s1.tr("qs1-04", "Si quhesh?", ["Wie heißt du?"], "Wie + heißt + du?"),
      s1.tr("qs1-05", "Çfarë bën ti në fundjavë?", ["Was machst du am Wochenende?"], "Was + machst + du + am Wochenende?"),
      s1.tf("qs1-06", "Ich arbeite heute. → Ja/Nein-Frage", ["Arbeitest du heute?"], "Folja përpara, ich → du.", "Bëj pyetjen Po/Jo."),
      s1.tf("qs1-07", "Ich wohne in Prishtina. → Frage", ["Wo wohnst du?"], "Përgjigjja është vend → Wo?", "Cila pyetje i përshtatet kësaj përgjigjeje?"),
      s1.tf("qs1-08", "Ich komme aus Albanien. → Frage", ["Woher kommst du?"], "Origjinë → Woher?", "Cila pyetje i përshtatet kësaj përgjigjeje?"),
      s1.mc("qs1-09", "___ kostet das? — 5 Euro.", ["Wie viel", "Wann", "Wer"], 0, "Çmim → Wie viel?"),
      s1.mc("qs1-10", "___ ist das? — Das ist mein Bruder.", ["Was", "Wer", "Wo"], 1, "Person → Wer?"),
      s1.ord("qs1-11", "Hast du heute Zeit?", "Ja/Nein: folja (hast) përpara."),
      s1.fix("qs1-12", "Wo du arbeitest?", ["Wo arbeitest du?"], "Folja menjëherë pas 'Wo'."),
    ],
  },
  {
    id: "qs2",
    title: "Stufe 2: Formelle Fragen mit 'Sie' und Modalverben",
    titleSq: "Niveli 2: Pyetje formale me 'Sie' dhe folje modale",
    descriptionSq: "Me klientë: Sie. Me modale: paskajorja në fund (Können Sie mir helfen?).",
    exercises: [
      s2.tr("qs2-01", "Si quheni Ju?", ["Wie heißen Sie?", "Wie ist Ihr Name?"], "Wie + heißen + Sie?"),
      s2.tr("qs2-02", "A mund të më ndihmoni?", ["Können Sie mir helfen?", "Könnten Sie mir helfen?"], "Modale përpara, helfen në fund."),
      s2.tr("qs2-03", "Kur keni kohë?", ["Wann haben Sie Zeit?"], "Wann + haben + Sie + Zeit?"),
      s2.tr("qs2-04", "Si mund t'Ju ndihmoj?", ["Wie kann ich Ihnen helfen?"], "Wie + kann + ich + Ihnen + helfen?"),
      s2.tr("qs2-05", "A keni një numër porosie?", ["Haben Sie eine Bestellnummer?"], "Ja/Nein: Haben Sie ...?"),
      s2.tr("qs2-06", "Pse doni ta anuloni porosinë?", ["Warum möchten Sie die Bestellung stornieren?", "Warum wollen Sie die Bestellung stornieren?"], "Warum + möchten + Sie + ... + stornieren?"),
      s2.tf("qs2-07", "Ich möchte eine Rückerstattung. → Ja/Nein-Frage mit Sie", ["Möchten Sie eine Rückerstattung?"], "Möchten Sie ...?", "Bëj pyetje formale Po/Jo."),
      s2.tf("qs2-08", "Ich kann am Montag kommen. → Frage mit 'Wann' (Sie)", ["Wann können Sie kommen?"], "Wann + können + Sie + kommen?", "Pyetje me 'Wann'."),
      s2.tr("qs2-09", "Sa zgjat dërgesa?", ["Wie lange dauert die Lieferung?"], "Wie lange + dauert + ..."),
      s2.tr("qs2-10", "Me kë kam folur?", ["Mit wem habe ich gesprochen?"], "Mit wem + habe + ich + gesprochen?"),
      s2.fix("qs2-11", "Können Sie helfen mir?", ["Können Sie mir helfen?"], "helfen në fund."),
      s2.tr("qs2-12", "Që kur e keni problemin?", ["Seit wann haben Sie das Problem?"], "Seit wann + haben + Sie ...?"),
    ],
  },
  {
    id: "qs3",
    title: "Stufe 3: Fragen im Perfekt und mit trennbaren Verben",
    titleSq: "Niveli 3: Pyetje në Perfekt dhe me folje të ndashme",
    descriptionSq: "Wann haben Sie bestellt? · Wann kommt das Paket an?",
    exercises: [
      s3.tr("qs3-01", "Kur keni porositur?", ["Wann haben Sie bestellt?"], "Wann + haben + Sie + bestellt?"),
      s3.tr("qs3-02", "A e keni marrë faturën?", ["Haben Sie die Rechnung bekommen?", "Haben Sie die Rechnung erhalten?"], "Haben + Sie + ... + bekommen?"),
      s3.tr("qs3-03", "Kur arrin pakoja?", ["Wann kommt das Paket an?"], "kommt ... an."),
      s3.tr("qs3-04", "Çfarë ka ndodhur?", ["Was ist passiert?"], "passieren → sein: Was ist passiert?"),
      s3.tr("qs3-05", "A keni telefonuar tashmë?", ["Haben Sie schon angerufen?"], "Haben Sie schon angerufen?"),
      s3.tr("qs3-06", "Në çfarë ore ngrihesh?", ["Wann stehst du auf?", "Um wie viel Uhr stehst du auf?"], "stehst ... auf."),
      s3.tf("qs3-07", "Ich habe gestern einen Laptop bestellt. → Frage mit 'Was' (Sie)", ["Was haben Sie gestern bestellt?"], "Was + haben + Sie + gestern + bestellt?", "Pyetje me 'Was'."),
      s3.tf("qs3-08", "Das Paket ist am Montag angekommen. → Frage mit 'Wann'", ["Wann ist das Paket angekommen?"], "Wann + ist + das Paket + angekommen?", "Pyetje me 'Wann'."),
      s3.fix("qs3-09", "Wann Sie haben das Paket bekommen?", ["Wann haben Sie das Paket bekommen?"], "Folja ndihmëse menjëherë pas W-fjalës."),
      s3.fix("qs3-10", "Wann anrufen Sie mich zurück?", ["Wann rufen Sie mich zurück?"], "rufen ... zurück."),
      s3.tr("qs3-11", "Ku e keni blerë produktin?", ["Wo haben Sie das Produkt gekauft?"], "Wo + haben + Sie + ... + gekauft?"),
      s3.tr("qs3-12", "Me kë ke shkuar në kinema?", ["Mit wem bist du ins Kino gegangen?"], "gehen → sein: Mit wem bist du ... gegangen?"),
    ],
  },
  {
    id: "qs4",
    title: "Stufe 4: Indirekte und höfliche Fragen",
    titleSq: "Niveli 4: Pyetje indirekte dhe shumë të sjellshme",
    descriptionSq: "Können Sie mir sagen, wann der Techniker kommt? — në pyetjet indirekte folja shkon në fund.",
    exercises: [
      s4.tf("qs4-01", "Wann kommt der Techniker? → Können Sie mir sagen, ...", ["Können Sie mir sagen, wann der Techniker kommt?"], "wann ... kommt.", "Ktheje në pyetje indirekte."),
      s4.tf("qs4-02", "Wo ist meine Bestellung? → Wissen Sie, ...", ["Wissen Sie, wo meine Bestellung ist?"], "wo ... ist.", "Ktheje në pyetje indirekte."),
      s4.tf("qs4-03", "Ist das Paket schon unterwegs? → Können Sie prüfen, ob ...", ["Können Sie prüfen, ob das Paket schon unterwegs ist?"], "Ja/Nein indirekte → ob ... ist.", "Përdor 'ob'."),
      s4.tf("qs4-04", "Wie lange dauert die Rückerstattung? → Könnten Sie mir sagen, ...", ["Könnten Sie mir sagen, wie lange die Rückerstattung dauert?"], "wie lange ... dauert.", "Ktheje në pyetje indirekte."),
      s4.tr("qs4-05", "A mund të më thoni nëse fatura është e saktë?", ["Können Sie mir sagen, ob die Rechnung richtig ist?", "Könnten Sie mir sagen, ob die Rechnung richtig ist?"], "ob ... ist."),
      s4.tr("qs4-06", "A e dini kur mbyllet dyqani?", ["Wissen Sie, wann das Geschäft schließt?", "Wissen Sie, wann der Laden schließt?"], "wann ... schließt."),
      s4.fix("qs4-07", "Können Sie mir sagen, wann kommt die Lieferung?", ["Können Sie mir sagen, wann die Lieferung kommt?"], "Indirekte → folja në fund."),
      s4.fix("qs4-08", "Ich möchte wissen, ob haben Sie meine E-Mail bekommen.", ["Ich möchte wissen, ob Sie meine E-Mail bekommen haben."], "ob ... bekommen haben."),
      s4.tr("qs4-09", "A do të ishte e mundur ta ndryshonim adresën?", ["Wäre es möglich, die Adresse zu ändern?"], "Wäre es möglich, ... zu ändern?"),
      s4.tf("qs4-10", "Warum ist die Rechnung so hoch? → Ich verstehe nicht, ...", ["Ich verstehe nicht, warum die Rechnung so hoch ist."], "warum ... ist.", "Vazhdo fjalinë."),
    ],
  },
];

export const ALL_QUESTION_EXERCISES: Exercise[] = QUESTION_STAGES.flatMap((s) => s.exercises);
