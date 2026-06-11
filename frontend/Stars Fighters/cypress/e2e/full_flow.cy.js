describe('Flujo completo de la aplicacion', () => {
  const uniqueId = new Date().getTime();
  const testEmail = `jugador${uniqueId}@esliceu.com`;
  const testUsername = `Jugador${uniqueId}`;
  const testPassword = 'Password123!';

  it('Registro, inicio de sesion y acceso al panel', () => {
    cy.visit('/');

    cy.contains('JUGAR GRATIS').click();
    cy.url().should('include', '/register');

    cy.contains('h1', 'Registro').should('be.visible');

    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="username"]').type(testUsername);
    cy.get('input[name="password"]').type(testPassword);

    cy.contains('button', 'Crear cuenta').click();

    cy.contains('Usuario registrado', { timeout: 8000 }).should('be.visible');

    cy.url({ timeout: 5000 }).should('include', '/login');

    cy.get('input[name="email"]').should('be.visible').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);

    cy.get('form').find('button[type="submit"]').click();

    cy.url().should('not.include', '/login');
    cy.url().should('not.include', '/register');
    cy.get('nav').should('be.visible');
  });
});