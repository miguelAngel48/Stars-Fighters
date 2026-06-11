describe('Navegacion principal', () => {
  it('Carga la landing page y permite ir al registro', () => {
    cy.visit('/');
    cy.contains('UN UNIVERSO DE ESTRATEGIA Y COMBATE').should('be.visible');
    cy.contains('JUGAR GRATIS').click();
    cy.url().should('include', '/register');
  });
});