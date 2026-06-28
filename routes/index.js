const express = require('express');
const router = express.Router();

const forwardAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  if (req.session.user.role === 'admin') {
    return res.redirect('/admin/dashboard');
  }
  res.redirect('/dashboard');
};

// ==========================================
// Renderizar vistas con i18n
// ==========================================
const renderWithI18n = (view) => (req, res) => {
  const success_msg = req.session.success_msg || null;
  const error_msg = req.session.error_msg || null;
  
  delete req.session.success_msg;
  delete req.session.error_msg;

  res.render(view, {
    __: req.__ || ((key) => key),
    lang: req.lang || 'es',
    user: req.session.user || null,
    success_msg: success_msg,
    error_msg: error_msg
  });
};

// ==========================================
// Rutas Públicas
// ==========================================
router.get('/', renderWithI18n('index'));
router.get('/convocatoria', renderWithI18n('convocatoria'));
router.get('/biblioteca', renderWithI18n('biblioteca'));
router.get('/programa', renderWithI18n('programa'));
router.get('/acceso', forwardAuthenticated, renderWithI18n('acceso'));

// ==========================================
// Cambiar de idioma
// ==========================================
router.get('/lang/:code', (req, res) => {
  const code = req.params.code;
  if (['es', 'en', 'zh'].includes(code)) {
    res.cookie('lang', code, { 
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true 
    });
  }
  res.redirect(req.get('Referrer') || '/');
});

// ==========================================
// Ruta de prueba
// ==========================================
router.get('/test-i18n', (req, res) => {
  const __ = req.__ || ((key) => key);
  res.json({
    lang: req.lang || 'es',
    translations_available: !!req.__,
    messages: {
      home: __('nav_home'),
      convocatoria: __('nav_convocatoria'),
      program: __('nav_program'),
      library: __('nav_library'),
      speakers: __('nav_speakers'),
      contact: __('nav_contact')
    }
  });
});

module.exports = router;