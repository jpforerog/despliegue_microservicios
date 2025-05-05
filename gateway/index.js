const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');

const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cors());

app.use('/users', createProxyMiddleware({ target: 'http://localhost:4001', changeOrigin: true }));
app.use('/products', createProxyMiddleware({ target: 'http://localhost:4002', changeOrigin: true }));
app.use('/orders', createProxyMiddleware({ target: 'http://localhost:4003', changeOrigin: true }));

const port = process.env.PORT || 3000; 

app.listen(port, () => console.log('API Gateway running on port 4000'));
