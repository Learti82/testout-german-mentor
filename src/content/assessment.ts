import type { CEFR, Exercise } from "@/lib/types";
import { builders } from "./exercise-builders";

export interface ComprehensionText {
  id: string;
  level: CEFR;
  title: string;
  text: string;
  textSq: string;
  questions: Exercise[];
}

const r1 = builders("reading", "A1", "reading");
const r2 = builders("reading", "A2", "reading");
const r3 = builders("reading", "B1", "reading");
const l1 = builders("listening", "A1", "listening");
const l2 = builders("listening", "A2", "listening");
const l3 = builders("listening", "B1", "listening");

export const READING_TEXTS: ComprehensionText[] = [
  {
    id: "read-a1-arben",
    level: "A1",
    title: "Arbens Tag",
    text: "Arben ist 27 Jahre alt. Er wohnt in Prishtina. Jeden Tag steht er um sieben Uhr auf. Er trinkt Kaffee und fährt mit dem Bus zur Arbeit. Er arbeitet in einem Büro. Am Abend lernt er Deutsch, weil er in Deutschland arbeiten möchte.",
    textSq: "Arbeni është 27 vjeç. Jeton në Prishtinë. Çdo ditë ngrihet në orën shtatë. Pi kafe dhe shkon me autobus në punë. Punon në një zyrë. Në mbrëmje mëson gjermanisht, sepse dëshiron të punojë në Gjermani.",
    questions: [
      r1.mc("ra1-1", "Wann steht Arben auf?", ["Um sechs Uhr", "Um sieben Uhr", "Um acht Uhr"], 1, "Jeden Tag steht er um sieben Uhr auf."),
      r1.mc("ra1-2", "Wie fährt er zur Arbeit?", ["Mit dem Auto", "Mit dem Bus", "Mit dem Zug"], 1, "Er fährt mit dem Bus."),
      r1.mc("ra1-3", "Warum lernt er Deutsch?", ["Er möchte in Deutschland arbeiten.", "Er hat einen deutschen Freund.", "Er muss eine Prüfung machen."], 0, "..., weil er in Deutschland arbeiten möchte."),
    ],
  },
  {
    id: "read-a2-email",
    level: "A2",
    title: "E-Mail vom Online-Shop",
    text: "Sehr geehrte Frau Berisha, vielen Dank für Ihre Bestellung (Nr. 20931). Leider ist der Artikel 'Winterjacke, Größe M' im Moment nicht verfügbar. Wir können Ihnen die Jacke in zwei Wochen senden. Wenn Sie nicht warten möchten, können Sie die Bestellung stornieren. Sie bekommen dann Ihr Geld innerhalb von fünf Werktagen zurück. Mit freundlichen Grüßen, Ihr Kundenservice",
    textSq: "E nderuar zonja Berisha, faleminderit për porosinë (Nr. 20931). Fatkeqësisht artikulli 'Xhaketë dimri, masa M' nuk është në dispozicion për momentin. Mund t'jua dërgojmë xhaketën pas dy javësh. Nëse nuk doni të prisni, mund ta anuloni porosinë. Atëherë paratë do t'ju kthehen brenda pesë ditëve të punës. Me respekt, shërbimi i klientit",
    questions: [
      r2.mc("ra2-1", "Was ist das Problem?", ["Die Jacke ist kaputt.", "Die Jacke ist nicht verfügbar.", "Die Rechnung ist falsch."], 1, "nicht verfügbar = nuk është në dispozicion."),
      r2.mc("ra2-2", "Wann kann der Shop die Jacke senden?", ["Morgen", "In fünf Tagen", "In zwei Wochen"], 2, "in zwei Wochen."),
      r2.mc("ra2-3", "Was passiert, wenn Frau Berisha storniert?", ["Sie bekommt eine andere Jacke.", "Sie bekommt ihr Geld zurück.", "Sie muss eine Gebühr zahlen."], 1, "Sie bekommen Ihr Geld zurück."),
    ],
  },
  {
    id: "read-b1-job",
    level: "B1",
    title: "Stellenanzeige",
    text: "Wir suchen ab sofort Mitarbeiter (m/w/d) für unseren Kundenservice im Homeoffice. Ihre Aufgaben: Sie beantworten Anrufe und E-Mails von Kunden, bearbeiten Reklamationen und helfen bei Fragen zu Rechnungen. Wir erwarten gute Deutschkenntnisse (mindestens B1), Freundlichkeit und Geduld. Erfahrung im Kundenservice ist von Vorteil, aber nicht notwendig. Wir bieten eine gründliche Einarbeitung, flexible Arbeitszeiten und ein faires Gehalt.",
    textSq: "Kërkojmë menjëherë punonjës (m/f/d) për shërbimin tonë të klientit nga shtëpia. Detyrat: u përgjigjeni telefonatave dhe email-eve të klientëve, përpunoni reklamime dhe ndihmoni me pyetje për faturat. Presim njohuri të mira të gjermanishtes (të paktën B1), mirësjellje dhe durim. Përvoja në shërbimin e klientit është avantazh, por jo e domosdoshme. Ofrojmë trajnim të plotë, orar fleksibël dhe pagë të drejtë.",
    questions: [
      r3.mc("rb1-1", "Wo arbeitet man?", ["Im Büro in Berlin", "Im Homeoffice", "Im Geschäft"], 1, "im Homeoffice."),
      r3.mc("rb1-2", "Welches Deutschniveau braucht man mindestens?", ["A2", "B1", "C1"], 1, "mindestens B1."),
      r3.mc("rb1-3", "Braucht man Erfahrung im Kundenservice?", ["Ja, unbedingt.", "Nein, aber sie ist hilfreich.", "Ja, mindestens zwei Jahre."], 1, "von Vorteil, aber nicht notwendig."),
      r3.mc("rb1-4", "Was bietet die Firma NICHT an?", ["Einarbeitung", "Flexible Arbeitszeiten", "Einen Firmenwagen"], 2, "Firmenwagen nuk përmendet."),
    ],
  },
];

