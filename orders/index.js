const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // 📌 Para comunicarse con otros microservicios
const Order = require('./models/Order');

const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/orders', { 
    useNewUrlParser: true,
    useUnifiedTopology: true 
});

// 📌 Middleware de autenticación
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Token required' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Invalid token format' });

    try {
        const decoded = jwt.verify(token, 'secretkey');
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid token' });
    }
};

app.post('/', authenticate, async (req, res) => {
    try {
        const { userId, products } = req.body;

        // 📌 Verificar que el usuario existe en el microservicio de usuarios
        const userResponse = await axios.get(`http://localhost:4001/${userId}`);
        if (!userResponse.data) {
            return res.status(400).json({ error: 'Invalid user' });
        }

        // 📌 Verificar que los productos existen en el microservicio de productos
        const productPromises = products.map(async (p) => {
            try {
                const productResponse = await axios.get(`http://localhost:4002/${p.productId}`);
                return productResponse.data ? { ...productResponse.data, quantity: p.quantity } : null;
            } catch (error) {
                return null; // Si falla la consulta del producto, se marca como inválido
            }
        });

        const productList = await Promise.all(productPromises);
        
        if (productList.includes(null)) {
            return res.status(400).json({ error: 'One or more products are invalid' });
        }

        // 📌 Calcular total automáticamente
        const total = productList.reduce((acc, p) => acc + (p.price * p.quantity), 0);

        // 📌 Guardar la orden
        const newOrder = new Order({
            userId,
            products: productList.map(p => ({
                productId: p._id,
                name: p.name,
                price: p.price,
                quantity: p.quantity
            })),
            total // Total calculado
        });

        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(500).json({ error: 'Error creating order', details: err.message });
    }
});


// 📌 Obtener pedidos con información de usuario y productos
app.get('/', authenticate, async (req, res) => {
    try {
        const orders = await Order.find();

        // 📌 Obtener información del usuario
        const userResponses = await axios.get(`http://localhost:4001/${req.userId}`);

        // 📌 Agregar los datos del usuario a la orden
        const ordersWithUser = orders.map(order => ({
            ...order.toObject(),
            user: userResponses.data || null
        }));

        res.json(ordersWithUser);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching orders', details: err.message });
    }
});


const port = process.env.PORT || 3003;

app.listen(port, () => console.log('Order Service running on port 4003'));
