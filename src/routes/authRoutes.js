const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { validateZod } = require('../middlewares/validateZod');
const {
  authRegisterSchema,
  authLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} = require('../validators/domainSchemas');

router.post('/register', validateZod({ body: authRegisterSchema }), authController.register);
router.post('/login', validateZod({ body: authLoginSchema }), authController.login);
router.get('/verify', authController.verifyToken);

// Recuperación de contraseña con token real (BD) + enlace por correo vía EmailJS.
// '/forgot-password' queda como endpoint legado (generaba la clave directamente, sin
// plantilla de correo disponible en ese momento) — ya no lo usa el frontend, se deja
// sin borrar por si algo más lo invoca todavía.
router.post('/forgot-password', validateZod({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/olvide-password', validateZod({ body: forgotPasswordSchema }), authController.olvidePassword);
router.post('/reset-password', validateZod({ body: resetPasswordSchema }), authController.resetPassword);

// Rutas protegidas por autenticación
router.get('/profile', requireAuth, authController.getProfile);
router.put('/profile', requireAuth, validateZod({ body: updateProfileSchema }), authController.updateProfile);
router.post('/change-password', requireAuth, validateZod({ body: changePasswordSchema }), authController.changePassword);
router.post('/verify-password', requireAuth, authController.verifyPasswordOnly);

module.exports = { path: '/auth', router };
