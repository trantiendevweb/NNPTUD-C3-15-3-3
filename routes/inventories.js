const express = require('express');
const mongoose = require('mongoose');

const Inventory = require('../schemas/inventories');

const router = express.Router();

function parseQuantity(value) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return null;
  }
  return quantity;
}

function validateInput(res, product, quantity) {
  if (!mongoose.Types.ObjectId.isValid(product)) {
    res.status(400).json({ message: 'Invalid product id' });
    return null;
  }

  const validQuantity = parseQuantity(quantity);
  if (!validQuantity) {
    res.status(400).json({ message: 'quantity must be > 0' });
    return null;
  }

  return validQuantity;
}

async function classifyUpdateError(res, productId, notEnoughMessage) {
  const existing = await Inventory.findOne({ product: productId });
  if (!existing) {
    res.status(404).json({ message: 'Inventory not found for this product' });
    return;
  }
  res.status(400).json({ message: notEnoughMessage });
}

router.get('/', async (req, res, next) => {
  try {
    const inventories = await Inventory.find().populate('product').sort({ createdAt: -1 });
    res.json(inventories);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid inventory id' });
    }

    const inventory = await Inventory.findById(req.params.id).populate('product');
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }
    res.json(inventory);
  } catch (error) {
    next(error);
  }
});

const addStockHandler = async (req, res, next) => {
  try {
    const { product, quantity } = req.body;
    const validQuantity = validateInput(res, product, quantity);
    if (!validQuantity) {
      return;
    }

    const updated = await Inventory.findOneAndUpdate(
      { product },
      { $inc: { stock: validQuantity } },
      { new: true, runValidators: true }
    ).populate('product');

    if (!updated) {
      return res.status(404).json({ message: 'Inventory not found for this product' });
    }

    res.json({
      message: 'Stock increased successfully',
      inventory: updated,
    });
  } catch (error) {
    next(error);
  }
};

const removeStockHandler = async (req, res, next) => {
  try {
    const { product, quantity } = req.body;
    const validQuantity = validateInput(res, product, quantity);
    if (!validQuantity) {
      return;
    }

    const updated = await Inventory.findOneAndUpdate(
      { product, stock: { $gte: validQuantity } },
      { $inc: { stock: -validQuantity } },
      { new: true, runValidators: true }
    ).populate('product');

    if (!updated) {
      await classifyUpdateError(res, product, 'Not enough stock to remove');
      return;
    }

    res.json({
      message: 'Stock decreased successfully',
      inventory: updated,
    });
  } catch (error) {
    next(error);
  }
};

const reservationHandler = async (req, res, next) => {
  try {
    const { product, quantity } = req.body;
    const validQuantity = validateInput(res, product, quantity);
    if (!validQuantity) {
      return;
    }

    const updated = await Inventory.findOneAndUpdate(
      { product, stock: { $gte: validQuantity } },
      { $inc: { stock: -validQuantity, reserved: validQuantity } },
      { new: true, runValidators: true }
    ).populate('product');

    if (!updated) {
      await classifyUpdateError(res, product, 'Not enough stock to reserve');
      return;
    }

    res.json({
      message: 'Reservation successful',
      inventory: updated,
    });
  } catch (error) {
    next(error);
  }
};

const soldHandler = async (req, res, next) => {
  try {
    const { product, quantity } = req.body;
    const validQuantity = validateInput(res, product, quantity);
    if (!validQuantity) {
      return;
    }

    const updated = await Inventory.findOneAndUpdate(
      { product, reserved: { $gte: validQuantity } },
      { $inc: { reserved: -validQuantity, soldCount: validQuantity } },
      { new: true, runValidators: true }
    ).populate('product');

    if (!updated) {
      await classifyUpdateError(res, product, 'Not enough reserved quantity to sell');
      return;
    }

    res.json({
      message: 'Sold updated successfully',
      inventory: updated,
    });
  } catch (error) {
    next(error);
  }
};

router.post('/add-stock', addStockHandler);
router.post('/add_stock', addStockHandler);
router.post('/remove-stock', removeStockHandler);
router.post('/remove_stock', removeStockHandler);
router.post('/reservation', reservationHandler);
router.post('/sold', soldHandler);

module.exports = router;
