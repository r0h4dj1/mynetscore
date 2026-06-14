const COURSE = {
  courseName: 'Cypress Links',
  teeName: 'White',
  rating: 71.4,
  slope: 124,
  par: 72,
};

// Hardcoded golden value so the test verifies the WHS math, not just that the UI
// echoes whatever WhsService computes: (88 - 71.4) * (113 / 124) → 15.1.
const EXPECTED_DIFFERENTIAL = 15.1;

describe('log a round', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.resetDb();
    cy.reload();
  });

  it('creates a course and tee, then persists a round with the correct differential', () => {
    const grossScore = 88;

    cy.get('[data-testid="home-add-round"]').click();
    cy.createCourseAndTee(COURSE);
    cy.logRound(grossScore);

    cy.location('pathname').should('eq', '/rounds');
    cy.get('[data-testid="rounds-row"]').should('have.length', 1).and('contain.text', COURSE.courseName);
    cy.get('[data-testid="rounds-row"]').should('contain.text', String(grossScore));
    cy.get('[data-testid="rounds-row"]').should('contain.text', EXPECTED_DIFFERENTIAL.toFixed(1));

    cy.dbRounds().should((rounds) => {
      expect(rounds).to.have.length(1);
      expect(rounds[0].grossScore).to.equal(grossScore);
      expect(rounds[0].differential).to.equal(EXPECTED_DIFFERENTIAL);
    });
    cy.dbCourses().its('0.name').should('equal', COURSE.courseName);
    cy.dbTees().its('0.name').should('equal', COURSE.teeName);
  });
});
