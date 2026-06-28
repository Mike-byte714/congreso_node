const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cookieParser = require('cookie-parser');
const i18n = require('i18n');
const path = require('path');
require('dotenv').config();

const app = express();

// ==========================================
// Importar conexión a la base de datos
// ==========================================
const pool = require('./config/db');

// ==========================================
// Configuración de Internacionalización (i18n)
// ==========================================
i18n.configure({
  locales: ['es', 'en', 'zh'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'es',
  cookie: 'lang',
  queryParameter: 'lang',
  autoReload: true,
  updateFiles: false,
  objectNotation: true
});

// ==========================================
// Middlewares Globales
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ⚠️ IMPORTANTE: i18n.init debe ir ANTES de las rutas
app.use(i18n.init);

// ==========================================
// Configuración de Sesiones con MySQL Store
// ==========================================
const sessionStore = new MySQLStore({
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions'
  }
}, pool);

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_fallback',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 // 24 horas
  }
}));

// ==========================================
// Middleware para pasar variables globales a las vistas
// ==========================================
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.lang = req.getLocale ? req.getLocale() : 'es';
  res.locals.success_msg = req.session.success_msg || null;
  res.locals.error_msg = req.session.error_msg || null;
  res.locals.__ = req.i18n ? req.i18n.__ : (key) => key;
  
  // Limpiar mensajes flash después de pasarlos a la vista
  delete req.session.success_msg;
  delete req.session.error_msg;
  
  next();
});

// ==========================================
// Configuración de Vistas (EJS) y Estáticos
// ==========================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// Rutas
// ==========================================
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const projectRoutes = require('./routes/project');
const adminRoutes = require('./routes/admin');

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/dashboard', userRoutes);
app.use('/project', projectRoutes);
app.use('/admin', adminRoutes);

// ==========================================
// Manejo de errores 404 (Página no encontrada)
// ==========================================
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Página no encontrada',
    __: req.i18n ? req.i18n.__ : (key) => key
  });
});

// ==========================================
// Manejo de errores globales
// ==========================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
  
  res.status(err.status || 500).render('error', {
    title: 'Error del servidor',
    message: err.message || 'Ha ocurrido un error inesperado',
    __: req.i18n ? req.i18n.__ : (key) => key
  });
});

// ==========================================
// Iniciar Servidor
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});