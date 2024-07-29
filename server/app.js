const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const connectDB = require("./db");
const app = express();
const server = http.createServer(app);
const UserRoutes = require("./Routes/UserRoutes");
const productRoutes = require('./Routes/ProductRoutes')

const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
  };

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use((req, res, next) => {	// <- Serves req time and cookies
	
	req.requestTime = new Date().toISOString();
	if (req.cookies) console.log(req.cookies);
	next();
});

app.use((req, res, next) => {
	res.setHeader('Content-Type', 'application/json');
	next();
});

app.use(express.json({ limit: '100mb' })); // <- Parses Json data
app.use(express.urlencoded({ extended: true, limit: '100mb' })); // <- Parses URLencoded data

app.use(bodyParser.json());
app.use(cookieParser());



connectDB();


app.use('/api/users', UserRoutes);
app.use('/api/products', productRoutes)
module.exports = app;