export const LISTENING_TEXTS: ComprehensionText[] = [
  {
    id: "listen-a1-intro",
    level: "A1",
    title: "Eine Vorstellung",
    text: "Hallo, ich heiße Lisa. Ich komme aus Österreich, aber ich wohne in Hamburg. Ich bin Lehrerin. In meiner Freizeit spiele ich Tennis.",
    textSq: "Përshëndetje, quhem Lisa. Vij nga Austria, por jetoj në Hamburg. Jam mësuese. Në kohën e lirë luaj tenis.",
    questions: [
      l1.mc("la1-1", "Woher kommt Lisa?", ["Aus Deutschland", "Aus Österreich", "Aus der Schweiz"], 1, "Ich komme aus Österreich."),
      l1.mc("la1-2", "Was ist Lisa von Beruf?", ["Ärztin", "Lehrerin", "Verkäuferin"], 1, "Ich bin Lehrerin."),
      l1.mc("la1-3", "Was macht sie in der Freizeit?", ["Sie spielt Tennis.", "Sie liest.", "Sie kocht."], 0, "Ich spiele Tennis."),
    ],
  },
  {
    id: "listen-a2-call",
    level: "A2",
    title: "Ein Anruf beim Kundenservice",
    text: "Guten Tag, mein Name ist Peter Brandt. Ich habe am Montag einen Drucker bestellt. Heute ist das Paket gekommen, aber der Drucker funktioniert nicht. Ich möchte bitte einen neuen Drucker. Meine Bestellnummer ist 7 7 4 1 2. Sie können mich bis 18 Uhr anrufen.",
    textSq: "Mirëdita, quhem Peter Brandt. Të hënën porosita një printer. Sot erdhi pakoja, por printeri nuk funksionon. Dëshiroj një printer të ri. Numri i porosisë është 77412. Mund të më telefononi deri në orën 18.",
    questions: [
      l2.mc("la2-1", "Was hat Herr Brandt bestellt?", ["Einen Laptop", "Einen Drucker", "Ein Handy"], 1, "einen Drucker."),
      l2.mc("la2-2", "Was möchte er?", ["Sein Geld zurück", "Einen neuen Drucker", "Eine Rechnung"], 1, "einen neuen Drucker."),
      l2.mc("la2-3", "Bis wann kann man ihn anrufen?", ["Bis 16 Uhr", "Bis 18 Uhr", "Bis 20 Uhr"], 1, "bis 18 Uhr."),
    ],
  },
  {
    id: "listen-b1-voicemail",
    level: "B1",
    title: "Nachricht auf der Mailbox",
    text: "Hallo Frau Gashi, hier ist Thomas Weber von der Personalabteilung. Vielen Dank für Ihre Bewerbung. Wir würden Sie gern zu einem Vorstellungsgespräch einladen. Passt Ihnen Mittwoch um zehn Uhr? Das Gespräch findet online statt und dauert ungefähr eine halbe Stunde. Bitte rufen Sie mich zurück oder schreiben Sie mir eine E-Mail, falls der Termin nicht passt.",
    textSq: "Përshëndetje zonja Gashi, jam Thomas Weber nga departamenti i personelit. Faleminderit për aplikimin. Do të donim t'Ju ftonim në një intervistë pune. A Ju përshtatet e mërkura në orën dhjetë? Biseda zhvillohet online dhe zgjat rreth gjysmë ore. Ju lutem më telefononi ose më shkruani një email, në rast se termini nuk Ju përshtatet.",
    questions: [
      l3.mc("lb1-1", "Warum ruft Herr Weber an?", ["Wegen einer Rechnung", "Wegen eines Vorstellungsgesprächs", "Wegen einer Bestellung"], 1, "Vorstellungsgespräch = intervistë pune."),
      l3.mc("lb1-2", "Wie lange dauert das Gespräch?", ["10 Minuten", "Etwa 30 Minuten", "Eine Stunde"], 1, "eine halbe Stunde."),
      l3.mc("lb1-3", "Was soll Frau Gashi tun, wenn der Termin nicht passt?", ["Nichts", "Zurückrufen oder eine E-Mail schreiben", "Zum Büro kommen"], 1, "Bitte rufen Sie mich zurück oder schreiben Sie ..."),
    ],
  },
];

