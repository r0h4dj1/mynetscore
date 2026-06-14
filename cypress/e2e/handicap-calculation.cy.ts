import type { Round } from '../../src/app/database/db';

// Each seeded round only needs a differential and a date; the handicap index is
// derived purely from differentials, so the teeId is intentionally a dangling
// reference (no matching tee/course exists). The home screen tolerates this and
// the index assertions below never touch the tee/course join.
const roundsFromDifferentials = (differentials: number[]): Round[] =>
  differentials.map((differential, index) => ({
    id: `round-${index}`,
    teeId: 'missing-tee',
    date: `2026-01-${String(index + 1).padStart(2, '0')}`,
    grossScore: 80 + index,
    differential,
  }));

// Expected index is a hardcoded golden value, not re-derived from WhsService, so
// the assertion can catch a regression in the WHS math rather than mirroring it.
const assertHomeIndex = (expectedDisplay: string, provisional: boolean): void => {
  cy.get('[data-testid="home-handicap-index"]').should('contain.text', expectedDisplay);
  cy.get('[data-testid="home-provisional-badge"]').should(provisional ? 'be.visible' : 'not.exist');
};

describe('handicap calculation', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.resetDb();
  });

  it('shows no index with fewer than three rounds', () => {
    cy.seedRounds(roundsFromDifferentials([14.2, 12.1]));
    cy.reload();

    assertHomeIndex('—', false);
  });

  it('shows the correct provisional index for three and nine rounds', () => {
    // 3 rounds → lowest 1 of [14.2, 12.1, 15.6] = 12.1, adjustment -2 → 10.1.
    cy.seedRounds(roundsFromDifferentials([14.2, 12.1, 15.6]));
    cy.reload();
    assertHomeIndex('10.1', true);

    // 9 rounds → lowest 3 = 9.9, 10.8, 11.3; mean 10.6667, adjustment 0 → 10.7.
    cy.resetDb();
    cy.seedRounds(roundsFromDifferentials([14.2, 12.1, 15.6, 10.8, 18.4, 11.3, 16.7, 13.5, 9.9]));
    cy.reload();
    assertHomeIndex('10.7', true);
  });

  it('uses the lowest eight of the most recent twenty and hides the provisional badge', () => {
    // 21 differentials: the oldest (14.2) falls outside the 20-round window, so
    // the most recent 20 are counted. Lowest 8 of those = 1.0, 8.8, 9.9, 10.2,
    // 10.8, 11.3, 11.7, 12.1; mean 9.475, adjustment 0 → 9.5.
    cy.seedRounds(
      roundsFromDifferentials([
        14.2, 12.1, 15.6, 10.8, 18.4, 11.3, 16.7, 13.5, 9.9, 17.2, 12.8, 14.9, 10.2, 19.1, 11.7, 15.1, 13.1, 8.8, 16.1,
        12.4, 1,
      ]),
    );
    cy.reload();

    assertHomeIndex('9.5', false);
  });
});
