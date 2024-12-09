# Examples

## 🌍 Surprise Trip Planner

> `src/surprise_trip.ts`

Creates a personalized travel itinerary for Wrocław, Poland with activities, landmarks, and restaurants. 

**Actors:** Activity Planner, Landmark Scout, Restaurant Scout, Itinerary Compiler

## 🏥 Medical Survey

> `src/medical_survey.ts` & `src/medical_survey_server.ts`

Conducts a pre-visit medical survey with patients and generates a markdown report. Available as both CLI and server implementations.

**Actors:** Nurse, Reporter

## 📚 Library Photo to Website

> `src/library_photo_to_website.ts`

Analyzes a photo of a library to identify books and generates a website listing them.

**Actors:** Librarian, HTML Webmaster

## 👟 E-commerce Product Description

> `src/ecommerce_product_description.ts`

Analyzes product photos and creates compelling e-commerce descriptions with technical details.

**Actors:** Technical Expert, Marketing Manager

## 📋 Interactive Survey

> `src/survey.ts`

Conducts an interactive medical survey with persistence capabilities.

**Actors:** Nurse, Reporter

## 📰 News Wrap Up

> `src/news_wrap_up.ts`

Researches and summarizes the top news from the past week into a comprehensive report.

**Actors:** News Researcher, News Reader, Wrapup Redactor

## Running

Each example is a self-contained TypeScript file that can be run with Bun, or with `tsx`

```bash
$ bun run src/<example-name>.ts
```

or

```bash
$ tsx src/<example-name>.ts
```
