const { extractBearerToken, verifyAccessToken } = require('../services/jwtService');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    return res.status(401).json({ message: 'Token Bearer requerido' });
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado', details: error.message });
  }
}

// Opcional: Middleware para restringir rutas según el rol
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.auth || !req.auth.rol) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    
    const allowed = Array.isArray(roles) ? roles : [roles];
    const userRole = req.auth.rol.toLowerCase();
    const allowedLower = allowed.map(r => r.toLowerCase());
    if (!allowedLower.includes(userRole)) {
      return res.status(403).json({ message: 'Acceso prohibido para este rol' });
    }
    
    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
