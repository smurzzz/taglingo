# TagLingo — Project Overview

**Platform:** Mobile Application (Android, via Expo/React Native)
**Prepared by:** [Your Name]
**Section:** [Your Section]
**Submitted to:** Noel Montecillo
**Date:** [Presentation Date]

---

## 1. Introduction

Many Filipino students and young learners want to strengthen their Tagalog or Cebuano vocabulary alongside English, whether for academic purposes, communicating with relatives who speak a different local language, or simply preserving fluency in their mother tongue. Most flashcard and vocabulary apps available on app stores are built for foreign languages (Spanish, Japanese, Korean) and offer no dedicated support for Filipino languages.

TagLingo proposes a fully online mobile flashcard application where users can study Tagalog/Cebuano-English vocabulary organized by difficulty level (Beginner, Intermediate, Advanced), reinforce learning through multiple-choice quizzes, look up supplementary English definitions, and track mastered words and study streaks in real time.

## 2. Purpose of the Project

This proposal aims to present a mobile application that addresses the lack of dedicated Filipino-language study tools, streamlines vocabulary practice for Tagalog and Cebuano learners, and improves retention through repeatable, level-based flashcard review and quizzing.

## 3. Objectives

### 3.1 General Objective
To design and develop an online mobile flashcard application that helps users learn and review Tagalog/Cebuano-English vocabulary — organized by difficulty level — through interactive study sessions and quizzes.

### 3.2 Specific Objectives
- To allow users to study vocabulary organized into Beginner, Intermediate, and Advanced levels.
- To let users mark words as mastered/still learning and bookmark favorites to track progress.
- To integrate live English definition lookup for supplementary understanding.
- To provide a multiple-choice quiz mode that reinforces retention beyond passive flipping.
- To ensure real-time, cloud-based progress syncing across devices through a fully online architecture.
- To ensure the system is secure, scalable, and easy to maintain.

## 4. Project Scope

### 4.1 In Scope
- Pre-seeded Tagalog/Cebuano-English vocabulary, organized by difficulty level.
- Flashcard study mode with flip-to-reveal, mastered/learning tracking, and favoriting.
- Search/filter words by Tagalog, Cebuano, or English spelling.
- Live English definition lookup.
- Multiple-choice quiz mode per level, with score and missed-word review.
- Push notification study reminders.
- Real-time, online-only progress syncing (no offline study mode, though an offline *state* screen handles connectivity loss gracefully).

### 4.2 Out of Scope
- Full sentence translation or conversational AI chatbot features.
- Support for languages beyond Tagalog, Cebuano, and English.
- In-app admin panel or deck management — vocabulary is pre-seeded directly into the database.
- User-generated public deck marketplace.
- True offline study mode.

## 5. Target Users

| User Role | Description | Key Needs / Usage |
|---|---|---|
| Student Learner | Primary user studying Tagalog/Cebuano vocabulary | Study flashcards, take quizzes, track progress, look up definitions |
| Casual User | Heritage speaker refreshing vocabulary | Browse words by level casually, without strict progress tracking |

## 6. Technology Stack (summary)

See `06-LIBRARY-DOCS.md` for the full pinned dependency list. At a glance: **React Native (Expo) + expo-router**, **Clerk** for authentication, **Next.js API Routes** for server-side logic (including the definition lookup proxy), **Supabase (Postgres + RLS)** for data and real-time sync, **React Query** for server state, **react-hook-form + zod** for forms/validation, and **EAS Build** for APK distribution.

## 7. Document Map

| Doc | Purpose |
|---|---|
| `01-PHASE-PLAN.md` | Sequential build plan, phase by phase |
| `02-ARCHITECTURE.md` | Data model, API contracts, matching/quiz logic, state notes |
| `03-CODE-STANDARDS.md` | Conventions for structure, naming, linting |
| `04-DEMO-GUIDE.md` | Scripted walkthrough for the defense/demo |
| `05-TESTING-REPORT.md` | Critical-path test cases and pass criteria |
| `06-LIBRARY-DOCS.md` | Pinned dependency versions and purpose |
| `07-FUNCTIONALITY-PROMPT.md` | Per-screen functional implementation spec |
| `08-PROGRESS-TRACKER.md` | Living status tracker against the phase plan |
| `AGENT.md` | Orientation file for an AI coding agent working in this repo |