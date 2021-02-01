const { model } = require('mongoose');
const ProductSchema = require('../schema');

const Product = model('product', ProductSchema);

module.exports = Product;
