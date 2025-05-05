const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Se refiere a la colección de Usuarios
        required: true
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product', // Se refiere a la colección de Productos
                required: true
            },
            name: String, // Guardamos el nombre del producto en la orden
            price: Number, // Precio del producto en el momento de la compra
            quantity: {
                type: Number,
                required: true,
                min: 1
            }
        }
    ],
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    }
}, { timestamps: true }); // 📌 timestamps agrega createdAt y updatedAt automáticamente

module.exports = mongoose.model('Order', OrderSchema);
