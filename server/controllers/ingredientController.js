const { Flavor, Filling } = require('../models');

// Datos iniciales (quemados) para la migración
const INITIAL_FLAVORS = {
    normal: ['Vainilla', 'Chocolate', 'Red Velvet', 'Mantequilla', 'Nata', 'Queso', '3 Leches', 'Pastel de queso', 'Queso/Flan', 'Zanahoria', 'Mil Hojas', 'Flan'],
    tier: ['Vainilla', 'Chocolate', 'Red Velvet', 'Mantequilla', 'Nata', 'Queso', 'Flan']
};

const INITIAL_FILLINGS = {
    incluidos: {
        'Manjar': ['Nuez', 'Coco', 'Almendra', 'Cajeta'],
        'Cajeta': ['Nuez', 'Coco', 'Oreo'],
        'Chantilly': ['Duraznos', 'Fresas', 'Piña'],
        'Mermelada': ['Fresa', 'Zarzamora', 'Piña', 'Chabacano'],
        'Crema de Queso': ['Cajeta', 'Envinada']
    },
    conCosto: {
        'Nutella': ['Nuez', 'Almendra'],
        'Dulce de Leche': ['Nuez', 'Almendra', 'Envinada'],
        'Nuez': ['Capuchino', 'Mocka', 'Chocolate'],
        'Cremas': ['Yogurth de fresa', 'Café con o sin brandy'],
        'Duraznos': ['Rompope', 'Crema de Yogurth', 'Chantilly']
    }
};

const ingredientController = {
    // --- SEEDING ---
    seedIngredients: async () => {
        try {
            const flavorCount = await Flavor.count();
            if (flavorCount === 0) {
                console.log('Seeding Flavors...');
                const flavorsMap = new Map();

                // Procesar normales
                INITIAL_FLAVORS.normal.forEach(name => {
                    flavorsMap.set(name, { name, isNormal: true, isTier: false });
                });

                // Procesar tiers (actualizar existentes o crear nuevos)
                INITIAL_FLAVORS.tier.forEach(name => {
                    if (flavorsMap.has(name)) {
                        flavorsMap.get(name).isTier = true;
                    } else {
                        flavorsMap.set(name, { name, isNormal: false, isTier: true });
                    }
                });

                await Flavor.bulkCreate(Array.from(flavorsMap.values()));
                console.log('Flavors seeded.');
            }

            const fillingCount = await Filling.count();
            if (fillingCount === 0) {
                console.log('Seeding Fillings...');
                const fillings = [];

                // Incluidos
                for (const [name, subs] of Object.entries(INITIAL_FILLINGS.incluidos)) {
                    fillings.push({ name, isPaid: false, suboptions: subs });
                }

                // Con Costo
                for (const [name, subs] of Object.entries(INITIAL_FILLINGS.conCosto)) {
                    fillings.push({ name, isPaid: true, suboptions: subs });
                }

                await Filling.bulkCreate(fillings);
                console.log('Fillings seeded.');
            }
        } catch (error) {
            console.error('Error seeding ingredients:', error);
        }
    },

    // --- FLAVORS ---
    getFlavors: async (req, res) => {
        try {
            const flavors = await Flavor.findAll({ order: [['name', 'ASC']] });
            res.json(flavors);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    addFlavor: async (req, res) => {
        try {
            const { name, isNormal, isTier } = req.body;
            const newFlavor = await Flavor.create({ name, isNormal, isTier });
            res.json(newFlavor);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    deleteFlavor: async (req, res) => {
        try {
            const { id } = req.params;
            await Flavor.destroy({ where: { id } });
            res.json({ message: 'Sabor eliminado' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // --- FILLINGS ---
    getFillings: async (req, res) => {
        try {
            const fillings = await Filling.findAll({ order: [['name', 'ASC']] });
            res.json(fillings);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    addFilling: async (req, res) => {
        try {
            const { name, isPaid, suboptions } = req.body;
            // Parse suboptions if sent as string (from simple form input)
            let parsedSubs = suboptions;
            if (typeof suboptions === 'string') {
                parsedSubs = suboptions.split(',').map(s => s.trim()).filter(s => s);
            }

            const newFilling = await Filling.create({ name, isPaid, suboptions: parsedSubs });
            res.json(newFilling);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    deleteFilling: async (req, res) => {
        try {
            const { id } = req.params;
            await Filling.destroy({ where: { id } });
            res.json({ message: 'Relleno eliminado' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = ingredientController;
