# MyNetScore Product Documentation

## Product Vision

MyNetScore is an offline-first, mobile golf handicap calculator built for iOS and Android. It is designed to be the fastest, most frictionless way for a golfer to log a round and see their updated handicap index right as they step off the 18th green.

The application rejects complex cloud accounts and bloated feature sets in favor of a personal, user-driven "Grow-As-You-Go" database. By allowing golfers to quickly save their most-played courses and tees locally, the app becomes increasingly tailored and faster to use over time. Underneath the clean, large-button interface, a robust calculation engine ensures mathematically rigorous handicap indexes aligned with the World Handicap System (WHS).

## Target Audience

Golfers who want a dedicated, fast, and private tool to track their handicap index without relying on expensive subscriptions, constant internet connectivity, or intrusive data collection from heavy third-party apps.

## Core Features & Functionality

### 1. "The Living Index" (Home Dashboard)

The core of the user experience is the home screen, designed to provide immediate insight.

- **Massive Typography:** The current handicap index dominates the screen (approx. 60% vertical space).
- **Dynamic Color Shifting:** The index number subtly changes color based on the recent trend (Greenish for improving, Amber/Red for worsening, Warm White for stable).
- **Spark-Line Trend:** A minimalist graph sits below the index, visualizing the differential trend over the last 20 rounds.
- **"One-Tap Snapshot" Sharing:** A single button generates a branded image card (logo, index, spark-line, date) that saves directly to the user's camera roll for easy sharing, avoiding complex social integrations.

### 2. Frictionless Round Logging (Cascading UI)

Logging a round is designed to be as fast as possible, utilizing a clean interface optimized for outdoor tapping.

- **Course & Tee Selection:** Selecting a saved course instantly populates a secondary dropdown with only the relevant tees for that location.
- **On-the-Fly Entry:** If a user is at a new course or playing a new tee, they can add and save the Course Rating, Slope Rating, and Par directly from the logging screen without breaking their workflow.
- **Data Capture:** Quickly inputs Gross Score, Date, Course, and Tee.

### 3. Personal Offline Database

The app values user privacy and speed by storing all data locally on the device.

- **Grow-As-You-Go:** The app starts empty. Users manually input course and tee data only once. The app saves this, making future rounds at those locations instantaneous to log.
- **Relational Structure:** "Courses" (locations) are separated from "Tees" (specific yardages/ratings). Multiple tees can belong to a single course.

### 4. Global WHS Calculation Engine & History

The app automatically performs all necessary complex calculations behind the scenes.

- **Differential Math:** Every round calculates a differential: `(Gross Score - Course Rating) x (113 / Slope Rating)`.
- **8-of-20 Logic:** The app maintains a rolling history, averaging the lowest 8 score differentials from the most recent 20 rounds to determine the current index.
- **Visual History List:** A scrollable list of past rounds (Date, Course, Score, Differential). The 8 rounds currently counting toward the index are highlighted with a glowing Green Signal dot, instantly answering which rounds are affecting the handicap.
- **Regional Rules Toggle:** A simple setting handles regional differences, specifically a toggle for "Golf Australia" to apply their unique 0.93 multiplier, while the rest of the world uses the unified standard math.

### 5. Advanced Tools & Motivation

- **"What-If" Calculator:** A predictive tool allowing users to test scenarios: _"If I shoot 85 at Pebble Beach from the Blue Tees, what will my new index be?"_
- **Milestone Moments:** Tasteful micro-animations celebrate achievements (e.g., first round logged, 20th round completing the WHS cycle, breaking into a single-digit handicap).

### 6. Data Portability

Users own their data and are not locked into the ecosystem.

- **Manual Export/Import:** Users can export their entire database (history, courses, tees) as a lightweight JSON/CSV file.
- **Seamless Restoration:** This file can be imported on a new device, allowing seamless migration even between iOS and Android platforms without data loss.
