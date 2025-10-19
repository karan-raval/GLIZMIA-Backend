const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        discountPrice: { type: Number, min: 0, default: 0 },
        imageUrl: { type: String, default: '' },
        // Optional inline image storage
        image: {
            data: Buffer,
            contentType: String
        },
        description: { type: String, default: '' },
        stock: { type: Number, default: 0, min: 0 }
    },
    { timestamps: true }
)

module.exports = mongoose.model('Product', productSchema)


