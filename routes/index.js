const express = require('express');
const router = express.Router();

// Middleware para verificar si NO está logueado (solo para acceso)
const forwardAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  if (req.session.user.role === 'admin') {
    return res.redirect('/admin/dashboard');
  }
  res.redirect('/dashboard');
};

// Rutas Públicas
router.get('/', (req, res) => {
  res.render('index');
});

router.get('/convocatoria', (req, res) => {
  res.render('convocatoria');
});

router.get('/biblioteca', (req, res) => {
  res.render('biblioteca');
});

router.get('/programa', (req, res) => {
  res.render('programa');
});

router.get('/acceso', forwardAuthenticated, (req, res) => {
  res.render('acceso');
});

// Endpoint para cambiar de idioma
router.get('/lang/:code', (req, res) => {
  const code = req.params.code;
  if (['es', 'en', 'zh'].includes(code)) {
    res.cookie('lang', code, { maxAge: 900000, httpOnly: true });
  }
res.redirect(req.get('Referrer') || '/');});

module.exports = router;
