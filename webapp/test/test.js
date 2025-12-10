const request = require('supertest');
const { expect } = require('chai');

describe('Tests de l\'Application Web', () => {
  let app;

  before(() => {
    // Importer l'application
    app = require('../src/index.js');
  });

  // Test 1: La page d'accueil doit retourner 200
  describe('GET /', () => {
    it('devrait retourner 200 OK', (done) => {
      request(app)
        .get('/')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.text).to.include('DevOps');
          done();
        });
    });

    it('devrait afficher le contenu du CV', (done) => {
      request(app)
        .get('/')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.text).to.include('Sira Doumbouya');
          done();
        });
    });
  });

  // Test 2: Endpoint de santé
  describe('GET /health', () => {
    it('devrait retourner 200 OK', (done) => {
      request(app)
        .get('/health')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) return done(err);
          done();
        });
    });

    it('devrait retourner un statut de santé avec les champs requis', (done) => {
      request(app)
        .get('/health')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('status');
          expect(res.body).to.have.property('timestamp');
          expect(res.body).to.have.property('uptime');
          expect(res.body.status).to.equal('OK');
          done();
        });
    });
  });

  // Test 3: Endpoint API
  describe('GET /api/views', () => {
    it('devrait retourner le compteur de vues ou une erreur', (done) => {
      request(app)
        .get('/api/views')
        .end((err, res) => {
          if (err) return done(err);
          // Devrait retourner soit 200 soit 503 si Redis n'est pas disponible
          expect([200, 503]).to.include(res.status);
          done();
        });
    });
  });

  // Test 4: 404 pour les routes inconnues
  describe('GET /unknown', () => {
    it('devrait retourner 404', (done) => {
      request(app)
        .get('/route-inconnue')
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);
          done();
        });
    });
  });

  // Tests de configuration
  describe('Tests de Configuration', () => {
    it('devrait avoir un package.json valide', () => {
      const pkg = require('../package.json');
      expect(pkg).to.have.property('name');
      expect(pkg).to.have.property('version');
      expect(pkg).to.have.property('dependencies');
    });

    it('devrait avoir la dépendance express', () => {
      const pkg = require('../package.json');
      expect(pkg.dependencies).to.have.property('express');
    });
  });
});