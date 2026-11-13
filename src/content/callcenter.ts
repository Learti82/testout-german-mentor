import type { CEFR } from "@/lib/types";

export interface Phrase {
  id: string;
  de: string;
  sq: string;
  use: "opening" | "clarify" | "hold" | "empathy" | "solution" | "closing" | "difficult";
  level: CEFR;
}

export const PHRASES: Phrase[] = [
  { id: "p01", de: "Guten Tag, Sie sprechen mit Arben Krasniqi. Wie kann ich Ihnen helfen?", sq: "Mirëdita, po flisni me Arben Krasniqin. Si mund t'Ju ndihmoj?", use: "opening", level: "A2" },
  { id: "p02", de: "Wie kann ich Ihnen helfen?", sq: "Si mund t'Ju ndihmoj?", use: "opening", level: "A1" },
  { id: "p03", de: "Darf ich bitte Ihren Namen erfahren?", sq: "A mund ta mësoj emrin Tuaj, ju lutem?", use: "opening", level: "A2" },
  { id: "p04", de: "Wie lautet Ihre Kundennummer?", sq: "Cili është numri Juaj i klientit?", use: "clarify", level: "A2" },
  { id: "p05", de: "Haben Sie Ihre Bestellnummer zur Hand?", sq: "A e keni numrin e porosisë pranë?", use: "clarify", level: "B1" },
  { id: "p06", de: "Könnten Sie das bitte wiederholen?", sq: "A mund ta përsërisnit, ju lutem?", use: "clarify", level: "A2" },
  { id: "p07", de: "Könnten Sie das bitte buchstabieren?", sq: "A mund ta gërmëzonit, ju lutem?", use: "clarify", level: "A2" },
  { id: "p08", de: "Habe ich Sie richtig verstanden, dass ...?", sq: "A Ju kuptova saktë që ...?", use: "clarify", level: "B1" },
  { id: "p09", de: "Einen Moment bitte.", sq: "Një moment, ju lutem.", use: "hold", level: "A1" },
  { id: "p10", de: "Ich werde das für Sie überprüfen.", sq: "Do ta kontrolloj këtë për Ju.", use: "hold", level: "A2" },
  { id: "p11", de: "Darf ich Sie kurz in die Warteschleife legen?", sq: "A mund t'Ju vendos shkurt në pritje?", use: "hold", level: "B1" },
  { id: "p12", de: "Vielen Dank für Ihre Geduld.", sq: "Faleminderit për durimin Tuaj.", use: "hold", level: "A2" },
  { id: "p13", de: "Es tut mir leid für die Unannehmlichkeiten.", sq: "Më vjen keq për shqetësimin.", use: "empathy", level: "A2" },
  { id: "p14", de: "Ich verstehe, dass das ärgerlich ist.", sq: "E kuptoj që kjo është e bezdisshme.", use: "empathy", level: "B1" },
  { id: "p15", de: "Ich kann Ihren Ärger gut nachvollziehen.", sq: "E kuptoj shumë mirë zemërimin Tuaj.", use: "empathy", level: "B2" },
  { id: "p16", de: "Wir senden Ihnen kostenlos einen Ersatz.", sq: "Ju dërgojmë falas një zëvendësim.", use: "solution", level: "A2" },
  { id: "p17", de: "Ich veranlasse die Rückerstattung.", sq: "Po e nis rimbursimin.", use: "solution", level: "B1" },
  { id: "p18", de: "Die Rückerstattung dauert drei bis fünf Werktage.", sq: "Rimbursimi zgjat tre deri në pesë ditë pune.", use: "solution", level: "B1" },
  { id: "p19", de: "Ich habe Ihre Bestellung storniert.", sq: "E kam anuluar porosinë Tuaj.", use: "solution", level: "A2" },
  { id: "p20", de: "Sie bekommen eine Bestätigung per E-Mail.", sq: "Do të merrni një konfirmim me email.", use: "solution", level: "A2" },
  { id: "p21", de: "Ich leite Ihre Anfrage an die Fachabteilung weiter.", sq: "Po ia përcjell kërkesën Tuaj departamentit përkatës.", use: "solution", level: "B1" },
  { id: "p22", de: "Kann ich sonst noch etwas für Sie tun?", sq: "A mund të bëj diçka tjetër për Ju?", use: "closing", level: "A2" },
  { id: "p23", de: "Vielen Dank für Ihren Anruf. Auf Wiederhören!", sq: "Faleminderit për telefonatën. Mirupafshim! (në telefon)", use: "closing", level: "A2" },
  { id: "p24", de: "Ich wünsche Ihnen noch einen schönen Tag.", sq: "Ju uroj një ditë të bukur.", use: "closing", level: "A2" },
  { id: "p25", de: "Ich kann leider nicht mehr tun, aber ich kann Ihnen eine Alternative anbieten.", sq: "Fatkeqësisht nuk mund të bëj më shumë, por mund t'Ju ofroj një alternativë.", use: "difficult", level: "B2" },
  { id: "p26", de: "Bitte lassen Sie mich kurz erklären, was passiert ist.", sq: "Ju lutem më lejoni t'Ju shpjegoj shkurt çfarë ndodhi.", use: "difficult", level: "B1" },
  { id: "p27", de: "Ich möchte Ihnen gern helfen, aber dafür brauche ich ein paar Informationen.", sq: "Dua t'Ju ndihmoj, por për këtë më duhen disa informacione.", use: "difficult", level: "B1" },
  { id: "p28", de: "Die Verbindung ist leider schlecht. Können Sie mich hören?", sq: "Lidhja fatkeqësisht është e dobët. A më dëgjoni?", use: "clarify", level: "A2" },
];

