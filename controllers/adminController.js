const User = require('../models/User');
const Project = require('../models/Project');

exports.dashboard = async (req, res) => {
  try {
    const totalUsers = await User.countAll();
    const stats = await Project.getStats();
    // Assuming Speaker model is not yet ported or omitted for simplicity
    res.render('admin/dashboard', { 
        totalUsers, 
        totalProjects: stats.total, 
        totalSpeakers: 6 
    });
  } catch (error) {
    res.render('admin/dashboard', { totalUsers: 0, totalProjects: 0, totalSpeakers: 0 });
  }
};

exports.projects = async (req, res) => {
  try {
    const projects = await Project.getAll();
    res.render('admin/proyectos', { projects });
  } catch (error) {
    res.render('admin/proyectos', { projects: [] });
  }
};

exports.updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_feedback } = req.body;
    await Project.updateStatus(id, status, admin_feedback);
    req.session.success_msg = 'Estado del proyecto actualizado.';
    res.redirect('/admin/proyectos');
  } catch (error) {
    req.session.error_msg = 'Error al actualizar el proyecto.';
    res.redirect('/admin/proyectos');
  }
};
