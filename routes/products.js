const express = require('express');
const mongoose = require('mongoose');

const Product = require('../schemas/products');
const Inventory = require('../schemas/inventories');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  let createdProduct;

  try {
    const { name, price, description } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'name is required' });
    }

    createdProduct = await Product.create({
      name: name.trim(),
      price,
      description,
    });

    const createdInventory = await Inventory.create({
      product: createdProduct._id,
    });

    const inventoryWithProduct = await Inventory.findById(createdInventory._id).populate('product');

    res.status(201).json({
      message: 'Product created and inventory initialized',
      product: createdProduct,
      inventory: inventoryWithProduct,
    });
  } catch (error) {
    if (createdProduct?._id) {
      await Product.findByIdAndDelete(createdProduct._id);
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Duplicate value detected',
        detail: error.keyValue,
      });
    }

    next(error);
  }
});

module.exports = router;
