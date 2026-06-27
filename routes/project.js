const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// Middleware para verificar si está logueado
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/acceso');
};

router.post('/submit', isAuthenticated, projectController.upload, projectController.submit);
router.get('/download/:id', isAuthenticated, projectController.download);
router.get('/certificate/:id', isAuthenticated, projectController.certificate);

module.exports = router;
