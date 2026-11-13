# Deutsch Mentor — personal AI German mentor

A private German-learning app built around one learner: native Albanian speaker, A1/A2 → B1/B2, goal: working in a German-speaking call center.
It is **not** a generic course: every exercise, conversation and correction is stored as structured data, and the mentor plans the next
lessons from that data (weaknesses, recurring mistakes, spaced-repetition due dates, demonstrated levels).

## Features

| Area | What it does | Works without AI? |
|---|---|---|
| **Onboarding & placement** | Mentor intro, pre-loaded learner profile, placement test (sentence building, questions, grammar A1–B1, short conversation), confirmed weaknesses, 7-day plan | ✅ (conversation is scripted/self-rated offline) |
| **Dashboard** | Daily mentor message, today's plan (vocab → grammar → sentences → conversation → quiz), level, streak, sessions, vocabulary, grammar status, speaking time, repeated mistakes, improvements, next topic, weekly chart | ✅ (AI writes the daily message when available) |
| **Daily session** | 30–45 min session; time shifts toward the biggest weakness; least-recently-seen exercises + AI-generated fresh ones; past mistakes come back as "fix this sentence" items | ✅ |
| **AI Mentor** | Chat with the professor: grammar questions in Albanian, mini drills, corrections, memory panel showing what the mentor knows | AI only |
| **Speaking** | 12 scenarios (introducing yourself … complaints), microphone input, one question at a time, original vs. corrected sentence, Albanian explanation, *repeat the corrected sentence* step, vocabulary suggestions, end-of-conversation scorecard; "repeat after me" pronunciation drill | ✅ scripted mode + pronunciation drill offline |
| **Grammar Academy** | 28 topics A1–B2: Albanian explanation, German rule, tables, examples with translations, common mistakes, practice, test, mastery status. Levels unlock only after 60% of the previous level is *demonstrated* (test ≥ 80%) | ✅ |
| **Vocabulary** | Word, Albanian, article, plural, example, level, status, last review; flashcards, DE→SQ, SQ→DE, fill-in, sentence building; SM-2-style spaced repetition; manual status (new/learning/difficult/known/mastered) | ✅ |
| **Question Trainer** | W-Fragen + Ja/Nein structure, 15 question words, 4 graduated stages up to indirect questions, Albanian → German questions, "answer → question" items | ✅ |
| **Call Center Training** | 8 customer scenarios A2 → B1 (AI plays the customer), goals checklist, professional phrasebook, phrase quiz, pronunciation drill, evaluation of grammar/vocabulary/fluency/professionalism/comprehension | ✅ scripted mode with keyword checks |
| **My Mistakes** | Original, corrected, Albanian explanation, category (grammar / word order / vocabulary / unnatural / spelling / pronunciation), topic, dates, frequency, recommendation, practice; 3 correct in a row → resolved | ✅ |
| **Progress & Reports** | Honest CEFR estimate per skill, studied → practiced → demonstrated → mastered, charts (minutes, accuracy, mistakes, words), quiz results, revision list, weekly reports | ✅ |
| **Weekly assessment** | Every 7 days: vocabulary, grammar, sentences, questions, reading, listening (browser TTS), speaking; report with learned/strengths/struggles/frequent mistakes/comparison/next-week plan | ✅ (AI adds a narrative) |

### Teaching rules the engine enforces
- **No inflated levels.** A level counts for a skill only with enough recent items *at that level* answered with ≥ 70% (recency-weighted) accuracy. The overall level is the *second-weakest* skill.
- **No "mastered" after one correct answer.** Words need a long interval, ≥ 6 reviews and ≥ 85% accuracy; grammar topics need a passed test *and* later passed reviews on different days with few recent mistakes.
- **Try before the answer.** Typed exercises give a hint on the first miss and reveal the answer only after the second attempt.
- **Albanian support fades.** Translations are shown fully at A1, tap-to-reveal at A2, hidden at B1+ (or set manually).
- **Strict but fair checking.** Offline checking accepts punctuation/umlaut variants and flags word-order errors separately; when AI is available, answers that the strict checker rejects are double-checked by the mentor so correct alternatives are accepted.

## 100% free, no database, no API

- **Your progress is saved in the browser** (localStorage) — no database, no account. The app asks the browser to keep the data permanently,
  remembers the last page you used ("Vazhdo ku e le" on the dashboard) and resumes today's lesson where you stopped.
  Clearing browser data or using a private window deletes it, so use **Settings → Ruaj kopje rezervë** now and then (JSON file, restorable on any computer).
- **The AI mentor is free and runs on your own device** — no API key, no payment. Choose in **Settings → Mentori AI falas**:
  - **In the browser (WebLLM):** a small open model (Qwen 2.5 1.5B/3B or Llama 3.1 8B) downloads once (1–5 GB) and is cached by the browser.
    Needs a recent Chrome or Edge on a computer with WebGPU. Works offline afterwards.
  - **Ollama on your computer:** install from ollama.com, run `ollama pull qwen2.5:7b`, select it in Settings. Bigger models give better corrections.
  - **No AI:** grammar, vocabulary, question trainer, call-center phrases, mistakes, progress, weekly assessment and scripted
    speaking/call-center practice all work without any AI.
- Small local models are much weaker than paid cloud models: they correct most beginner mistakes but can occasionally be wrong,
  especially in the Albanian explanations. The 8B model or Ollama with a 7–9B model gives clearly better results.

## Run it

```bash
npm install
npm run dev          # development: http://localhost:3000
```
or as a finished static site:
```bash
npm run build        # writes the site to ./out
npm start            # serves ./out on http://localhost:3000
```
The `out` folder can also be hosted for free (GitHub Pages, Netlify, Cloudflare Pages). Use `localhost` or HTTPS so the microphone works.

## Architecture

```
src/
  app/                 Pages (static export, no server code)
  components/          AppShell, ExerciseRunner, ConversationPanel, FlashcardReview, PronunciationDrill, AiSetup, charts, UI
  content/             Curriculum: grammar (A1–B2), questions, call center, speaking scenarios, placement, reading/listening, seed vocabulary
  lib/
    db/                Browser storage (localStorage) with table-like collections
    ai/                Free local engines (WebLLM / Ollama), compact prompts, zod schemas
    srs.ts, grammar-progress.ts, level.ts, mistakes.ts, learning.ts, weakness.ts, recommendations.ts, session-plan.ts, memory.ts
```

The mentor's **memory** is built from structured records (mistakes, grammar progress, vocabulary, notes, recent sessions) and sent with every AI request.

Microphone input uses the browser's Web Speech API (Chrome, Edge, Safari). Text-to-speech uses the system's German voice.

## Scripts
```bash
npm run dev     # development server
npm run build   # static production build into ./out (includes type checking)
npm start       # serve ./out
npm test        # unit tests for the learning engine, content integrity and storage
```
