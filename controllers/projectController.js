const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');
const Project = require('../models/Project');
const mailer = require('../utils/mailer');

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'project-' + req.session.user.id + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf' && ext !== '.doc' && ext !== '.docx') {
      return cb(new Error('Solo se permiten archivos PDF o Word.'));
    }
    cb(null, true);
  }
}).single('project_file');

exports.upload = (req, res, next) => {
  upload(req, res, function (err) {
    if (err) {
      req.session.error_msg = err.message || 'Error al subir el archivo.';
      return res.redirect('/dashboard');
    }
    next();
  });
};

exports.submit = async (req, res) => {
  try {
    const { title, authors, abstract, institution, country, area } = req.body;
    let filePath = null;

    if (req.file) {
      filePath = 'uploads/' + req.file.filename;
    } else {
      req.session.error_msg = req.i18n.__('Es obligatorio subir un archivo.');
      return res.redirect('/dashboard#nuevo');
    }

    const projectId = await Project.create({
      user_id: req.session.user.id,
      title,
      authors,
      abstract,
      area,
      institution,
      country,
      file_path: filePath
    });

    if (projectId) {
      const mensaje = `
        <h3>Hola ${req.session.user.fullname},</h3>
        <p>Hemos recibido correctamente tu trabajo titulado: <strong>${title}</strong>.</p>
        <p>Tu proyecto será revisado por el comité. Te notificaremos cualquier cambio de estado.</p>
      `;
      await mailer.sendEmail(req.session.user.email, "Recepción de trabajo - TESCo 2026", mensaje);

      req.session.success_msg = req.i18n.__('Proyecto enviado exitosamente.');
    } else {
      req.session.error_msg = req.i18n.__('Error al guardar el proyecto en la base de datos.');
    }
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    req.session.error_msg = 'Error en el servidor al enviar el proyecto.';
    res.redirect('/dashboard');
  }
};

exports.download = async (req, res) => {
  try {
    const project = await Project.getById(req.params.id);
    if (!project || (project.user_id !== req.session.user.id && req.session.user.role !== 'admin')) {
      return res.status(403).send('Acceso denegado');
    }
    
    const filePath = path.join(__dirname, '../public', project.file_path);
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).send('Archivo no encontrado');
    }
  } catch (error) {
    res.status(500).send('Error del servidor');
  }
};

exports.certificate = async (req, res) => {
  try {
    const project = await Project.getById(req.params.id);
    if (!project || project.user_id !== req.session.user.id || project.status !== 'aceptado') {
      return res.status(403).send('Acceso denegado o proyecto no aceptado');
    }

    // Generar PDF con pdf-lib (certificado simple)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([800, 600]);
    
    page.drawText('CONGRESO INTERNACIONAL TESCO 2026', { x: 100, y: 500, size: 24, color: rgb(0, 0.5, 0.5) });
    page.drawText('Certificado de Aceptación', { x: 250, y: 450, size: 20 });
    page.drawText(`Otorgado a: ${project.authors}`, { x: 100, y: 350, size: 16 });
    page.drawText(`Por el proyecto: ${project.title}`, { x: 100, y: 300, size: 14 });
    page.drawText(`Eje: ${project.area}`, { x: 100, y: 250, size: 14 });
    page.drawText('Firma del Comité Organizador', { x: 300, y: 150, size: 14 });
    
    const pdfBytes = await pdfDoc.save();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificado_${project.id}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generando certificado');
  }
};
