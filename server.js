const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const redis = require('redis');
const https = require('https');

dotenv.config();

const app = express();

const redisclient = redis.createClient({
    url: process.env.REDIS_URI,
});

app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

const logger = winston.createLogger({
    level: 'info',
    transoprts: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    ],
});

const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later.",
});

app.use(limiter);

mongoose.connect(process.env.MONGODB_URI,{
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.log("MongoDB connection error", err);
});

redisclient.connect()
    .then(() => {
        console.log('Connected to Redis');
        redisclient.ping()
            .then(() => {
                console.log('Redis is responsive');
            }).catch((err) => {
                console.log('Failed to ping Redis', err);
            });
    }).catch((err) => {
        console.log('Redis connection error', err);
    });

const chatRoutes = require("./routes/chatRoutes");
app.use('/api', chatRoutes);

const privatekey = fs.readFileSync('./ssl/private.key', 'utf8');
const certificate = fs.readFileSync('./ssl/certificate.pem', 'utf8');
const credientials = { key: privatekey, cert: certificate };

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('costume bot is up and running');
});

https.createServer(credientials, app).listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});