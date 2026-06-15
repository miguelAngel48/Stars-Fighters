describe('Flujo completo de la aplicacion', () => {
  const randomId = Date.now();
  const testEmail = `piloto${randomId}@test.com`;
  const testUser = `Jugador${randomId}`;
  const testPassword = 'Password123!';

  beforeEach(() => {
    cy.intercept('**/api/**', (req) => {
      if (req.url.includes('stars-fighters.z110.alumnes-esliceu.info')) {
        req.url = req.url.replace(
          'http://stars-fighters.z110.alumnes-esliceu.info'
        );
      }
    });
  });

  it('Debe permitir registrar a un usuario nuevo', () => {
    cy.visit('/register');

    cy.get('input[name="username"]').type(testUser);
    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);
    cy.get('button[type="submit"]').click();

    cy.get('.success-message').should('be.visible');
  });

  it('Debe permitir iniciar sesion con una cuenta existente', () => {
    cy.visit('/login');

    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard');
  });

});