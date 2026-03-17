const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    project: 'NNPTUD-C3-15-3-3',
    message: 'Inventory API is running',
  });
});

module.exports = router;
