describe('Flujo completo de la aplicacion', () => {

  it('Debe permitir registrar a un usuario nuevo', () => {
    const randomId = Date.now();
    const testEmail = `piloto${randomId}@test.com`;
    const testUser = `Jugador${randomId}`;

    cy.visit('/register');

    cy.get('input[name="username"]').type(testUser);
    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type('Password123!');
    cy.get('button[type="submit"]').click();

    cy.contains('Usuario registrado').should('be.visible');
  });

  it('Debe permitir iniciar sesion con una cuenta existente', () => {
    cy.visit('/login');

    cy.get('input[name="email"]').type('test@test.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard');
  });

});