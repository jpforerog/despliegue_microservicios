const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Product = require('./models/Product'); // Importar el modelo de producto
require('dotenv').config();
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cors());

// Conexión a MongoDB
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI no definido');
  process.exit(1);
}

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Conectado a MongoDB Atlas'))
.catch(err => {
  console.error('❌ Error al conectar MongoDB:', err);
  process.exit(1);
});


// Middleware de autenticación con JWT
const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send({ error: "Token required" });

    try {
        const decoded = jwt.verify(token.split(' ')[1], 'secretkey'); // Extraer token
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).send({ error: "Invalid token" });
    }
};

// **Crear un Producto (POST)**
app.post('/', authenticate, async (req, res) => {
    try {
        const { name, price } = req.body;

        if (!name || !price) {
            return res.status(400).json({ error: "Missing name or price" });
        }

        const product = new Product({ name, price });
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        res.status(500).json({ error: "Server error", details: err.message });
    }
});

// **Obtener todos los Productos (GET)**
app.get('/', authenticate, async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Server error", details: err.message });
    }
});
app.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching product', details: err.message });
    }
});

// **Iniciar servidor en el puerto 4002**


const port = process.env.PORT || 3002;
app.listen(port, () => console.log(`Product Service running on port ${port}`));