/** Placement test — short, covers sentence building, questions, core grammar and a short conversation. */
const p1 = builders("placement", "A1");
const p2 = builders("placement", "A2");
const p3 = builders("placement", "B1");

export const PLACEMENT = {
  sentences: [
    { ...p1.ord("s1", "Ich wohne in Prishtina.", "Kryefjala + folja + vendi."), topicId: "a1-present" },
    { ...p2.ord("s2", "Am Wochenende gehe ich mit meinen Freunden ins Kino.", "Koha në vendin 1 → folja në vendin 2."), topicId: "a2-dativ" },
    { ...p2.ord("s3", "Ich stehe jeden Tag um sieben Uhr auf.", "Folje e ndashme: auf në fund."), topicId: "a2-separable" },
    { ...p2.tr("s4", "Mësoj gjermanisht, sepse dua të punoj në Gjermani.", ["Ich lerne Deutsch, weil ich in Deutschland arbeiten möchte.", "Ich lerne Deutsch, weil ich in Deutschland arbeiten will."], "weil → folja në fund."), topicId: "a2-connectors" },
    { ...p2.tr("s5", "Dje kam punuar shumë.", ["Gestern habe ich viel gearbeitet.", "Ich habe gestern viel gearbeitet."], "Perfekt: habe ... gearbeitet."), topicId: "a2-perfekt" },
  ] as Exercise[],
  questions: [
    { ...p1.tr("q1", "Ku banon ti?", ["Wo wohnst du?"], "Wo + wohnst + du?"), topicId: "a1-questions" },
    { ...p1.tf("q2", "Du hast heute Zeit. → Ja/Nein-Frage", ["Hast du heute Zeit?"], "Folja përpara.", "Bëje pyetje Po/Jo."), topicId: "a1-questions" },
    { ...p2.tr("q3", "Kur keni porositur?", ["Wann haben Sie bestellt?"], "Wann + haben + Sie + bestellt?"), topicId: "a1-questions" },
    { ...p2.tf("q4", "Ich komme aus Tirana. → Frage (Sie)", ["Woher kommen Sie?"], "Origjina → Woher?", "Cila pyetje i përshtatet përgjigjes?"), topicId: "a1-questions" },
    { ...p3.tf("q5", "Wann kommt der Techniker? → Können Sie mir sagen, ...", ["Können Sie mir sagen, wann der Techniker kommt?"], "Pyetje indirekte → folja në fund.", "Pyetje indirekte."), topicId: "b1-nebensatz" },
  ] as Exercise[],
  grammar: [
    { ...p1.mc("g1", "Ich ___ 25 Jahre alt.", ["habe", "bin", "ist"], 1, "Mosha → sein."), topicId: "a1-sein-haben" },
    { ...p1.mc("g2", "Ich brauche ___ Ersatz.", ["ein", "einen", "eine"], 1, "der Ersatz, Akk. → einen."), topicId: "a1-nom-akk" },
    { ...p1.mc("g3", "___ Bestellung ist angekommen.", ["Der", "Die", "Das"], 1, "die Bestellung."), topicId: "a1-articles" },
    { ...p1.mc("g4", "Ich kann ___.", ["heute nicht kommen", "nicht kommen heute", "kommen heute nicht"], 0, "Paskajorja në fund."), topicId: "a1-modal" },
    { ...p2.mc("g5", "Ich gehe mit ___ ins Kino.", ["meine Freunde", "meinen Freunden", "meiner Freunde"], 1, "mit + Dativ shumës."), topicId: "a2-dativ" },
    { ...p2.mc("g6", "Ich freue ___ auf das Wochenende.", ["mich", "sich", "mir"], 0, "ich → mich."), topicId: "a2-reflexive" },
    { ...p2.mc("g7", "Gestern ___ ich nach Hause gegangen.", ["habe", "bin", "war"], 1, "gehen → sein."), topicId: "a2-perfekt" },
    { ...p2.mc("g8", "Ich bin müde, deshalb ___ nach Hause.", ["ich gehe", "gehe ich", "gehen ich"], 1, "deshalb → folje + kryefjalë."), topicId: "a2-connectors" },
    { ...p3.mc("g9", "Ich weiß nicht, ob er morgen ___.", ["kommt", "kommt er", "er kommt"], 0, "ob → folja në fund."), topicId: "b1-nebensatz" },
    { ...p3.mc("g10", "___ Sie das bitte wiederholen?", ["Könnten", "Konnten", "Können ihr"], 0, "Konjunktiv II i sjellshëm."), topicId: "b1-konjunktiv2" },
  ] as Exercise[],
  conversation: [
    { de: "Erzählen Sie kurz von sich: Wer sind Sie und was machen Sie?", sq: "Tregoni shkurt për veten: kush jeni dhe çfarë bëni?", model: "Ich heiße Arben. Ich komme aus dem Kosovo und arbeite in einem Büro." },
    { de: "Was haben Sie letztes Wochenende gemacht?", sq: "Çfarë bëtë fundjavën e kaluar?", model: "Letztes Wochenende habe ich meine Familie besucht und wir sind spazieren gegangen." },
    { de: "Warum lernen Sie Deutsch und was ist Ihr Ziel?", sq: "Pse mësoni gjermanisht dhe cili është qëllimi Juaj?", model: "Ich lerne Deutsch, weil ich in einem deutschen Callcenter arbeiten möchte. Mein Ziel ist B2." },
  ],
};
