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

## Architecture

```
src/
  app/                 Next.js App Router pages + /api/ai/* routes (server-only AI calls)
  components/          AppShell, ExerciseRunner, ConversationPanel, FlashcardReview, PronunciationDrill, charts, UI
  content/             Curriculum: grammar (A1–B2), questions, call center, speaking scenarios, placement, reading/listening, seed vocabulary
  lib/
    db/                Table definitions (single source of truth), local + Supabase stores, change batches
    ai/                Provider abstraction (Anthropic SDK / OpenAI-compatible), prompts, zod schemas, access guard
    srs.ts             Spaced repetition
    grammar-progress.ts  Mastery ladder, level unlocking, spaced grammar reviews
    level.ts           CEFR estimation from skill evidence
    mistakes.ts        Mistake log, grouping, mistake → exercise
    learning.ts        Records results into evidence / progress / mistakes
    weakness.ts, recommendations.ts, session-plan.ts   Adaptive planning
    memory.ts          Builds the mentor's persistent memory from structured records
```

**Persistent memory** is not chat history: every AI request carries a compact summary built from the tables (`skill_evidence`, `mistakes`,
`grammar_progress`, `vocabulary`/`srs_cards`, `mentor_memory` notes, recent `learning_sessions`). The AI writes durable observations back into `mentor_memory`.

**Storage.** All reads/writes go through a `Store` interface. Without Supabase the app uses `localStorage` (single browser). With Supabase and a login,
the same rows go to Postgres tables protected by Row Level Security. Settings → Data has JSON export/import, and "upload browser data" after first login.

**AI provider.** API keys live only in server environment variables; the browser calls `/api/ai/*`. Anthropic uses the official SDK with structured outputs
(`claude-opus-5-5` by default, server-side refusal fallback enabled). Any OpenAI-compatible endpoint works via JSON mode + zod validation.
If no provider is configured, every AI-dependent screen falls back to scripted/offline behaviour.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in what you need (all optional)
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | for AI (option A) | Claude API key (server only) |
| `AI_MODEL` | no | Model id (default `claude-opus-5-5`; `claude-sonnet-5-5` / `claude-haiku-5-5` are cheaper and faster) |
| `AI_PROVIDER` | no | `anthropic` or `openai-compatible` (auto-detected) |
| `OPENAI_COMPATIBLE_BASE_URL`, `OPENAI_COMPATIBLE_API_KEY`, `OPENAI_COMPATIBLE_MODEL` | for AI (option B) | Any OpenAI-compatible chat-completions API |
| `AI_ALLOW_MODEL_OVERRIDE` | no | `false` to disable choosing a model in Settings |
| `APP_PASSCODE` | recommended when deployed | Required header for AI routes; enter it once in Settings |
| `AI_REQUIRE_LOGIN` / `ALLOWED_EMAILS` | no | Require a Supabase login / restrict AI to specific accounts |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | for cloud storage | Supabase project (anon key is public by design; data is protected by RLS) |

### Supabase (optional, recommended for long-term use)
1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor (or `supabase db push`). It creates 12 tables —
   `profile, learning_sessions, vocabulary, srs_cards, grammar_progress, mistakes, conversations, daily_goals, weekly_assessments, mentor_memory, skill_evidence, study_plans` —
   each with `user_id` + RLS policy "owner only".
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, restart, and create your account in **Settings → Account**.
4. If you already practised in the browser, use **Upload browser data** once.

The schema is generated from `src/lib/db/tables.ts` (`npm run gen:sql`); a unit test fails if the committed SQL drifts.

### Microphone & voice
Speech recognition uses the browser Web Speech API (Chrome, Edge, Safari; needs HTTPS or localhost and microphone permission). Text-to-speech uses the
system's German voice. Firefox has no speech recognition — typing still works everywhere.

## Scripts
```bash
npm run dev        # development server
npm run build      # production build (includes type checking)
npm test           # unit tests for the learning engine, content integrity and schema sync
npm run gen:sql    # regenerate the Supabase migration from the table definitions
```

## Verified
- `npm run build` and `npm test` (25 tests: answer checking, SRS, mastery/unlocking, CEFR estimation, mistakes, planning, content integrity, schema sync, AI schemas).
- Browser end-to-end runs (Playwright) in both modes — **no AI** and **AI via a mock OpenAI-compatible server** — covering onboarding/placement,
  7-day plan, dashboard, flashcards, daily grammar block, speaking correction + repeat step + vocabulary suggestion, the full weekly assessment and report,
  every page, reload persistence, mobile width (no horizontal overflow) and dark mode, with zero console errors.
- Not verified here: calls to the real Anthropic API (no key in the build environment) and a live Supabase project.
