# MyNetScore Architecture

## 1. Overview

MyNetScore is an offline-first, cross-platform mobile application (iOS and Android) designed as a fast, frictionless golf handicap calculator. It enables users to build a personal, local database of golf courses, tees, and rounds, and calculates their handicap index using the World Handicap System (WHS). The architecture prioritizes speed, data privacy (no cloud accounts required), and an intuitive user experience.

## 2. High-Level Architecture

The application follows a modern frontend-heavy mobile architecture, leveraging web technologies deployed within a native container.

- **Presentation Layer:** Built with Angular and Ionic Framework, utilizing modern reactive state management paradigms (Signals).
- **Styling Layer:** Tailwind CSS provides utility-first styling mapped strictly to the brand identity design tokens.
- **Business Logic Layer:** Encapsulates the WHS mathematical engine, including the rolling 8-of-20 logic, score differential calculations, and regional rule adjustments (e.g., Golf Australia multiplier).
- **Data Access Layer:** Uses Drizzle ORM for type-safe and seamless interaction with the local database.
- **Storage Layer:** An on-device SQLite database handles the persistent storage of user data (Courses, Tees, Rounds).
- **Native Bridge:** Capacitor serves as the runtime, compiling the web application into native iOS and Android binaries and providing access to native device APIs (like file system for exports).

## 3. Technology Stack

- **Frontend Framework:** Angular (Standalone components, Signals)
- **UI Components:** Ionic Framework
- **CSS Framework:** Tailwind CSS
- **Database:** SQLite (via `@capacitor-community/sqlite` plugin)
- **ORM:** Drizzle ORM (TypeScript)
- **Native Runtime:** Capacitor
- **Testing:** Vitest (Unit logic), Cypress (E2E journeys)
- **Tooling:** ESLint, Prettier

## 4. Data Architecture (Offline-First)

The app employs a "Grow-As-You-Go" relational data model stored entirely on the local device, ensuring zero reliance on network connectivity for core operations.

### 4.1 Entity Relationship Model

- **Course:** Represents the physical golf facility.
- **Tee:** Associated with a specific Course (1-to-many relationship). Stores specific Course Rating, Slope Rating, and Par.
- **Round:** Tied to a specific Tee. Records the user's Gross Score, Date played, and the mathematically calculated Score Differential.

### 4.2 Data Portability

To ensure data longevity without requiring complex cloud infrastructure, the system implements manual JSON/CSV export and import mechanisms. This allows users to easily back up their database or migrate between disparate ecosystems (e.g., iOS to Android) seamlessly.

## 5. Core Application Logic (WHS Engine)

The core of the app's utility lies in its adherence to the World Handicap System mathematics:

- **Differential Calculation:** Every logged round generates a differential using the standard formula: `(Gross Score - Course Rating) x (113 / Slope Rating)`.
- **Handicap Index (8-of-20):** The app maintains a rolling history, automatically identifying and averaging the lowest 8 score differentials out of the user's 20 most recent rounds.
- **Predictive Modeling:** A "What-If" calculator leverages this engine to simulate how hypothetical future rounds would impact the user's index.

## 6. User Interface Architecture

The UI architecture focuses on an intuitive, cascading flow designed for quick, outdoor interaction:

- **The Living Index (Dashboard):** The main view is dominated by the handicap index. It employs dynamic color shifting (Green for improving, Amber/Red for worsening) and spark-line trends to convey progress at a glance.
- **Cascading Inputs:** The round logging workflow uses dependent selections (selecting a Course immediately filters available Tees) to minimize friction.
- **On-the-Fly Creation:** Users can define new Courses or Tees inline during the round logging process, avoiding workflow interruption.
- **Visual States:** Clear status indicators (e.g., glowing dots for "counting" rounds) make complex WHS rules easily digestible for the user.
