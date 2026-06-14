const COURSE = {
  courseName: 'Protected Course',
  teeName: 'Red',
  rating: 69,
  slope: 110,
  par: 70,
};

describe('course and tee referential integrity', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.resetDb();
    cy.reload();
    cy.get('[data-testid="home-add-round"]').click();
    cy.createCourseAndTee(COURSE);
    cy.logRound(81);
  });

  it('blocks deletion while a round exists, then permits cleanup after deleting it', () => {
    cy.get('button[aria-label="Courses"]').click();
    cy.get('[data-testid="courses-row"]').click();

    cy.get('[data-testid="course-tee-row"]').click();
    cy.get('[data-testid="edit-tee-delete"]').click();
    cy.get('[data-testid="toast"]').should('contain.text', 'This tee has logged rounds and cannot be deleted.');
    cy.dbTees().should('have.length', 1);

    cy.get('[data-testid="course-edit"]').click();
    cy.get('[data-testid="edit-course-delete"]').click();
    cy.get('[data-testid="toast"]').should('contain.text', 'This course has logged rounds and cannot be deleted.');
    cy.dbCourses().should('have.length', 1);
    cy.dbTees().should('have.length', 1);

    cy.get('button[aria-label="Rounds"]').click();
    cy.get('[data-testid="rounds-row"]').click();
    cy.get('[data-testid="round-delete"]').click();
    cy.get('[data-testid="popup-primary"]').click();
    cy.dbRounds().should('have.length', 0);

    cy.get('button[aria-label="Courses"]').click();
    cy.get('[data-testid="courses-row"]').click();
    cy.get('[data-testid="course-tee-row"]').click();
    cy.get('[data-testid="edit-tee-delete"]').click();
    cy.get('[data-testid="course-tee-row"]').should('not.exist');
    cy.dbTees().should('have.length', 0);

    cy.get('[data-testid="course-edit"]').click();
    cy.get('[data-testid="edit-course-delete"]').click();
    cy.location('pathname').should('eq', '/courses');
    cy.get('[data-testid="courses-row"]').should('not.exist');
    cy.dbCourses().should('have.length', 0);
  });
});
