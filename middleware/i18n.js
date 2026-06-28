const path = require('path');
const fs = require('fs');

// Cargar todos los archivos de idioma
const translations = {};

const localesDir = path.join(__dirname, '..', 'locales');
const files = fs.readdirSync(localesDir);

files.forEach(file => {
  if (file.endsWith('.json')) {
    const lang = file.replace('.json', '');
    const content = fs.readFileSync(path.join(localesDir, file), 'utf8');
    translations[lang] = JSON.parse(content);
  }
});

console.log('✅ Archivos de idioma cargados:', Object.keys(translations));

/**
 * Middleware de internacionalización manual
 */
const i18nMiddleware = (req, res, next) => {
  // Determinar el idioma: cookie > query > default
  let lang = req.cookies.lang || req.query.lang || 'es';
  
  // Validar que el idioma exista
  if (!translations[lang]) {
    lang = 'es';
  }
  
  // Guardar el idioma en la request
  req.lang = lang;
  req.getLocale = () => lang;
  
  // Función de traducción
  req.__ = (key) => {
    try {
      return translations[lang]?.[key] || translations['es']?.[key] || key;
    } catch (e) {
      return key;
    }
  };
  
  // Pasar a res.locals para las vistas
  res.locals.lang = lang;
  res.locals.__ = req.__;
  res.locals.translations = translations[lang];
  
  next();
};

module.exports = i18nMiddleware;