const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const mailer = require('../utils/mailer');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ==========================================
// LOGIN
// ==========================================
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔍 [LOGIN] Intento de login:', { username, password: '***' });

    if (!username || !password) {
      console.log('⚠️ [LOGIN] Campos vacíos');
      req.session.error_msg = req.__('Please fill all fields');
      return res.redirect('/acceso');
    }

    // Admin hardcoded login
    if (username === 'onlymike2911@gmail.com' && password === 'admin123') {
      console.log('✅ [LOGIN] Admin hardcoded logueado');
      req.session.user = {
        id: 999,
        username: 'Admin',
        fullname: 'Admin',
        role: 'admin'
      };
      console.log('👤 [LOGIN] Sesión creada:', req.session.user);
      console.log('➡️ [LOGIN] Redirigiendo a /admin/dashboard');
      return res.redirect('/admin/dashboard');
    }

    // Buscar en la base de datos
    console.log('🔍 [LOGIN] Buscando usuario en BD:', username);
    const user = await User.findByUsername(username);
    
    if (!user) {
      console.log('❌ [LOGIN] Usuario no encontrado en BD');
      req.session.error_msg = req.__('Usuario o contraseña incorrectos.');
      return res.redirect('/acceso');
    }
    
    console.log('✅ [LOGIN] Usuario encontrado:', user.username, 'Rol:', user.role);

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔐 [LOGIN] ¿Contraseña válida?', isPasswordValid);

    if (user && isPasswordValid) {
      console.log('✅ [LOGIN] Contraseña válida');
      
      // Verificar si el usuario está verificado
      if (user.is_verified === 0 && user.role !== 'admin') {
        console.log('⚠️ [LOGIN] Usuario no verificado');
        req.session.error_msg = req.__('Debe verificar su correo electrónico antes de iniciar sesión.');
        return res.redirect('/acceso');
      }

      // Crear sesión
      req.session.user = {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        role: user.role
      };
      
      console.log('👤 [LOGIN] Sesión creada:', req.session.user);
      
      // Redirigir según rol
      if (user.role === 'admin') {
        console.log('➡️ [LOGIN] Redirigiendo a /admin/dashboard');
        return res.redirect('/admin/dashboard');
      } else {
        console.log('➡️ [LOGIN] Redirigiendo a /dashboard');
        return res.redirect('/dashboard');
      }
    } else {
      console.log('❌ [LOGIN] Credenciales inválidas');
      req.session.error_msg = req.__('Usuario o contraseña incorrectos.');
      return res.redirect('/acceso');
    }
  } catch (error) {
    console.error('❌ [LOGIN] Error:', error);
    req.session.error_msg = 'Error en el servidor.';
    res.redirect('/acceso');
  }
};

// ==========================================
// REGISTER
// ==========================================
exports.register = async (req, res) => {
  try {
    const { fullname, email, username, institution, country, password, confirm_password } = req.body;

    console.log('🔍 [REGISTER] Intento de registro:', { fullname, email, username, institution, country, password: '***' });

    if (!fullname || !email || !username || !password) {
      console.log('⚠️ [REGISTER] Campos obligatorios vacíos');
      req.session.error_msg = req.__('Por favor, complete los campos obligatorios.');
      return res.redirect('/acceso#registro');
    }

    if (password !== confirm_password) {
      console.log('⚠️ [REGISTER] Contraseñas no coinciden');
      req.session.error_msg = req.__('Las contraseñas no coinciden.');
      return res.redirect('/acceso#registro');
    }

    // Verificar si el usuario o email ya existen
    console.log('🔍 [REGISTER] Verificando si usuario existe...');
    const existingUser = await User.findByUsername(username);
    const existingEmail = await User.findByEmail(email);

    if (existingUser) {
      console.log('⚠️ [REGISTER] Usuario ya existe:', username);
      req.session.error_msg = req.__('El nombre de usuario o correo ya está en uso.');
      return res.redirect('/acceso#registro');
    }

    if (existingEmail) {
      console.log('⚠️ [REGISTER] Email ya existe:', email);
      req.session.error_msg = req.__('El nombre de usuario o correo ya está en uso.');
      return res.redirect('/acceso#registro');
    }

    // Hash de la contraseña
    console.log('🔐 [REGISTER] Hasheando contraseña...');
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Crear usuario
    console.log('🔍 [REGISTER] Creando usuario...');
    const newUserId = await User.create({
      username,
      fullname,
      email,
      password: hashedPassword,
      institution,
      country,
      role: 'assistant',
      is_verified: 0,
      verification_token: verificationToken
    });

    if (newUserId) {
      console.log('✅ [REGISTER] Usuario creado ID:', newUserId);
      
      // Enviar email de verificación
      try {
        const verifyLink = `${process.env.SITE_URL}/auth/verify?token=${verificationToken}`;
        const mensaje = `
          <h3>¡Hola ${fullname}!</h3>
          <p>Gracias por registrarte en el Congreso Internacional de Ingeniería Industrial TESCo 2026.</p>
          <p>Para activar tu cuenta, por favor haz clic en el siguiente enlace:</p>
          <p><a href='${verifyLink}' style='background-color: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>Verificar mi cuenta</a></p>
          <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p>${verifyLink}</p>
        `;
        await mailer.sendEmail(email, "Verifica tu cuenta - Congreso TESCo 2026", mensaje);
        console.log('✅ [REGISTER] Email de verificación enviado');
      } catch (emailError) {
        console.error('❌ [REGISTER] Error al enviar email:', emailError.message);
      }

      req.session.success_msg = req.__('Cuenta creada. Por favor revisa tu correo electrónico para verificar tu cuenta.');
      console.log('➡️ [REGISTER] Redirigiendo a /acceso');
      res.redirect('/acceso');
    } else {
      console.log('❌ [REGISTER] Error al crear usuario');
      req.session.error_msg = req.__('Error al crear la cuenta. Intente nuevamente.');
      res.redirect('/acceso#registro');
    }
  } catch (error) {
    console.error('❌ [REGISTER] Error:', error);
    req.session.error_msg = 'Error en el servidor.';
    res.redirect('/acceso#registro');
  }
};

