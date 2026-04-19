# Graph Report - /Users/archeet/Desktop/BoilerSub/stitch_purdue_sublease_connect  (2026-04-11)

## Corpus Check
- 17 files · ~239,566 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 20 nodes · 17 edges · 6 communities detected
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)

## Surprising Connections (you probably didn't know these)
- `BoilerSub Platform` --exclusively_serves--> `Purdue University`  [EXTRACTED]
   →   _Bridges community 2 → community 3_
- `BoilerSub Platform` --implements_philosophy--> `The Kinetic Curator Design Philosophy`  [EXTRACTED]
   →   _Bridges community 2 → community 0_
- `User Verification Flow` --starts_with--> `@purdue.edu Email Authentication`  [EXTRACTED]
   →   _Bridges community 1 → community 3_

## Communities

### Community 0 - "Design System & Tonal Layering"
Cohesion: 0.4
Nodes (5): The Academic Kinetic Design System, Editorial Typography (Plus Jakarta Sans), The Kinetic Curator Design Philosophy, The No-Line Rule, Tonal Layering Principle

### Community 1 - "Verification & Trust Flow"
Cohesion: 0.4
Nodes (5): Boiler Trust, SMS Phone Verification, Sublease Listing Entity, Kinetic 3D Walkthrough, User Verification Flow

### Community 2 - "Platform Identity & Brand Colors"
Cohesion: 0.67
Nodes (3): BoilerSub Platform, Electric Blue (#0052d0), Kinetic Coral (#a03a0f)

### Community 3 - "Purdue University & Auth"
Cohesion: 0.67
Nodes (3): BoilerGuard Protection, @purdue.edu Email Authentication, Purdue University

### Community 4 - "Glassmorphic Filtering"
Cohesion: 1.0
Nodes (2): Glassmorphism UI Pattern, The Vibe Filter

### Community 5 - "Real Estate & Locations"
Cohesion: 1.0
Nodes (2): Discovery Park District, The Aspire Lofts

## Knowledge Gaps
- **Thin community `Glassmorphic Filtering`** (2 nodes): `Glassmorphism UI Pattern`, `The Vibe Filter`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Real Estate & Locations`** (2 nodes): `Discovery Park District`, `The Aspire Lofts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 2 inferred relationships involving `@purdue.edu Email Authentication` (e.g. with `BoilerGuard Protection` and `Purdue University`) actually correct?**
  _`@purdue.edu Email Authentication` has 2 INFERRED edges - model-reasoned connections that need verification._