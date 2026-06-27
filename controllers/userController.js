const Project = require('../models/Project');

exports.dashboard = async (req, res) => {
  try {
    const projects = await Project.getByUserId(req.session.user.id);
    res.render('dashboard_usuario', { projects });
  } catch (error) {
    console.error("Error al cargar proyectos del usuario: ", error);
    res.render('dashboard_usuario', { projects: [] });
  }
};
