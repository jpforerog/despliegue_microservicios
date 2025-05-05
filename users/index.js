const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(express.json());
app.use(cors());

// lee la URI de la base de datos desde las env vars
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



app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({ 
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword 
        });
        if (user?.name && user.name.trim() !== "") {
            await user.save();
            res.json({ message: 'User registered' }); 
          }else{
            res.status(400).json({error:'Name can not be blank'})
          }
        
    } catch (err) {

        res.status(500).json({ error: 'Error registering user' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email }); // Buscar por email en lugar de username
        if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
            return res.status(401).send('Invalid credentials');
        }
        const token = jwt.sign({ userId: user._id }, 'secretkey', { expiresIn: '1h' }); // Token con expiración
        res.json({ token });
    } catch (err) {
        res.status(500).send('Error logging in');
    }
});

app.get('/:id', async (req, res) => {
    
    try {
        const user = await User.findById(req.params.id).select('name email');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching user', details: err.message });
    }
});
app.post('/nombreUsuario',async (req,res)=> {
    console.log('entra')
    try{
        console.log(req.body.email)
        const user = await User.findOne({ email: req.body.email }).select('name');
        if (!user) return res.status(404).json({error: 'User not found'});
        console.log(user)
        console.log(user.name)
        res.json(user.name)
    }catch(err){
        res.status(500).json({error:'error fetching user',details:err.message})
    }
});



const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`User Service running on port ${port}`));