export const PHRASE_USES: Record<Phrase["use"], { de: string; sq: string }> = {
  opening: { de: "Begrüßung", sq: "Përshëndetja" },
  clarify: { de: "Nachfragen", sq: "Sqarimi" },
  hold: { de: "Warten lassen", sq: "Pritja" },
  empathy: { de: "Empathie", sq: "Empatia" },
  solution: { de: "Lösung", sq: "Zgjidhja" },
  closing: { de: "Abschluss", sq: "Mbyllja" },
  difficult: { de: "Schwierige Situationen", sq: "Situata të vështira" },
};

export interface CallScenario {
  id: string;
  title: string;
  titleSq: string;
  level: CEFR;
  situationSq: string;
  /** Instructions for the AI playing the customer (German). */
  persona: string;
  opening: string;
  openingSq: string;
  goals: { id: string; de: string; sq: string }[];
  phrases: string[];
  /** Offline scripted version */
  script: { customer: string; customerSq: string; expect: string[][]; model: string; hintSq: string }[];
}

export const CALL_SCENARIOS: CallScenario[] = [
  {
    id: "cc-not-received",
    title: "Bestellung nicht angekommen",
    titleSq: "Porosia nuk ka arritur",
    level: "A2",
    situationSq: "Klientja Frau Becker ka porositur një xhaketë para 10 ditësh. Pakoja nuk ka arritur.",
    persona: "Du bist Frau Becker, eine freundliche, aber etwas ungeduldige Kundin. Du hast vor 10 Tagen eine Jacke bestellt (Bestellnummer 48213). Das Paket ist nicht angekommen. Sprich einfaches Deutsch (A2), kurze Sätze.",
    opening: "Guten Tag, ich habe vor zehn Tagen eine Jacke bestellt, aber das Paket ist noch nicht angekommen.",
    openingSq: "Mirëdita, kam porositur një xhaketë para dhjetë ditësh, por pakoja nuk ka arritur ende.",
    goals: [
      { id: "g1", de: "Begrüßen und Hilfe anbieten", sq: "Përshëndet dhe ofro ndihmë" },
      { id: "g2", de: "Nach der Bestellnummer fragen", sq: "Pyet për numrin e porosisë" },
      { id: "g3", de: "Sich entschuldigen", sq: "Kërko falje" },
      { id: "g4", de: "Eine Lösung anbieten", sq: "Ofro një zgjidhje" },
      { id: "g5", de: "Höflich verabschieden", sq: "Përshëndetu me mirësjellje" },
    ],
    phrases: ["p04", "p05", "p09", "p10", "p13", "p20", "p22"],
    script: [
      { customer: "Guten Tag, ich habe vor zehn Tagen eine Jacke bestellt, aber das Paket ist noch nicht angekommen.", customerSq: "Mirëdita, kam porositur një xhaketë para dhjetë ditësh, por pakoja nuk ka arritur ende.", expect: [["leid", "entschuldig"], ["bestellnummer", "nummer"]], model: "Es tut mir leid. Wie lautet Ihre Bestellnummer, bitte?", hintSq: "Kërko falje dhe pyet për numrin e porosisë." },
      { customer: "Die Nummer ist 48213.", customerSq: "Numri është 48213.", expect: [["moment", "überprüfe", "prüfe", "schaue"]], model: "Vielen Dank. Einen Moment bitte, ich überprüfe das für Sie.", hintSq: "Falënderoje dhe thuaj që do ta kontrollosh." },
      { customer: "Und? Wo ist mein Paket?", customerSq: "Dhe? Ku është pakoja ime?", expect: [["paket", "sendung", "lieferung"], ["morgen", "tage", "neu", "ersatz", "senden"]], model: "Das Paket ist leider verloren gegangen. Wir senden Ihnen heute kostenlos eine neue Jacke.", hintSq: "Shpjego situatën dhe ofro zgjidhje (dërgesë e re)." },
      { customer: "Okay, gut. Wann kommt die neue Jacke?", customerSq: "Mirë. Kur vjen xhaketa e re?", expect: [["tag", "morgen", "woche", "montag", "dienstag", "mittwoch", "donnerstag", "freitag"]], model: "Die Jacke kommt in zwei bis drei Tagen. Sie bekommen eine Bestätigung per E-Mail.", hintSq: "Jep një afat (wann?) dhe përmend konfirmimin me email." },
      { customer: "Super, danke schön.", customerSq: "Shkëlqyeshëm, faleminderit.", expect: [["noch etwas", "sonst", "schönen tag", "wiederhören", "dank"]], model: "Gern geschehen. Kann ich sonst noch etwas für Sie tun? Ich wünsche Ihnen einen schönen Tag.", hintSq: "Pyet nëse ka diçka tjetër dhe përshëndetu." },
    ],
  },
  {
    id: "cc-refund",
    title: "Rückerstattung gewünscht",
    titleSq: "Klienti do rimbursim",
    level: "A2",
    situationSq: "Klienti Herr Yilmaz ka kthyer një palë këpucë dhe pyet kur do t'i kthehen paratë.",
    persona: "Du bist Herr Yilmaz. Du hast vor einer Woche Schuhe zurückgeschickt und wartest auf dein Geld (59,90 €). Du bist ruhig, aber möchtest ein klares Datum. Einfaches Deutsch (A2).",
    opening: "Hallo, ich habe meine Schuhe zurückgeschickt. Wann bekomme ich mein Geld zurück?",
    openingSq: "Përshëndetje, i kam kthyer këpucët. Kur i marr paratë mbrapsht?",
    goals: [
      { id: "g1", de: "Kundendaten erfragen", sq: "Pyet për të dhënat e klientit" },
      { id: "g2", de: "Status prüfen", sq: "Kontrollo statusin" },
      { id: "g3", de: "Zeitraum der Rückerstattung nennen", sq: "Trego afatin e rimbursimit" },
      { id: "g4", de: "Höflich abschließen", sq: "Mbyll me mirësjellje" },
    ],
    phrases: ["p03", "p04", "p10", "p17", "p18", "p22", "p23"],
    script: [
      { customer: "Hallo, ich habe meine Schuhe zurückgeschickt. Wann bekomme ich mein Geld zurück?", customerSq: "Përshëndetje, i kam kthyer këpucët. Kur i marr paratë mbrapsht?", expect: [["name", "kundennummer", "bestellnummer", "nummer"]], model: "Gern helfe ich Ihnen. Wie lautet Ihre Kundennummer, bitte?", hintSq: "Pyet për numrin e klientit ose të porosisë." },
      { customer: "Meine Kundennummer ist 7731.", customerSq: "Numri im i klientit është 7731.", expect: [["moment", "überprüfe", "prüfe"]], model: "Danke. Einen Moment bitte, ich überprüfe das.", hintSq: "Kërko një moment për të kontrolluar." },
      { customer: "Ist das Paket bei Ihnen angekommen?", customerSq: "A ka arritur pakoja te ju?", expect: [["angekommen", "erhalten", "bekommen"], ["rückerstattung", "geld", "tage", "werktage"]], model: "Ja, das Paket ist angekommen. Die Rückerstattung dauert drei bis fünf Werktage.", hintSq: "Konfirmo që pakoja ka arritur dhe trego sa zgjat rimbursimi." },
      { customer: "Gut. Bekomme ich eine Bestätigung?", customerSq: "Mirë. A marr një konfirmim?", expect: [["e-mail", "email", "bestätigung"]], model: "Ja, Sie bekommen eine Bestätigung per E-Mail.", hintSq: "Thuaj që do të marrë konfirmim me email." },
    ],
  },
  {
    id: "cc-damaged",
    title: "Beschädigtes Produkt",
    titleSq: "Produkt i dëmtuar",
    level: "A2",
    situationSq: "Klientja ka marrë një makinë kafeje (Kaffeemaschine) të dëmtuar — xhami është thyer.",
    persona: "Du bist Frau Schmidt. Deine neue Kaffeemaschine ist kaputt angekommen – das Glas ist gebrochen. Du bist enttäuscht. Sprich A2-Deutsch.",
    opening: "Guten Tag. Ich habe gestern eine Kaffeemaschine bekommen, aber sie ist beschädigt. Das Glas ist kaputt.",
    openingSq: "Mirëdita. Dje mora një makinë kafeje, por është e dëmtuar. Xhami është i thyer.",
    goals: [
      { id: "g1", de: "Empathie zeigen", sq: "Trego empati" },
      { id: "g2", de: "Problem genau erfragen", sq: "Pyet saktësisht për problemin" },
      { id: "g3", de: "Ersatz oder Rückerstattung anbieten", sq: "Ofro zëvendësim ose rimbursim" },
      { id: "g4", de: "Nächste Schritte erklären", sq: "Shpjego hapat e ardhshëm" },
    ],
    phrases: ["p13", "p14", "p16", "p17", "p20"],
    script: [
      { customer: "Guten Tag. Ich habe gestern eine Kaffeemaschine bekommen, aber sie ist beschädigt.", customerSq: "Mirëdita. Dje mora një makinë kafeje, por është e dëmtuar.", expect: [["leid", "entschuldig"]], model: "Oh, das tut mir sehr leid. Was genau ist beschädigt?", hintSq: "Shpreh keqardhje dhe pyet çfarë saktësisht është e dëmtuar." },
      { customer: "Das Glas ist kaputt. Ich kann die Maschine nicht benutzen.", customerSq: "Xhami është i thyer. Nuk mund ta përdor makinën.", expect: [["ersatz", "neue", "rückerstattung", "geld"]], model: "Ich verstehe. Möchten Sie einen Ersatz oder eine Rückerstattung?", hintSq: "Ofro zëvendësim ose rimbursim." },
      { customer: "Einen Ersatz, bitte.", customerSq: "Një zëvendësim, ju lutem.", expect: [["senden", "schicken", "bekommen"], ["kostenlos", "tage", "morgen", "woche"]], model: "Sehr gern. Wir senden Ihnen kostenlos eine neue Maschine. Sie kommt in drei Tagen.", hintSq: "Konfirmo zëvendësimin falas dhe jep afatin." },
      { customer: "Und was mache ich mit der kaputten Maschine?", customerSq: "Po me makinën e prishur çfarë bëj?", expect: [["zurück", "etikett", "abholen", "e-mail"]], model: "Sie bekommen ein Rücksendeetikett per E-Mail. Bitte schicken Sie die Maschine damit zurück.", hintSq: "Shpjego si ta kthejë produktin e dëmtuar." },
    ],
  },
  {
    id: "cc-cancel",
    title: "Bestellung stornieren",
    titleSq: "Anulimi i një porosie",
    level: "A2",
    situationSq: "Klienti dëshiron të anulojë një porosi që e bëri sot në mëngjes.",
    persona: "Du bist Herr Wagner. Du hast heute Morgen aus Versehen zwei Handys bestellt statt einem. Du möchtest eins stornieren. A2-Deutsch, freundlich.",
    opening: "Guten Morgen. Ich habe aus Versehen zwei Handys bestellt. Kann ich ein Handy stornieren?",
    openingSq: "Mirëmëngjes. Gabimisht porosita dy celularë. A mund ta anuloj njërin?",
    goals: [
      { id: "g1", de: "Bestellung identifizieren", sq: "Identifiko porosinë" },
      { id: "g2", de: "Stornierung bestätigen", sq: "Konfirmo anulimin" },
      { id: "g3", de: "Über die Rückzahlung informieren", sq: "Informo për kthimin e parave" },
    ],
    phrases: ["p05", "p09", "p19", "p20", "p22"],
    script: [
      { customer: "Guten Morgen. Ich habe aus Versehen zwei Handys bestellt. Kann ich ein Handy stornieren?", customerSq: "Mirëmëngjes. Gabimisht porosita dy celularë. A mund ta anuloj njërin?", expect: [["ja", "natürlich", "gern", "kein problem"], ["bestellnummer", "nummer"]], model: "Ja, natürlich. Wie lautet Ihre Bestellnummer?", hintSq: "Thuaj po dhe pyet për numrin e porosisë." },
      { customer: "Die Nummer ist 55120.", customerSq: "Numri është 55120.", expect: [["storniert", "storniere"]], model: "Danke. Ich habe ein Handy storniert. Das andere Handy wird heute versendet.", hintSq: "Konfirmo anulimin." },
      { customer: "Und mein Geld?", customerSq: "Po paratë e mia?", expect: [["zurück", "rückerstattung", "erstattet"], ["tage", "werktage", "woche"]], model: "Sie bekommen das Geld in drei bis fünf Werktagen zurück.", hintSq: "Shpjego kur kthehen paratë." },
    ],
  },
  {
    id: "cc-billing",
    title: "Problem mit der Rechnung",
    titleSq: "Problem me faturën",
    level: "B1",
    situationSq: "Klientja thotë se në faturë i është llogaritur dy herë i njëjti produkt.",
    persona: "Du bist Frau Hoxha (deutsch-albanisch, spricht nur Deutsch am Telefon). Auf deiner Rechnung (Rechnungsnummer R-2291) steht ein Produkt doppelt, du hast 34,99 € zu viel bezahlt. Du bist sachlich, willst eine Gutschrift. B1-Deutsch.",
    opening: "Guten Tag, auf meiner Rechnung ist ein Fehler. Ein Artikel steht doppelt drauf und ich habe zu viel bezahlt.",
    openingSq: "Mirëdita, në faturën time ka një gabim. Një artikull është dy herë dhe kam paguar më shumë.",
    goals: [
      { id: "g1", de: "Rechnungsnummer erfragen", sq: "Pyet për numrin e faturës" },
      { id: "g2", de: "Problem zusammenfassen (Habe ich richtig verstanden ...?)", sq: "Përmblidh problemin" },
      { id: "g3", de: "Gutschrift/Erstattung anbieten", sq: "Ofro kreditim/rimbursim" },
      { id: "g4", de: "Professionell abschließen", sq: "Mbyll profesionalisht" },
    ],
    phrases: ["p04", "p08", "p10", "p12", "p17", "p18"],
    script: [
      { customer: "Guten Tag, auf meiner Rechnung ist ein Fehler. Ein Artikel steht doppelt drauf.", customerSq: "Mirëdita, në faturën time ka një gabim. Një artikull është dy herë.", expect: [["leid", "entschuldig", "verstehe"], ["rechnungsnummer", "nummer"]], model: "Das tut mir leid. Könnten Sie mir bitte die Rechnungsnummer nennen?", hintSq: "Kërko falje dhe pyet për numrin e faturës." },
      { customer: "Ja, R-2291.", customerSq: "Po, R-2291.", expect: [["verstanden", "also", "doppelt"]], model: "Vielen Dank. Habe ich Sie richtig verstanden, dass der Artikel doppelt berechnet wurde?", hintSq: "Përmblidh problemin për ta konfirmuar." },
      { customer: "Genau. Ich habe 34,99 Euro zu viel bezahlt.", customerSq: "Pikërisht. Kam paguar 34,99 euro më shumë.", expect: [["gutschrift", "erstatt", "zurück"]], model: "Ich sehe den Fehler. Ich erstelle Ihnen eine Gutschrift über 34,99 Euro.", hintSq: "Ofro kreditim ose rimbursim." },
      { customer: "Wann sehe ich das Geld auf meinem Konto?", customerSq: "Kur i shoh paratë në llogarinë time?", expect: [["tage", "werktage", "woche"]], model: "Das Geld ist in drei bis fünf Werktagen auf Ihrem Konto. Kann ich sonst noch etwas für Sie tun?", hintSq: "Jep afatin dhe pyet nëse ka diçka tjetër." },
    ],
  },
  {
    id: "cc-product-info",
    title: "Produktinformation",
    titleSq: "Informacion për produktin",
    level: "A2",
    situationSq: "Një klient pyet për një laptop: çmimin, ngjyrat dhe kohën e dërgesës.",
    persona: "Du bist Herr Neumann und interessierst dich für den Laptop 'ProBook 14'. Du fragst nach Preis (899 €), Farben (Silber, Schwarz) und Lieferzeit (2 Tage). Stelle eine Frage nach der anderen. A2-Deutsch.",
    opening: "Hallo, ich interessiere mich für den Laptop ProBook 14. Wie viel kostet er?",
    openingSq: "Përshëndetje, më intereson laptopi ProBook 14. Sa kushton?",
    goals: [
      { id: "g1", de: "Preis nennen", sq: "Trego çmimin" },
      { id: "g2", de: "Fragen klar beantworten", sq: "Përgjigju qartë pyetjeve" },
      { id: "g3", de: "Bestellung anbieten", sq: "Ofro porosinë" },
    ],
    phrases: ["p02", "p09", "p22"],
    script: [
      { customer: "Hallo, ich interessiere mich für den Laptop ProBook 14. Wie viel kostet er?", customerSq: "Përshëndetje, më intereson laptopi ProBook 14. Sa kushton?", expect: [["euro", "€", "899", "kostet"]], model: "Der ProBook 14 kostet 899 Euro.", hintSq: "Trego çmimin: 899 euro." },
      { customer: "Welche Farben gibt es?", customerSq: "Cilat ngjyra ka?", expect: [["silber", "schwarz"]], model: "Es gibt ihn in Silber und Schwarz.", hintSq: "Ngjyrat: argjend (Silber) dhe e zezë (Schwarz)." },
      { customer: "Und wie lange dauert die Lieferung?", customerSq: "Dhe sa zgjat dërgesa?", expect: [["tag", "tage"]], model: "Die Lieferung dauert zwei Tage. Möchten Sie den Laptop bestellen?", hintSq: "2 ditë; pastaj ofro porosinë." },
    ],
  },
  {
    id: "cc-angry",
    title: "Verärgerter Kunde",
    titleSq: "Klient i zemëruar",
    level: "B1",
    situationSq: "Klienti telefonon për herë të tretë sepse interneti nuk funksionon. Është shumë i nervozuar.",
    persona: "Du bist Herr Lehmann. Dein Internet funktioniert seit fünf Tagen nicht. Du rufst zum dritten Mal an und bist sehr verärgert. Du unterbrichst manchmal, wirst aber ruhiger, wenn der Mitarbeiter Empathie zeigt und eine konkrete Lösung anbietet (Techniker-Termin). B1-Deutsch.",
    opening: "Das ist jetzt das dritte Mal, dass ich anrufe! Mein Internet funktioniert seit fünf Tagen nicht. Das ist eine Katastrophe!",
    openingSq: "Kjo është hera e tretë që telefonoj! Interneti im nuk funksionon prej pesë ditësh. Kjo është katastrofë!",
    goals: [
      { id: "g1", de: "Ruhig bleiben und Empathie zeigen", sq: "Qëndro i qetë dhe trego empati" },
      { id: "g2", de: "Sich entschuldigen", sq: "Kërko falje" },
      { id: "g3", de: "Konkrete Lösung mit Termin anbieten", sq: "Ofro zgjidhje konkrete me termin" },
      { id: "g4", de: "Vertrauen wiederherstellen", sq: "Rikthe besimin" },
    ],
    phrases: ["p14", "p15", "p13", "p26", "p27", "p25"],
    script: [
      { customer: "Das ist jetzt das dritte Mal, dass ich anrufe! Mein Internet funktioniert seit fünf Tagen nicht!", customerSq: "Kjo është hera e tretë që telefonoj! Interneti nuk funksionon prej pesë ditësh!", expect: [["verstehe", "nachvollziehen", "ärgerlich"], ["leid", "entschuldig"]], model: "Ich verstehe, dass das sehr ärgerlich ist. Es tut mir wirklich leid.", hintSq: "Trego empati (Ich verstehe...) dhe kërko falje." },
      { customer: "Entschuldigungen helfen mir nicht! Ich brauche Internet für meine Arbeit!", customerSq: "Faljet nuk më ndihmojnë! Më duhet interneti për punë!", expect: [["techniker", "termin"]], model: "Sie haben recht. Ich schicke Ihnen einen Techniker. Ich habe morgen um 9 Uhr einen Termin frei.", hintSq: "Ofro zgjidhje konkrete: teknik + orar." },
      { customer: "Morgen um 9? Und wenn der Techniker wieder nicht kommt?", customerSq: "Nesër në 9? Po nëse tekniku nuk vjen përsëri?", expect: [["persönlich", "anrufen", "rufe", "garant", "bestätig"]], model: "Ich kümmere mich persönlich darum und rufe Sie morgen um 10 Uhr an, um zu prüfen, ob alles funktioniert.", hintSq: "Jep garanci personale: do të telefonosh për të kontrolluar." },
      { customer: "Na gut. Das klingt besser.", customerSq: "Mirë pra. Kjo tingëllon më mirë.", expect: [["dank", "geduld", "verständnis"]], model: "Vielen Dank für Ihre Geduld und Ihr Verständnis. Kann ich sonst noch etwas für Sie tun?", hintSq: "Falënderoje për durimin." },
    ],
  },
  {
    id: "cc-tech",
    title: "Technischer Support",
    titleSq: "Mbështetje teknike",
    level: "B1",
    situationSq: "Klientja nuk mund të hyjë në llogarinë e saj online (fjalëkalimi).",
    persona: "Du bist Frau Klein, 65 Jahre alt, nicht sehr technisch. Du kannst dich nicht in dein Kundenkonto einloggen. Du brauchst einfache Schritt-für-Schritt-Erklärungen und fragst oft nach. B1-Deutsch.",
    opening: "Guten Tag, ich komme nicht in mein Kundenkonto. Immer steht da 'Passwort falsch'.",
    openingSq: "Mirëdita, nuk mund të hyj në llogarinë time. Gjithmonë shkruan 'Fjalëkalimi i gabuar'.",
    goals: [
      { id: "g1", de: "Problem verstehen", sq: "Kupto problemin" },
      { id: "g2", de: "Schritt für Schritt erklären (zuerst, dann, danach)", sq: "Shpjego hap pas hapi (zuerst, dann, danach)" },
      { id: "g3", de: "Prüfen, ob es funktioniert", sq: "Kontrollo nëse funksionon" },
    ],
    phrases: ["p06", "p08", "p10", "p22"],
    script: [
      { customer: "Guten Tag, ich komme nicht in mein Kundenkonto. Immer steht da 'Passwort falsch'.", customerSq: "Mirëdita, nuk mund të hyj në llogarinë time. Gjithmonë shkruan 'Fjalëkalimi i gabuar'.", expect: [["passwort"], ["zurücksetzen", "neues", "vergessen"]], model: "Kein Problem, ich helfe Ihnen. Wir setzen Ihr Passwort zurück. Klicken Sie bitte zuerst auf 'Passwort vergessen'.", hintSq: "Shpjego hapin e parë: 'Passwort vergessen'." },
      { customer: "Ah, ich sehe es. Und dann?", customerSq: "Ah, e shoh. Dhe pastaj?", expect: [["e-mail", "email", "adresse"]], model: "Dann geben Sie Ihre E-Mail-Adresse ein. Sie bekommen eine E-Mail mit einem Link.", hintSq: "Hapi i dytë: shkruaj email-in; vjen një link." },
      { customer: "Ja, die E-Mail ist da.", customerSq: "Po, email-i ka ardhur.", expect: [["link", "klicken", "neues passwort"]], model: "Sehr gut. Klicken Sie auf den Link und wählen Sie ein neues Passwort. Funktioniert es jetzt?", hintSq: "Hapi i fundit + pyet nëse funksionon." },
    ],
  },
];

export const CALL_SCENARIO_BY_ID = Object.fromEntries(CALL_SCENARIOS.map((s) => [s.id, s]));
