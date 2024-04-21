/// <reference types="cypress" />


context('Actions', () => {
  before(() => {    
    cy.visit('http://localhost:5000')
    // cy.visit('http://192.168.178.29:5000')
  })

  beforeEach(() => {
    cy.viewport('macbook-13')
  })

  it('update file list', () => {    
    cy.get('.updateFiles').click()
  })

  it('convert file', () => {
    cy.get('.convertFile').click()
  })
  
  it('start conversion', () => {
    cy.get('.startConversion').click()
    cy.wait(100)
    cy.screenshot('/test_snapshots')
  })

  it('check conversion success', () => {
    cy.wait(3000)
    cy.get('.selectFile').should('contain', 'columbia_A4-a4-portrait-hp7475a.hpgl')
  })

  it('select file to plot', () => {
    cy.wait(200)
    cy.contains('columbia_A4-a4-portrait-hp7475a.hpgl').click()
  })

  it('refesh file list', () => {
    cy.get('.updateFiles').click()
  })  

})
