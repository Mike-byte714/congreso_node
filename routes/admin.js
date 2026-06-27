const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Middleware para verificar si es admin
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.redirect('/acceso');
};

router.get('/dashboard', isAdmin, adminController.dashboard);
router.get('/proyectos', isAdmin, adminController.projects);
router.post('/proyectos/:id/status', isAdmin, adminController.updateProjectStatus);

module.exports = router;
