const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const mailer = require('../utils/mailer');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      req.session.error_msg = req.__('Please fill all fields');
      return res.redirect('/acceso');
    }

    // Admin hardcoded login
    if (username === 'onlymike2911@gmail.com' && password === 'admin123') {
      req.session.user = {
        id: 999,
        username: 'Admin',
        fullname: 'Admin',
        role: 'admin'
      };
      return res.redirect('/admin/dashboard');
    }

    const user = await User.findByUsername(username);

    if (user && await bcrypt.compare(password, user.password)) {
      if (user.is_verified === 0 && user.role !== 'admin') {
        req.session.error_msg = req.__('Debe verificar su correo electrónico antes de iniciar sesión.');
        return res.redirect('/acceso');
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        role: user.role
      };

      if (user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      } else {
        return res.redirect('/dashboard');
      }
    } else {
      req.session.error_msg = req.__('Usuario o contraseña incorrectos.');
      return res.redirect('/acceso');
    }
  } catch (error) {
    console.error(error);
    req.session.error_msg = 'Error en el servidor.';
    res.redirect('/acceso');
  }
};

exports.register = async (req, res) => {
  try {
    const { fullname, email, username, institution, country, password, confirm_password } = req.body;

    if (!fullname || !email || !username || !password) {
      req.session.error_msg = req.__('Por favor, complete los campos obligatorios.');
      return res.redirect('/acceso#registro');
    }

    if (password !== confirm_password) {
      req.session.error_msg = req.__('Las contraseñas no coinciden.');
      return res.redirect('/acceso#registro');
    }

    const existingUser = await User.findByUsername(username);
    const existingEmail = await User.findByEmail(email);

    if (existingUser || existingEmail) {
      req.session.error_msg = req.__('El nombre de usuario o correo ya está en uso.');
      return res.redirect('/acceso#registro');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

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

      req.session.success_msg = req.__('Cuenta creada. Por favor revisa tu correo electrónico para verificar tu cuenta.');
      res.redirect('/acceso');
    } else {
      req.session.error_msg = req.__('Error al crear la cuenta. Intente nuevamente.');
      res.redirect('/acceso#registro');
    }
  } catch (error) {
    console.error(error);
    req.session.error_msg = 'Error en el servidor.';
    res.redirect('/acceso#registro');
  }
};

exports.verify = async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) {
      req.session.error_msg = req.__('Enlace de verificación inválido.');
      return res.redirect('/acceso');
    }

    const user = await User.findByVerificationToken(token);
    if (user) {
      await User.verifyUser(user.id);

      const mensaje = `
        <h3>¡Bienvenido/a ${user.fullname}!</h3>
        <p>Tu cuenta ha sido verificada exitosamente.</p>
        <p>Ya puedes acceder a la plataforma para registrar tus proyectos y ver el programa del evento.</p>
        <p><a href='${process.env.SITE_URL}/acceso' style='background-color: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>Acceder a la plataforma</a></p>
      `;
      await mailer.sendEmail(user.email, "¡Bienvenido al Congreso TESCo 2026!", mensaje);

      req.session.success_msg = req.__('Tu cuenta ha sido verificada con éxito. Ya puedes iniciar sesión.');
    } else {
      req.session.error_msg = req.__('El enlace de verificación es inválido o ya ha expirado.');
    }
    res.redirect('/acceso');
  } catch (error) {
    console.error(error);
    req.session.error_msg = 'Error en el servidor.';
    res.redirect('/acceso');
  }
};

exports.googleCallback = async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
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

    let user = await User.findByGoogleId(googleId);
    if (!user) {
      user = await User.findByEmail(email);
    }

    if (user) {
      if (user.is_verified === 0) {
        await User.verifyUser(user.id);
      }
      req.session.user = {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        role: user.role
      };
      return res.redirect('/dashboard');
    } else {
      // Registrar nuevo usuario
      const username = email.split('@')[0] + Math.floor(Math.random() * 900 + 100);
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

      const mensaje = `<h3>¡Bienvenido/a ${fullname}!</h3><p>Te has registrado exitosamente con tu cuenta de Google.</p>`;
      await mailer.sendEmail(email, "¡Bienvenido al Congreso TESCo 2026!", mensaje);

      return res.redirect('/dashboard');
    }
  } catch (error) {
    console.error('Error verifying Google Token:', error);
    req.session.error_msg = 'Token de Google inválido o expirado.';
    res.redirect('/acceso');
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};