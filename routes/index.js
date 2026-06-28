const express = require('express');
const router = express.Router();

// ==========================================
// Middleware para verificar si NO está logueado (solo para acceso)
// ==========================================
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
// Middleware para pasar variables a las vistas
// ==========================================
const renderWithI18n = (view) => (req, res) => {
  // Limpiar mensajes flash
  const success_msg = req.session.success_msg || null;
  const error_msg = req.session.error_msg || null;
  
  delete req.session.success_msg;
  delete req.session.error_msg;

  // Obtener el idioma actual
  const lang = req.getLocale ? req.getLocale() : 'es';
  
  res.render(view, {
    __: req.i18n ? req.i18n.__.bind(req.i18n) : (key) => key, // ⬅️ Función de traducción
    lang: lang,
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
// Endpoint para cambiar de idioma
// ==========================================
router.get('/lang/:code', (req, res) => {
  const code = req.params.code;
  
  // Validar que el idioma sea soportado
  if (['es', 'en', 'zh'].includes(code)) {
    // Guardar idioma en cookie por 30 días
    res.cookie('lang', code, { 
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      httpOnly: true 
    });
    
    // Guardar en sesión también para mantener consistencia
    if (req.session) {
      req.session.lang = code;
    }
  }
  
  // ✅ Redirigir a la página anterior o al inicio
  const referer = req.get('Referrer') || '/';
  res.redirect(referer);
});

// ==========================================
// Ruta de prueba para verificar traducciones (Opcional)
// ==========================================
router.get('/test-i18n', (req, res) => {
  const lang = req.getLocale ? req.getLocale() : 'es';
  res.json({
    lang: lang,
    messages: {
      home: req.i18n ? req.i18n.__('nav_home') : 'nav_home',
      convocatoria: req.i18n ? req.i18n.__('nav_convocatoria') : 'nav_convocatoria',
      program: req.i18n ? req.i18n.__('nav_program') : 'nav_program',
      library: req.i18n ? req.i18n.__('nav_library') : 'nav_library',
      speakers: req.i18n ? req.i18n.__('nav_speakers') : 'nav_speakers',
      contact: req.i18n ? req.i18n.__('nav_contact') : 'nav_contact'
    }
  });
});

module.exports = router;