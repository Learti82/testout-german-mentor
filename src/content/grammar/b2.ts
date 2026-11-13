import { builders } from "../exercise-builders";
import type { GrammarTopic } from "./types";

const as = builders("b2-advanced-sentences", "B2");
const cc = builders("b2-complex-connectors", "B2");
const fc = builders("b2-formal", "B2");
const pv = builders("b2-professional", "B2", "vocabulary");
const op = builders("b2-opinion", "B2", "speaking");

export const B2_TOPICS: GrammarTopic[] = [
  {
    id: "b2-advanced-sentences",
    level: "B2",
    title: "Komplexe Satzstrukturen",
    titleSq: "Ndërtimi i avancuar i fjalive",
    summarySq: "zu + Infinitiv, um ... zu, ohne ... zu, statt ... zu, dhe fjali me shumë pjesë.",
    explanationSq: [
      "Në B2 fjalitë bëhen më të gjata dhe më të sakta. Struktura të rëndësishme: um ... zu (për të), ohne ... zu (pa), statt ... zu (në vend që).",
      "zu + Infinitiv: Es ist wichtig, freundlich zu bleiben. Ich versuche, das Problem zu lösen.",
      "Me foljet e ndashme 'zu' futet në mes: anzurufen, zurückzurufen.",
      "Një fjali mund të ketë fjalinë kryesore + fjali të varur + fjali me zu: Ich rufe an, weil ich vorhabe, meinen Vertrag zu kündigen.",
    ],
    rule: ["um/ohne/statt + ... + zu + Infinitiv (Ende)", "trennbar: an-zu-rufen", "Subjekt i njëjtë → um ... zu; subjekt tjetër → damit"],
    examples: [
      { de: "Ich rufe an, um meine Bestellung zu stornieren.", sq: "Telefonoj për ta anuluar porosinë time." },
      { de: "Er hat das Paket zurückgeschickt, ohne den Kundenservice zu informieren.", sq: "E ktheu pakon pa e informuar shërbimin e klientit." },
      { de: "Es ist nicht möglich, die Rechnung nachträglich zu ändern.", sq: "Nuk është e mundur që fatura të ndryshohet më vonë." },
      { de: "Ich sende Ihnen den Link, damit Sie das Formular ausfüllen können.", sq: "Ju dërgoj linkun, që të mund ta plotësoni formularin." },
    ],
    commonMistakes: [
      { wrong: "Ich rufe an, um zu stornieren meine Bestellung.", right: "Ich rufe an, um meine Bestellung zu stornieren.", whySq: "zu + paskajore shkon në fund." },
      { wrong: "Ich versuche zu anrufen.", right: "Ich versuche anzurufen.", whySq: "Foljet e ndashme: zu futet në mes." },
      { wrong: "Ich sende den Link, um Sie das ausfüllen.", right: "Ich sende den Link, damit Sie das ausfüllen.", whySq: "Kryefjalë të ndryshme → damit (jo um ... zu)." },
    ],
    exercises: [
      as.ord("e1", "Ich rufe an, um einen Termin zu vereinbaren.", "um ... zu + paskajore në fund."),
      as.fill("e2", "Ich habe vergessen, Sie ___. (zurückrufen)", ["zurückzurufen"], "zurück-zu-rufen."),
      as.mc("e3", "Ich erkläre es noch einmal, ___ Sie es verstehen.", ["um", "damit", "ohne"], 1, "Subjekte të ndryshme → damit."),
      as.tf("e4", "Er geht. Er sagt nichts. (ohne ... zu)", ["Er geht, ohne etwas zu sagen."], "ohne etwas zu sagen.", "Bashkoji me 'ohne ... zu'."),
      as.tr("e5", "Është e rëndësishme të qëndrosh i qetë.", ["Es ist wichtig, ruhig zu bleiben."], "zu bleiben."),
    ],
    test: [
      as.tf("t1", "Ich lerne Deutsch. Ich will im Callcenter arbeiten. (um ... zu)", ["Ich lerne Deutsch, um im Callcenter zu arbeiten."], "um ... zu arbeiten.", "Bashkoji."),
      as.fix("t2", "Statt zu warten die Antwort, rufe ich an.", ["Statt auf die Antwort zu warten, rufe ich an."], "zu warten në fund (warten auf + Akk)."),
      as.fill("t3", "Es ist möglich, die Bestellung online ___. (stornieren)", ["zu stornieren"], "zu + paskajore."),
    ],
    recommendationSq: "Ushtro 'um ... zu' dhe 'damit' me qëllime nga puna: Ich rufe an, um ... zu ...",
    keywords: ["infinitiv", "um zu", "damit", "ohne zu", "zu infinitiv", "satzbau"],
  },
  {
    id: "b2-complex-connectors",
    level: "B2",
    title: "Komplexe Konnektoren",
    titleSq: "Lidhëza të avancuara",
    summarySq: "nicht nur ... sondern auch, sowohl ... als auch, je ... desto, falls, sodass, während.",
    explanationSq: [
      "Lidhëzat dyshe: nicht nur ... sondern auch (jo vetëm ... por edhe), sowohl ... als auch (si ... ashtu edhe), entweder ... oder (ose ... ose), weder ... noch (as ... as).",
      "je ... desto: Je mehr ich übe, desto besser spreche ich. (Sa më shumë ushtroj, aq më mirë flas.) Pas 'je' folja në fund, pas 'desto' folja menjëherë.",
      "falls (në rast se), sodass (kështu që), während (ndërsa / gjatë), sobald (sapo) — të gjitha me folje në fund.",
      "Këto lidhëza e bëjnë gjuhën më profesionale dhe më të qartë në argumentim.",
    ],
    rule: ["je + ... + Verb (Ende), desto + Komparativ + Verb + Subjekt", "falls / sodass / während / sobald → Verb am Ende"],
    examples: [
      { de: "Je früher Sie das Paket zurückschicken, desto schneller bekommen Sie Ihr Geld.", sq: "Sa më herët ta ktheni pakon, aq më shpejt i merrni paratë." },
      { de: "Sie können sowohl per E-Mail als auch telefonisch kündigen.", sq: "Mund të anuloni si me email ashtu edhe me telefon." },
      { de: "Falls Sie Fragen haben, stehe ich Ihnen gern zur Verfügung.", sq: "Në rast se keni pyetje, jam me kënaqësi në dispozicion." },
      { de: "Sobald die Zahlung eingeht, versenden wir die Ware.", sq: "Sapo të arrijë pagesa, e dërgojmë mallin." },
    ],
    commonMistakes: [
      { wrong: "Je mehr ich lerne, desto ich spreche besser.", right: "Je mehr ich lerne, desto besser spreche ich.", whySq: "desto + krahasore + folje + kryefjalë." },
      { wrong: "Falls Sie haben Fragen, ...", right: "Falls Sie Fragen haben, ...", whySq: "falls → folja në fund." },
      { wrong: "nicht nur ... aber auch", right: "nicht nur ... sondern auch", whySq: "Forma e saktë është 'sondern auch'." },
    ],
    exercises: [
      cc.ord("e1", "Je mehr ich übe, desto sicherer werde ich.", "je ... desto."),
      cc.mc("e2", "Das Gerät ist ___ teuer, sondern auch schwer.", ["nicht nur", "sowohl", "weder"], 0, "nicht nur ... sondern auch."),
      cc.fix("e3", "Sobald ich habe die Informationen, melde ich mich.", ["Sobald ich die Informationen habe, melde ich mich."], "sobald → habe në fund."),
      cc.tr("e4", "As email, as telefon — asgjë nuk funksionon.", ["Weder E-Mail noch Telefon funktioniert.", "Weder die E-Mail noch das Telefon funktioniert."], "weder ... noch."),
    ],
    test: [
      cc.tf("t1", "Sie zahlen früher. Sie bekommen die Ware schneller. (je ... desto)", ["Je früher Sie zahlen, desto schneller bekommen Sie die Ware."], "Je ... zahlen, desto ... bekommen Sie.", "Bashkoji."),
      cc.mc("t2", "___ Sie nicht zufrieden sind, können Sie das Produkt zurückgeben.", ["Falls", "Desto", "Sondern"], 0, "falls = në rast se."),
    ],
    recommendationSq: "Ndërto fjali me 'je ... desto' dhe 'falls' për situata pune.",
    keywords: ["je desto", "sowohl", "nicht nur", "falls", "sobald", "sodass", "während"],
  },
  {
    id: "b2-formal",
    level: "B2",
    title: "Formelle Kommunikation",
    titleSq: "Komunikimi formal",
    summarySq: "Email-e, telefonata dhe fraza zyrtare me 'Sie'.",
    explanationSq: [
      "Në komunikimin formal përdoret 'Sie', Konjunktiv II për mirësjellje dhe fraza fikse.",
      "Fillimi i email-it: Sehr geehrte Frau Weber, / Sehr geehrter Herr Kraus, / Sehr geehrte Damen und Herren,",
      "Mbyllja: Mit freundlichen Grüßen. Në telefon: Vielen Dank für Ihren Anruf. Ich wünsche Ihnen noch einen schönen Tag.",
      "Fraza të dobishme: Bezüglich Ihrer Anfrage ... (Lidhur me kërkesën Tuaj ...), Ich bedauere, Ihnen mitteilen zu müssen, dass ... (Më vjen keq t'Ju njoftoj që ...), Bitte haben Sie Verständnis, dass ...",
    ],
    rule: ["Sie + Konjunktiv II + feste Formeln", "Sehr geehrte/r ... · Mit freundlichen Grüßen"],
    examples: [
      { de: "Bezüglich Ihrer Anfrage vom 3. Mai kann ich Ihnen Folgendes mitteilen.", sq: "Lidhur me kërkesën Tuaj të 3 majit, mund t'Ju njoftoj sa vijon." },
      { de: "Bitte haben Sie Verständnis, dass die Bearbeitung einige Tage dauert.", sq: "Ju lutemi të keni mirëkuptim që përpunimi zgjat disa ditë." },
      { de: "Ich bedauere, Ihnen mitteilen zu müssen, dass der Artikel ausverkauft ist.", sq: "Më vjen keq t'Ju njoftoj që artikulli ka mbaruar." },
      { de: "Für Rückfragen stehe ich Ihnen gern zur Verfügung.", sq: "Për pyetje të mëtejshme jam me kënaqësi në dispozicion." },
    ],
    commonMistakes: [
      { wrong: "Hallo Herr Kraus, ...(email zyrtar)", right: "Sehr geehrter Herr Kraus, ...", whySq: "Në email zyrtar përdoret 'Sehr geehrter/geehrte'." },
      { wrong: "Liebe Grüße (klientit)", right: "Mit freundlichen Grüßen", whySq: "'Liebe Grüße' është joformale." },
      { wrong: "Was willst du?", right: "Wie kann ich Ihnen helfen?", whySq: "Me klientin: 'Sie' dhe fraza të sjellshme." },
    ],
    exercises: [
      fc.mc("e1", "Fillimi i email-it për Frau Lang:", ["Hallo Frau Lang,", "Sehr geehrte Frau Lang,", "Liebe Frau Lang,"], 1, "Formal: Sehr geehrte Frau ..."),
      fc.mc("e2", "Mbyllja formale:", ["Tschüss", "Liebe Grüße", "Mit freundlichen Grüßen"], 2, "Mit freundlichen Grüßen."),
      fc.tf("e3", "Ich kann nicht helfen. → formell und höflich", ["Leider kann ich Ihnen dabei nicht helfen.", "Leider kann ich Ihnen nicht helfen."], "Leider + Ihnen.", "Bëje formale dhe të sjellshme."),
      fc.tr("e4", "Faleminderit për telefonatën Tuaj.", ["Vielen Dank für Ihren Anruf.", "Danke für Ihren Anruf."], "für + Akk: Ihren Anruf."),
    ],
    test: [
      fc.tr("t1", "Për pyetje jam në dispozicion.", ["Für Fragen stehe ich Ihnen gern zur Verfügung.", "Für Rückfragen stehe ich Ihnen gern zur Verfügung.", "Für Fragen stehe ich Ihnen zur Verfügung."], "zur Verfügung stehen."),
      fc.mc("t2", "'Lidhur me kërkesën Tuaj' =", ["Bezüglich Ihrer Anfrage", "Wegen deine Frage", "Über Ihre Frage"], 0, "bezüglich + Genitiv."),
    ],
    recommendationSq: "Mëso përmendësh 10 fraza formale dhe përdori në simulimet e call center-it.",
    keywords: ["formell", "formal", "höflich", "sie", "email", "brief"],
  },
  {
    id: "b2-professional",
    level: "B2",
    title: "Fachwortschatz Kundenservice",
    titleSq: "Fjalor profesional i shërbimit ndaj klientit",
    summarySq: "Fjalë kyçe: Vertrag, Kündigung, Gutschrift, Reklamation, Lieferverzug...",
    explanationSq: [
      "Në një call center gjerman do të dëgjosh shpesh fjalë specifike. Mësoji me nyje dhe me një fjali shembull.",
      "der Vertrag (kontrata), die Kündigung (anulimi i kontratës), die Gutschrift (kreditimi), die Reklamation (reklamimi/ankesa për produkt), der Lieferverzug (vonesa e dërgesës), die Kundennummer (numri i klientit), die Lastschrift (debitimi direkt), die Frist (afati), die Bearbeitung (përpunimi), die Sendungsverfolgung (gjurmimi i dërgesës).",
    ],
    rule: ["Mëso: nyje + emër + shumës + folja tipike", "eine Reklamation einreichen · einen Vertrag kündigen · eine Gutschrift erstellen"],
    examples: [
      { de: "Ich möchte meinen Vertrag kündigen.", sq: "Dua ta anuloj kontratën time." },
      { de: "Wir erstellen Ihnen eine Gutschrift über 20 Euro.", sq: "Do t'Ju krijojmë një kreditim prej 20 eurosh." },
      { de: "Die Kündigungsfrist beträgt drei Monate.", sq: "Afati i anulimit është tre muaj." },
      { de: "Mit der Sendungsnummer können Sie Ihr Paket verfolgen.", sq: "Me numrin e dërgesës mund ta gjurmoni pakon." },
    ],
    commonMistakes: [
      { wrong: "Ich will meinen Vertrag stornieren.", right: "Ich will meinen Vertrag kündigen.", whySq: "Kontrata 'gekündigt' (anulohet); porosia 'storniert'." },
      { wrong: "die Reklamation machen", right: "eine Reklamation einreichen", whySq: "Kombinimi i zakonshëm: eine Reklamation einreichen." },
      { wrong: "der Gutschrift", right: "die Gutschrift", whySq: "-schrift → die." },
    ],
    exercises: [
      pv.mc("e1", "Një kontratë ___.", ["storniert man", "kündigt man", "bestellt man"], 1, "einen Vertrag kündigen."),
      pv.mc("e2", "Kreditimi (para të kthyera në llogari) =", ["die Rechnung", "die Gutschrift", "die Lastschrift"], 1, "die Gutschrift."),
      pv.fill("e3", "Die Kündigungs___ beträgt einen Monat. (afati)", ["frist"], "die Frist → Kündigungsfrist."),
      pv.tr("e4", "Dua të bëj një reklamim.", ["Ich möchte eine Reklamation einreichen.", "Ich möchte reklamieren."], "eine Reklamation einreichen."),
    ],
    test: [
      pv.mc("t1", "Vonesa e dërgesës =", ["der Lieferverzug", "die Lieferung", "der Versand"], 0, "der Lieferverzug."),
      pv.tr("t2", "Cili është numri Juaj i klientit?", ["Wie lautet Ihre Kundennummer?", "Wie ist Ihre Kundennummer?", "Was ist Ihre Kundennummer?"], "Wie lautet Ihre Kundennummer?"),
    ],
    recommendationSq: "Shto fjalët profesionale në fjalorin tënd dhe ushtroji me simulimet e call center-it.",
    keywords: ["fachwortschatz", "kündigung", "vertrag", "gutschrift", "reklamation", "professional vocabulary"],
  },
  {
    id: "b2-opinion",
    level: "B2",
    title: "Argumentieren und Meinung äußern",
    titleSq: "Argumentimi dhe shprehja e mendimit",
    summarySq: "Meiner Meinung nach..., Einerseits ... andererseits..., Ich bin der Ansicht, dass...",
    explanationSq: [
      "Për të shprehur mendim: Meiner Meinung nach ... (sipas mendimit tim — kujdes: folja vjen menjëherë pas!), Ich finde/denke/glaube, dass ..., Ich bin der Ansicht, dass ...",
      "Për pro dhe kundër: Einerseits ..., andererseits ... (Nga njëra anë ..., nga ana tjetër ...), Ein Vorteil ist, dass ... Ein Nachteil ist, dass ...",
      "Për të pajtuar/kundërshtuar me edukatë: Da stimme ich Ihnen zu. / Da bin ich anderer Meinung. / Das sehe ich etwas anders.",
      "Për përfundim: Zusammenfassend lässt sich sagen, dass ...",
    ],
    rule: ["Meiner Meinung nach + VERB + Subjekt", "Ich bin der Ansicht, dass + ... + Verb (Ende)", "Einerseits + VERB ..., andererseits + VERB ..."],
    examples: [
      { de: "Meiner Meinung nach ist Homeoffice sehr praktisch.", sq: "Sipas mendimit tim, puna nga shtëpia është shumë praktike." },
      { de: "Einerseits verdient man gut, andererseits ist die Arbeit stressig.", sq: "Nga njëra anë fiton mirë, nga ana tjetër puna është stresuese." },
      { de: "Ich bin der Ansicht, dass Sprachkenntnisse sehr wichtig sind.", sq: "Jam i mendimit që njohuritë gjuhësore janë shumë të rëndësishme." },
      { de: "Das sehe ich etwas anders.", sq: "Këtë e shoh pak ndryshe." },
    ],
    commonMistakes: [
      { wrong: "Meiner Meinung nach Homeoffice ist gut.", right: "Meiner Meinung nach ist Homeoffice gut.", whySq: "'Meiner Meinung nach' zë vendin 1 → folja menjëherë pas." },
      { wrong: "Ich bin der Meinung, dass das ist richtig.", right: "Ich bin der Meinung, dass das richtig ist.", whySq: "dass → folja në fund." },
      { wrong: "In meiner Meinung ...", right: "Meiner Meinung nach ...", whySq: "Shprehja fikse është 'Meiner Meinung nach'." },
    ],
    exercises: [
      op.ord("e1", "Meiner Meinung nach ist die Arbeit im Callcenter interessant.", "Folja (ist) pas 'Meiner Meinung nach'."),
      op.fix("e2", "Einerseits ich arbeite gern, andererseits ich bin oft müde.", ["Einerseits arbeite ich gern, andererseits bin ich oft müde."], "einerseits/andererseits + folje + kryefjalë."),
      op.free("e3", "Was denken Sie über Homeoffice? Antworten Sie mit 2–3 Sätzen.", "Meiner Meinung nach ist Homeoffice praktisch, weil man keine Zeit im Verkehr verliert. Andererseits fehlt der Kontakt zu den Kollegen.", "Përdor 'Meiner Meinung nach', 'weil' dhe 'andererseits'.", "Shpreh mendimin tënd."),
    ],
    test: [
      op.fix("t1", "Meiner Meinung nach Deutsch ist schwer.", ["Meiner Meinung nach ist Deutsch schwer."], "Folja pas."),
      op.free("t2", "Nennen Sie einen Vorteil und einen Nachteil der Arbeit im Callcenter.", "Ein Vorteil ist, dass man viel mit Menschen spricht. Ein Nachteil ist, dass die Arbeit manchmal stressig ist.", "Ein Vorteil ist, dass ... / Ein Nachteil ist, dass ...", "Jep një avantazh dhe një disavantazh."),
    ],
    recommendationSq: "Çdo ditë shpreh mendimin për një temë me 3 fjali: mendim + arsye (weil) + kundërargument (andererseits).",
    keywords: ["meinung", "argument", "opinion", "einerseits", "ansicht"],
  },
];
