const COURSE = {
  courseName: 'Duplicate Course',
  teeName: 'Yellow',
  rating: 70,
  slope: 113,
  par: 71,
};

describe('duplicate round detection', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.resetDb();
    cy.reload();
    cy.get('[data-testid="home-add-round"]').click();
    cy.createCourseAndTee(COURSE);
    cy.logRound(85);
  });

  it('keeps one round when the duplicate prompt is cancelled', () => {
    cy.logRound(86, COURSE.courseName, COURSE.teeName);

    cy.get('[data-testid="popup"]').should('contain.text', 'Duplicate round?');
    cy.get('[data-testid="popup-secondary"]').click();
    cy.get('[data-testid="popup"]').should('not.exist');
    cy.dbRounds().should('have.length', 1);
  });

  it('persists a second round when logging the duplicate anyway', () => {
    cy.logRound(86, COURSE.courseName, COURSE.teeName);

    cy.get('[data-testid="popup"]').should('contain.text', 'Duplicate round?');
    cy.get('[data-testid="popup-primary"]').click();
    cy.location('pathname').should('eq', '/rounds');
    cy.get('[data-testid="rounds-row"]').should('have.length', 2);
    cy.dbRounds().should('have.length', 2);
  });
});
