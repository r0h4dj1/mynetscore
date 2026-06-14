const COURSE = {
  courseName: 'Edit Course',
  teeName: 'Blue',
  rating: 73,
  slope: 130,
  par: 72,
};

// Hardcoded golden value for the edited score so the test verifies recalculation
// against the WHS formula directly: (84 - 73) * (113 / 130) → 9.6.
const EXPECTED_DIFFERENTIAL = 9.6;

describe('edit and delete a round', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.resetDb();
    cy.reload();
    cy.get('[data-testid="home-add-round"]').click();
    cy.createCourseAndTee(COURSE);
    cy.logRound(92);
  });

  it('recalculates an edited score, then removes the round and clears the home index', () => {
    const newScore = 84;

    cy.get('[data-testid="rounds-row"]').click();
    cy.get('[data-testid="round-gross-score"]').clear().type(String(newScore));
    cy.get('[data-testid="round-save"]').click();

    cy.get('[data-testid="rounds-row"]').should('contain.text', String(newScore));
    cy.dbRounds().should((rounds) => {
      expect(rounds).to.have.length(1);
      expect(rounds[0].grossScore).to.equal(newScore);
      expect(rounds[0].differential).to.equal(EXPECTED_DIFFERENTIAL);
    });

    cy.get('[data-testid="rounds-row"]').click();
    cy.get('[data-testid="round-delete"]').click();
    cy.get('[data-testid="popup-primary"]').click();

    cy.get('[data-testid="rounds-empty"]').should('be.visible');
    cy.dbRounds().should('have.length', 0);
    cy.get('button[aria-label="Home"]').click();
    cy.get('[data-testid="home-handicap-index"]').should('contain.text', '—');
  });
});
