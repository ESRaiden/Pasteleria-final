// --- CONFIGURACIÓN DE ENTORNO ---
// Carga las variables de entorno desde el archivo .env al inicio de la aplicación
require('dotenv').config();

// --- IMPORTACIÓN DE MÓDULOS ---
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./server/models');
const { conectarDB } = require('./server/config/database');

// --- IMPORTACIÓN DE RUTAS ---
const authRoutes = require('./server/routes/authRoutes');
const folioRoutes = require('./server/routes/folioRoutes');
const userRoutes = require('./server/routes/userRoutes');
const clientRoutes = require('./server/routes/clientRoutes');
const whatsappRoutes = require('./server/routes/whatsappRoutes'); // <-- RUTA NUEVA
const aiSessionRoutes = require('./server/routes/aiSessionRoutes');
const testRoutes = require('./server/routes/testRoutes');
const dictationRoutes = require('./server/routes/dictationRoutes');
const ingredientRoutes = require('./server/routes/ingredientRoutes');
const ingredientController = require('./server/controllers/ingredientController');

// --- TAREAS PROGRAMADAS ---
// Esta línea importa e inicia las tareas programadas (como el envío de correos)
require('./server/cronJobs');

// --- CONFIGURACIÓN DE LA APLICACIÓN ---
const app = express();
const PORT = process.env.PORT || 3000; // Usa el puerto del entorno o 3000 por defecto

// Conectar a la base de datos
conectarDB();

// --- MIDDLEWARES ---
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Servir archivos estáticos de la carpeta 'uploads' de forma pública
// Esto es necesario para que el PDF y el frontend puedan encontrar las imágenes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.static(__dirname));

// --- RUTAS DE LA API ---
app.get('/', (req, res) => {
  res.json({ message: '¡API de la Pastelería La Fiesta funcionando!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/folios', folioRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/webhooks', whatsappRoutes); // <-- USANDO LA NUEVA RUTA
app.use('/api/ai-sessions', aiSessionRoutes);
app.use('/api/test', testRoutes);
app.use('/api/dictation', dictationRoutes);

app.use('/api/ingredients', ingredientRoutes);

// --- INICIO DEL SERVIDOR ---
sequelize.sync({ force: false }).then(async () => {
  console.log('🔄 Modelos sincronizados con la base de datos.');
  await ingredientController.seedIngredients();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('❌ Error al sincronizar con la base de datos:', error);
});