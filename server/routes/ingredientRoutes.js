const express = require('express');
const router = express.Router();
const ingredientController = require('../controllers/ingredientController');
const verifyToken = require('../middleware/authMiddleware');
// const authorize = require('../middleware/roleMiddleware'); // Si se requiere restricción de rol

// Rutas públicas para obtener listas (usadas en el formulario)
router.get('/flavors', ingredientController.getFlavors);
router.get('/fillings', ingredientController.getFillings);

// Rutas protegidas para gestión (solo admin o usuarios autenticados según se prefiera)
// Por ahora usamos verifyToken para que al menos estén logueados
router.post('/flavors', verifyToken, ingredientController.addFlavor);
router.delete('/flavors/:id', verifyToken, ingredientController.deleteFlavor);

router.post('/fillings', verifyToken, ingredientController.addFilling);
router.delete('/fillings/:id', verifyToken, ingredientController.deleteFilling);

module.exports = router;
