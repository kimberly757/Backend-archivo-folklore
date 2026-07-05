const { Notificaciones } = require('../models');

// Notificaciones del usuario autenticado, más recientes primero.
exports.getAll = async (req, res, next) => {
  try {
    const notificaciones = await Notificaciones.findAll({
      where: { id_usuario: req.auth.id_usuario },
      order: [['fecha_creacion', 'DESC']],
    });
    res.json(notificaciones);
  } catch (err) {
    next(err);
  }
};

// Marca como leídas TODAS las notificaciones pendientes del usuario autenticado.
exports.marcarLeidas = async (req, res, next) => {
  try {
    await Notificaciones.update(
      { leida: true },
      { where: { id_usuario: req.auth.id_usuario, leida: false } }
    );
    res.json({ message: 'Notificaciones marcadas como leídas.' });
  } catch (err) {
    next(err);
  }
};

// Marca una notificación individual como leída (solo si pertenece al usuario autenticado).
exports.marcarUnaLeida = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [updated] = await Notificaciones.update(
      { leida: true },
      { where: { id_notificacion: id, id_usuario: req.auth.id_usuario, leida: false } }
    );
    if (updated === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada o ya estaba leída.' });
    }
    res.json({ message: 'Notificación marcada como leída.' });
  } catch (err) {
    next(err);
  }
};
