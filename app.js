const createError = require('http-errors');
const express = require('express');
const logger = require('morgan');
const mongoose = require('mongoose');

const indexRouter = require('./routes/index');
const productRouter = require('./routes/products');
const inventoryRouter = require('./routes/inventories');

const app = express();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/NNPTUD-C3-15-3-3';

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', indexRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/inventories', inventoryRouter);

mongoose.connect(MONGO_URI);
mongoose.connection.on('connected', () => {
  console.log(`Mongo connected: ${MONGO_URI}`);
});
mongoose.connection.on('disconnected', () => {
  console.log('Mongo disconnected');
});
mongoose.connection.on('error', (error) => {
  console.error('Mongo error:', error.message);
});

app.use((req, res, next) => {
  next(createError(404, 'Route not found'));
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