// ==========================================
// VERIFICACIÓN DE CORREO
// ==========================================
exports.verify = async (req, res) => {
  try {
    const token = req.query.token;
    console.log('🔍 [VERIFY] Token recibido:', token);

    if (!token) {
      console.log('⚠️ [VERIFY] Token vacío');
      req.session.error_msg = req.__('Enlace de verificación inválido.');
      return res.redirect('/acceso');
    }

    const user = await User.findByVerificationToken(token);
    
    if (user) {
      console.log('✅ [VERIFY] Usuario encontrado:', user.username);
      await User.verifyUser(user.id);
      console.log('✅ [VERIFY] Usuario verificado');

      const mensaje = `
        <h3>¡Bienvenido/a ${user.fullname}!</h3>
        <p>Tu cuenta ha sido verificada exitosamente.</p>
        <p>Ya puedes acceder a la plataforma para registrar tus proyectos y ver el programa del evento.</p>
        <p><a href='${process.env.SITE_URL}/acceso' style='background-color: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>Acceder a la plataforma</a></p>
      `;
      await mailer.sendEmail(user.email, "¡Bienvenido al Congreso TESCo 2026!", mensaje);

      req.session.success_msg = req.__('Tu cuenta ha sido verificada con éxito. Ya puedes iniciar sesión.');
    } else {
      console.log('❌ [VERIFY] Token inválido o expirado');
      req.session.error_msg = req.__('El enlace de verificación es inválido o ya ha expirado.');
    }
    res.redirect('/acceso');
  } catch (error) {
    console.error('❌ [VERIFY] Error:', error);
    req.session.error_msg = 'Error en el servidor.';
    res.redirect('/acceso');
  }
};

// ==========================================
// GOOGLE CALLBACK
// ==========================================
exports.googleCallback = async (req, res) => {
  try {
    const { credential } = req.body;
    console.log('🔍 [GOOGLE] Credencial recibida');

    if (!credential) {
      console.log('⚠️ [GOOGLE] No se recibió credencial');
      req.session.error_msg = 'No se recibió credencial de Google.';
      return res.redirect('/acceso');
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const googleId = payload['sub'];
    const email = payload['email'];
    const fullname = payload['name'];
    console.log('👤 [GOOGLE] Usuario Google:', { googleId, email, fullname });

    let user = await User.findByGoogleId(googleId);
    if (!user) {
      user = await User.findByEmail(email);
    }

    if (user) {
      console.log('✅ [GOOGLE] Usuario existente:', user.username);
      if (user.is_verified === 0) {
        await User.verifyUser(user.id);
        console.log('✅ [GOOGLE] Usuario verificado');
      }
      
      req.session.user = {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        role: user.role
      };
      console.log('👤 [GOOGLE] Sesión creada');
      return res.redirect('/dashboard');
    } else {
      // Crear nuevo usuario
      const username = email.split('@')[0] + Math.floor(Math.random() * 900 + 100);
      console.log('🆕 [GOOGLE] Creando nuevo usuario:', username);
      
      const newUserId = await User.create({
        username,
        fullname,
        email,
        password: '',
        google_id: googleId,
        role: 'assistant',
        is_verified: 1
      });

      req.session.user = {
        id: newUserId,
        username,
        fullname,
        role: 'assistant'
      };

      console.log('👤 [GOOGLE] Sesión creada para nuevo usuario');
      return res.redirect('/dashboard');
    }
  } catch (error) {
    console.error('❌ [GOOGLE] Error:', error);
    req.session.error_msg = 'Token de Google inválido o expirado.';
    res.redirect('/acceso');
  }
};

// ==========================================
// LOGOUT
// ==========================================
exports.logout = (req, res) => {
  console.log('👋 [LOGOUT] Cerrando sesión');
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ [LOGOUT] Error al destruir sesión:', err);
    } else {
      console.log('✅ [LOGOUT] Sesión destruida');
    }
    res.redirect('/');
  });
};