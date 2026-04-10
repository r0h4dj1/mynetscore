# Contributing to MyNetScore

This document outlines the developer guidelines and best practices to ensure a consistent, maintainable, and high-quality codebase.

## 1. Core Principles

### Keep It Simple, Stupid (KISS)

Simplicity is paramount. Avoid over-engineering solutions. Write code that is straightforward to read, understand, and maintain. If a simpler approach solves the problem effectively, choose it over a complex abstraction.

### Don't Repeat Yourself (DRY)

Avoid duplicating logic or UI components. If you find yourself writing the same code in multiple places, extract it into a reusable function, service, or component.

### Single Responsibility Principle (SRP)

Every component, function, or class should have one, and only one, reason to change. Break down complex logic into smaller, focused modules that handle specific tasks (e.g., data fetching, UI rendering, math calculations).

## 2. Coding Standards

### Strict Typing (TypeScript)

- **No `any` Types:** Strict typing is strictly enforced. Avoid using `any` at all costs.
- Always define explicit interfaces or types for your data structures, API responses, and function parameters/returns. This ensures the codebase remains robust and self-documenting.

### Styling (Tailwind CSS)

- **Utility-First:** Exclusively use Tailwind CSS utility classes for styling.
- **Avoid Custom CSS:** Do not write custom CSS in component style files or global stylesheets unless absolutely unavoidable (e.g., highly complex animations not supported by Tailwind). Stick to the established brand identity design tokens.

### UI / UX Design

- **Mobile-First Responsive Design:** MyNetScore is a mobile application. Design and build for small screens first.
- **Touch Interactions:** Prioritize large touch targets and frictionless interactions designed for outdoor, on-the-course usage. Ensure UI elements are easily tappable.

## 3. Testing Philosophy

### Unit Testing (Vitest)

- **Pragmatic Coverage:** We aim for a healthy balance, targeting roughly **70% code coverage** for unit tests.
- Focus unit tests heavily on critical business logic and complex state transformations. Do not overdo testing for simple elements where the value of the test is low.
- **Test Behavior, Not Implementation:** Focus on testing the public contract and expected outputs, not internal implementation details. Tests that verify behavior (inputs → outputs) remain stable even when refactoring.

### End-to-End (E2E) Testing (Cypress)

- **Real User Journeys:** E2E testing is highly advised for critical user flows (e.g., logging a round, exporting data).
- **No Mocking:** Whenever possible, avoid mocking in E2E tests. Test against the actual local database (SQLite/in-memory equivalent) to simulate true app behavior and ensure all layers (UI, Logic, DB) integrate seamlessly.
