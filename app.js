const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const i18n = require('i18n');
const path = require('path');
require('dotenv').config();

const app = express();

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
  objectNotation: true // Para usar anidación tipo "header.title"
});

// ==========================================
// Middlewares Globales
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(i18n.init);

// Configuración de Sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_fallback',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } // 24 horas
}));

// Pasar variables globales a todas las vistas EJS
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.lang = req.getLocale();
  res.locals.success_msg = req.session.success_msg;
  res.locals.error_msg = req.session.error_msg;
  
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
// Iniciar Servidor
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
