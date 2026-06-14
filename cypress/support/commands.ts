import type { Course, Round, Tee } from '../../src/app/database/db';
import type { CourseAndTeeInput } from './index';

const byTestId = (testId: string): string => `[data-testid="${testId}"]`;

const waitForOpenSheet = (contentTestId: string): void => {
  cy.get(byTestId('sheet')).should('have.class', 'translate-y-0');
  cy.get(byTestId(contentTestId)).should('be.visible');
};

const appDb = (win: Cypress.AUTWindow) => {
  const database = win.__APP_DB__;
  if (!database) {
    throw new Error('App database bridge is unavailable. Run Cypress against the development server.');
  }
  return database;
};

Cypress.Commands.add('resetDb', () => {
  cy.window().then(async (win) => {
    const database = appDb(win);
    await Promise.all(database.tables.map((table) => table.clear()));
  });
});

Cypress.Commands.add('seedRounds', (rounds: Round[]) => {
  cy.window().then(async (win) => {
    await appDb(win).rounds.bulkPut(rounds);
  });
});

// The dbRounds/dbTees/dbCourses readers resolve a one-shot promise, so a trailing
// `.should()` retries only the assertion against the already-read snapshot — it does
// NOT re-query IndexedDB. Because the app writes to the DB asynchronously, every call
// site must first assert a piece of UI state that can only be true once the write has
// committed (e.g. the new row/score is visible, or navigation has settled). Reading the
// DB before such a gate races the write and produces a permanent, non-retryable failure.
Cypress.Commands.add('dbRounds', () => {
  return cy.window().then((win): Promise<Round[]> => appDb(win).rounds.toArray());
});

Cypress.Commands.add('dbTees', () => {
  return cy.window().then((win): Promise<Tee[]> => appDb(win).tees.toArray());
});

Cypress.Commands.add('dbCourses', () => {
  return cy.window().then((win): Promise<Course[]> => appDb(win).courses.toArray());
});

Cypress.Commands.add('createCourseAndTee', (input: CourseAndTeeInput) => {
  cy.get(byTestId('round-add-course')).click();
  waitForOpenSheet('add-course-name');
  cy.get(byTestId('add-course-name')).type(input.courseName);
  cy.get(byTestId('add-course-tee-name')).type(input.teeName);
  cy.get(byTestId('add-course-rating')).type(String(input.rating));
  cy.get(byTestId('add-course-slope')).type(String(input.slope));
  cy.get(byTestId('add-course-par')).type(String(input.par));
  cy.get(byTestId('add-course-submit')).click();
  cy.get(byTestId('sheet')).should('not.exist');
  cy.get(byTestId('round-course-select')).should('contain.text', input.courseName);
  cy.get(byTestId('round-tee-select')).should('contain.text', input.teeName);
});

Cypress.Commands.add('logRound', (grossScore: number, courseName?: string, teeName?: string) => {
  if (courseName && teeName) {
    cy.visit('/rounds/add');
    cy.get(byTestId('round-course-select')).click();
    waitForOpenSheet('selector-item');
    cy.get(byTestId('selector-item')).contains(courseName).click();
    cy.get(byTestId('round-course-select')).should('contain.text', courseName);
    cy.get(byTestId('round-tee-select')).click();
    waitForOpenSheet('selector-item');
    cy.get(byTestId('selector-item')).contains(teeName).click();
    cy.get(byTestId('round-tee-select')).should('contain.text', teeName);
  }

  cy.get(byTestId('round-gross-score')).clear().type(String(grossScore));
  cy.get(byTestId('round-save')).click();
});
