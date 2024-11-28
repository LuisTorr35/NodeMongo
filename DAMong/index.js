var express = require('express');
var mongoose = require('mongoose');
const jwt = require('jsonwebtoken')
const app = express();
require("dotenv").config();

app.use(express.json());


async function main() {
    await mongoose.connect(process.env.DB_CONNECTION_STRING);
    console.log("Conectado a monguito");
}
main().catch(console.error);

const UsuarioSchema = new mongoose.Schema({
    name: String,
    id: { type: String, unique: true },
    password: String,
});

const Usuario = mongoose.model('usuarios', UsuarioSchema);

const ProductoSchema = new mongoose.Schema({
    id: String,
    name: String,
    price: Number,
    description: String,
})

const Producto = mongoose.model('productos', ProductoSchema);

const CompraSchema = new mongoose.Schema({
    userId: String,
    productId: String,
    quantity: Number,
    totalPrice: Number,
});

const Compra = mongoose.model('compras', CompraSchema);

app.post('/api/registro', async (req, res) =>{
    const { name, id, password } = req.body;
    console.log(req.body);
    try {
        const existingUser = await Usuario.findOne({ id });
        if (existingUser) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }
        const user = new Usuario({ name, id, password});
        user.save();
        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    }catch (error) {
        res.status(500).json({ message: 'Error al registrar usuario', error });
    }
});

app.post('/api/login', async (req, res) => {
    const { id, password } = req.body;
    console.log(req.body);
    try{
        const user = await Usuario.findOne({ id });
        if (!user) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }
        if (password !== user.password) {
            return res.status(400).json({ message: 'Contraseña incorrecta' });
        }
        const token = jwt.sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error });
    }
});



app.get('/api/products', verifytoken, async (req, res) => {
    try {
        const products = await Producto.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los productos', error });
    }
});

app.get('/api/purchases', verifytoken, async (req, res) => {
    console.log(req.body);
    try {
        const purchases = await Compra.find({ userId: req.body.id });
        res.json(purchases);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las compras', error });
    }
});

function verifytoken(req,res,next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined'){
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    }else{
        res.sendStatus(403)
    }
}

app.listen(3200, () => console.log("Servidor en puerto 3200"));
