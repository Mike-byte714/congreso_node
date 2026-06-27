const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Middleware para verificar si está logueado
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/acceso');
};

router.get('/', isAuthenticated, userController.dashboard);

module.exports = router;
