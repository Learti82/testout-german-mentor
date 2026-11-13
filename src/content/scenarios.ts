import type { CEFR } from "@/lib/types";

export interface SpeakingScenario {
  id: string;
  title: string;
  titleSq: string;
  level: CEFR;
  descriptionSq: string;
  /** Role / context for the AI conversation partner. */
  context: string;
  /** Offline fallback: questions asked one by one, with a model answer for comparison. */
  questions: { de: string; sq: string; model: string }[];
}

export const SPEAKING_SCENARIOS: SpeakingScenario[] = [
  {
    id: "intro",
    title: "Sich vorstellen",
    titleSq: "Prezantimi i vetes",
    level: "A1",
    descriptionSq: "Emri, mosha, nga vjen, ku banon, çfarë punon.",
    context: "Du lernst die Person bei einem Deutschkurs kennen. Frage nach Name, Herkunft, Wohnort, Beruf und warum sie Deutsch lernt.",
    questions: [
      { de: "Hallo! Wie heißt du?", sq: "Përshëndetje! Si quhesh?", model: "Ich heiße Arben." },
      { de: "Woher kommst du?", sq: "Nga vjen?", model: "Ich komme aus dem Kosovo." },
      { de: "Wo wohnst du jetzt?", sq: "Ku banon tani?", model: "Ich wohne jetzt in Prishtina." },
      { de: "Was machst du beruflich?", sq: "Çfarë pune bën?", model: "Ich arbeite im Kundenservice." },
      { de: "Warum lernst du Deutsch?", sq: "Pse mëson gjermanisht?", model: "Ich lerne Deutsch, weil ich in einem deutschen Callcenter arbeiten möchte." },
    ],
  },
  {
    id: "family",
    title: "Über die Familie sprechen",
    titleSq: "Për familjen",
    level: "A1",
    descriptionSq: "Prindërit, vëllezërit/motrat, fëmijët.",
    context: "Ein freundlicher Nachbar fragt nach der Familie.",
    questions: [
      { de: "Hast du Geschwister?", sq: "A ke vëllezër ose motra?", model: "Ja, ich habe einen Bruder und zwei Schwestern." },
      { de: "Wo wohnen deine Eltern?", sq: "Ku jetojnë prindërit e tu?", model: "Meine Eltern wohnen in Prizren." },
      { de: "Was machst du gern mit deiner Familie?", sq: "Çfarë të pëlqen të bësh me familjen?", model: "Am Wochenende essen wir zusammen und gehen spazieren." },
      { de: "Wie oft siehst du deine Familie?", sq: "Sa shpesh e sheh familjen?", model: "Ich sehe meine Familie jedes Wochenende." },
    ],
  },
  {
    id: "work",
    title: "Über die Arbeit sprechen",
    titleSq: "Për punën",
    level: "A2",
    descriptionSq: "Orari, detyrat, kolegët, çfarë të pëlqen.",
    context: "Ein neuer Bekannter fragt nach deinem Arbeitsalltag.",
    questions: [
      { de: "Wo arbeitest du?", sq: "Ku punon?", model: "Ich arbeite in einem Büro in der Stadt." },
      { de: "Wann stehst du morgens auf?", sq: "Kur ngrihesh në mëngjes?", model: "Ich stehe um sechs Uhr auf." },
      { de: "Was machst du bei der Arbeit?", sq: "Çfarë bën në punë?", model: "Ich beantworte Anfragen von Kunden und schreibe E-Mails." },
      { de: "Was gefällt dir an deiner Arbeit?", sq: "Çfarë të pëlqen në punën tënde?", model: "Mir gefällt, dass ich mit vielen Menschen spreche." },
      { de: "Was hast du gestern bei der Arbeit gemacht?", sq: "Çfarë bëre dje në punë?", model: "Gestern habe ich viele Kunden angerufen und Bestellungen geprüft." },
    ],
  },
  {
    id: "hobbies",
    title: "Hobbys und Freizeit",
    titleSq: "Hobet dhe koha e lirë",
    level: "A1",
    descriptionSq: "Çfarë bën në fundjavë dhe në kohën e lirë.",
    context: "Ein Kollege fragt in der Pause nach deinen Hobbys und dem Wochenende.",
    questions: [
      { de: "Was machst du normalerweise am Wochenende?", sq: "Çfarë bën zakonisht në fundjavë?", model: "Ich gehe mit meinen Freunden ins Café." },
      { de: "Treibst du Sport?", sq: "A merresh me sport?", model: "Ja, ich spiele zweimal pro Woche Fußball." },
      { de: "Was hast du letztes Wochenende gemacht?", sq: "Çfarë bëre fundjavën e kaluar?", model: "Letztes Wochenende habe ich meine Familie besucht." },
      { de: "Was machst du lieber: lesen oder Filme schauen?", sq: "Çfarë të pëlqen më shumë: të lexosh apo të shikosh filma?", model: "Ich schaue lieber Filme, weil das entspannend ist." },
    ],
  },
  {
    id: "shopping",
    title: "Einkaufen",
    titleSq: "Blerjet",
    level: "A1",
    descriptionSq: "Në dyqan: çmimi, madhësia, pagesa.",
    context: "Du bist Verkäufer/in in einem Kleidungsgeschäft. Die Person möchte eine Jacke kaufen.",
    questions: [
      { de: "Guten Tag! Kann ich Ihnen helfen?", sq: "Mirëdita! A mund t'Ju ndihmoj?", model: "Ja, bitte. Ich suche eine Jacke." },
      { de: "Welche Größe brauchen Sie?", sq: "Çfarë mase Ju duhet?", model: "Ich brauche Größe M." },
      { de: "Welche Farbe möchten Sie?", sq: "Çfarë ngjyre dëshironi?", model: "Ich möchte eine schwarze Jacke." },
      { de: "Möchten Sie bar oder mit Karte bezahlen?", sq: "Doni të paguani me para në dorë apo me kartë?", model: "Ich bezahle mit Karte." },
    ],
  },
  {
    id: "food",
    title: "Essen bestellen",
    titleSq: "Porositja e ushqimit",
    level: "A1",
    descriptionSq: "Në restorant: porosit, pyet, paguaj.",
    context: "Du bist Kellner/in in einem Restaurant.",
    questions: [
      { de: "Guten Abend! Was möchten Sie trinken?", sq: "Mirëmbrëma! Çfarë dëshironi të pini?", model: "Ich hätte gern ein Wasser, bitte." },
      { de: "Und was möchten Sie essen?", sq: "Dhe çfarë dëshironi të hani?", model: "Ich nehme die Pizza Margherita." },
      { de: "Möchten Sie noch einen Salat dazu?", sq: "A dëshironi edhe një sallatë?", model: "Nein, danke. Das ist alles." },
      { de: "Hat es Ihnen geschmeckt?", sq: "A Ju shijoi?", model: "Ja, sehr gut! Die Rechnung, bitte." },
    ],
  },
  {
    id: "travel",
    title: "Reisen",
    titleSq: "Udhëtimi",
    level: "A2",
    descriptionSq: "Në stacion, biletë, hotel, drejtime.",
    context: "Du arbeitest am Schalter am Bahnhof in München.",
    questions: [
      { de: "Guten Tag, wohin möchten Sie fahren?", sq: "Mirëdita, për ku doni të udhëtoni?", model: "Ich möchte nach Berlin fahren." },
      { de: "Wann möchten Sie fahren?", sq: "Kur doni të udhëtoni?", model: "Morgen früh, bitte." },
      { de: "Einfach oder hin und zurück?", sq: "Vetëm vajtje apo vajtje-ardhje?", model: "Hin und zurück, bitte." },
      { de: "Warum fahren Sie nach Berlin?", sq: "Pse udhëtoni për në Berlin?", model: "Ich fahre nach Berlin, weil ich dort ein Vorstellungsgespräch habe." },
    ],
  },
  {
    id: "appointment",
    title: "Termin vereinbaren",
    titleSq: "Caktimi i një takimi",
    level: "A2",
    descriptionSq: "Në telefon me mjekun ose me një zyrë.",
    context: "Du arbeitest an der Rezeption einer Arztpraxis. Die Person ruft an, um einen Termin zu vereinbaren.",
    questions: [
      { de: "Praxis Dr. Huber, guten Tag. Was kann ich für Sie tun?", sq: "Ordinanca Dr. Huber, mirëdita. Çfarë mund të bëj për Ju?", model: "Guten Tag, ich möchte einen Termin vereinbaren." },
      { de: "Was für Beschwerden haben Sie?", sq: "Çfarë shqetësimesh keni?", model: "Ich habe seit drei Tagen Kopfschmerzen." },
      { de: "Passt Ihnen Donnerstag um 10 Uhr?", sq: "A Ju përshtatet e enjte në orën 10?", model: "Donnerstag passt leider nicht. Geht auch Freitag?" },
      { de: "Freitag um 14 Uhr ist frei. Wie ist Ihr Name, bitte?", sq: "E premte në 14 është e lirë. Si quheni, ju lutem?", model: "Mein Name ist Arben Krasniqi. Freitag um 14 Uhr passt gut." },
    ],
  },
  {
    id: "colleagues",
    title: "Mit Kollegen sprechen",
    titleSq: "Bisedë me kolegët",
    level: "A2",
    descriptionSq: "Small talk, pushime, organizimi i punës.",
    context: "Du bist ein Kollege/eine Kollegin im Büro und sprichst in der Kaffeepause.",
    questions: [
      { de: "Na, wie war dein Wochenende?", sq: "Si ishte fundjava jote?", model: "Es war schön. Ich habe mich gut erholt." },
      { de: "Hast du schon Pläne für den Urlaub?", sq: "A ke plane për pushimet?", model: "Ja, ich fahre im August nach Albanien." },
      { de: "Kannst du morgen meine Schicht übernehmen?", sq: "A mund ta marrësh turnin tim nesër?", model: "Tut mir leid, morgen kann ich nicht, aber am Freitag habe ich Zeit." },
      { de: "Wie findest du das neue System?", sq: "Si të duket sistemi i ri?", model: "Ich finde es praktisch, aber ich muss noch viel lernen." },
    ],
  },
  {
    id: "customers",
    title: "Mit Kunden sprechen",
    titleSq: "Bisedë me klientët",
    level: "A2",
    descriptionSq: "Ti je punonjësi: përshëndet, pyet, sqaro.",
    context: "Du bist Kunde/Kundin in einem Geschäft und die Person ist Mitarbeiter/in. Stelle einfache Fragen zu Produkten und Öffnungszeiten.",
    questions: [
      { de: "Entschuldigung, arbeiten Sie hier?", sq: "Më falni, a punoni këtu?", model: "Ja, wie kann ich Ihnen helfen?" },
      { de: "Ich suche ein Ladegerät für mein Handy.", sq: "Po kërkoj një karikues për celularin.", model: "Welches Handy haben Sie? Die Ladegeräte sind dort hinten." },
      { de: "Wie lange haben Sie heute geöffnet?", sq: "Deri kur keni hapur sot?", model: "Wir haben heute bis 20 Uhr geöffnet." },
      { de: "Kann ich das Ladegerät umtauschen, wenn es nicht passt?", sq: "A mund ta ndërroj karikuesin nëse nuk përshtatet?", model: "Ja, Sie können es innerhalb von 14 Tagen mit dem Kassenbon umtauschen." },
    ],
  },
  {
    id: "support-call",
    title: "Den Kundenservice anrufen",
    titleSq: "Telefonata te shërbimi i klientit",
    level: "A2",
    descriptionSq: "Ti je klienti: shpjego problemin tënd.",
    context: "Du bist Mitarbeiter/in im Kundenservice eines Online-Shops. Die Person ruft als Kunde an. Frage nach dem Problem, der Bestellnummer und biete Hilfe an.",
    questions: [
      { de: "Kundenservice, guten Tag. Wie kann ich Ihnen helfen?", sq: "Shërbimi i klientit, mirëdita. Si mund t'Ju ndihmoj?", model: "Guten Tag, ich habe ein Problem mit meiner Bestellung." },
      { de: "Was genau ist das Problem?", sq: "Cili është saktësisht problemi?", model: "Ich habe eine falsche Größe bekommen." },
      { de: "Haben Sie Ihre Bestellnummer?", sq: "A e keni numrin e porosisë?", model: "Ja, die Bestellnummer ist 30455." },
      { de: "Möchten Sie einen Umtausch oder Ihr Geld zurück?", sq: "Doni një ndërrim apo paratë mbrapsht?", model: "Ich möchte bitte einen Umtausch in Größe L." },
    ],
  },
  {
    id: "complaint",
    title: "Sich beschweren",
    titleSq: "Ankesa",
    level: "B1",
    descriptionSq: "Shpreh pakënaqësi me mirësjellje dhe kërko zgjidhje.",
    context: "Du bist Hotelrezeptionist/in. Die Person beschwert sich über ihr Zimmer (laut, schmutzig). Reagiere professionell und frage nach Details.",
    questions: [
      { de: "Guten Abend, was kann ich für Sie tun?", sq: "Mirëmbrëma, çfarë mund të bëj për Ju?", model: "Guten Abend, ich möchte mich über mein Zimmer beschweren." },
      { de: "Oh, das tut mir leid. Was ist denn das Problem?", sq: "Oh, më vjen keq. Cili është problemi?", model: "Das Zimmer ist sehr laut, weil es direkt an der Straße liegt." },
      { de: "Seit wann haben Sie das Problem?", sq: "Që kur e keni problemin?", model: "Seit gestern Abend. Ich konnte nicht schlafen." },
      { de: "Was können wir für Sie tun?", sq: "Çfarë mund të bëjmë për Ju?", model: "Ich hätte gern ein ruhigeres Zimmer, wenn das möglich ist." },
    ],
  },
];

export const SCENARIO_BY_ID = Object.fromEntries(SPEAKING_SCENARIOS.map((s) => [s.id, s]));
