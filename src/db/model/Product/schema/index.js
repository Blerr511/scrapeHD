const { Schema } = require('mongoose');

const ProductSchema = new Schema(
    {
        model: { type: String, unique: true },
        price: Number,
    },
    {
        timestamps: {
            updatedAt: true,
            createdAt: true,
        },
    }
);

module.exports = ProductSchema;
