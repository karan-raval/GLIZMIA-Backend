const express = require('express')
const Product = require('../Model/Product')

const adminRouter = express.Router()

// Simple health/status endpoint to verify backend connectivity
adminRouter.get('/admin/health', (req, res) => {
    res.status(200).json({ ok: true, service: 'admin', timestamp: Date.now() })
})

// Products CRUD under /admin/products
adminRouter.get('/admin/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 })
        res.json(products)
    } catch (e) {
        res.status(500).json({ message: 'Failed to fetch products' })
    }
})

adminRouter.post('/admin/products', async (req, res) => {
    try {
        const { name, price, discountPrice, imageUrl, imageBase64, imageContentType, description, stock } = req.body
        const doc = { name, price, discountPrice, imageUrl, description, stock }
        // Backend validation: require all fields and at least one image source
        if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ message: 'Name is required' })
        if (!(typeof price === 'number') || price <= 0) return res.status(400).json({ message: 'Price must be > 0' })
        if (!(typeof discountPrice === 'number') || discountPrice < 0) return res.status(400).json({ message: 'Discount price is required (0 or more)' })
        if (discountPrice >= price) return res.status(400).json({ message: 'Discount price must be less than price' })
        if (!description || !String(description).trim()) return res.status(400).json({ message: 'Description is required' })
        if (!(typeof stock === 'number') || stock < 0) return res.status(400).json({ message: 'Stock must be 0 or more' })
        const hasUpload = Boolean(imageBase64 && imageContentType)
        const hasUrl = Boolean(imageUrl && String(imageUrl).trim())
        if (!hasUpload && !hasUrl) return res.status(400).json({ message: 'Image is required via upload or imageUrl' })
        if (imageBase64 && imageContentType) {
            doc.image = { data: Buffer.from(imageBase64, 'base64'), contentType: imageContentType }
        }
        const created = await Product.create(doc)
        res.status(201).json(created)
    } catch (e) {
        res.status(400).json({ message: 'Failed to create product' })
    }
})

adminRouter.put('/admin/products/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { name, price, discountPrice, imageUrl, imageBase64, imageContentType, description, stock } = req.body
        const update = { name, price, discountPrice, imageUrl, description, stock }
        // Backend validation: require all fields and at least one image source
        if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ message: 'Name is required' })
        if (!(typeof price === 'number') || price <= 0) return res.status(400).json({ message: 'Price must be > 0' })
        if (!(typeof discountPrice === 'number') || discountPrice < 0) return res.status(400).json({ message: 'Discount price is required (0 or more)' })
        if (discountPrice >= price) return res.status(400).json({ message: 'Discount price must be less than price' })
        if (!description || !String(description).trim()) return res.status(400).json({ message: 'Description is required' })
        if (!(typeof stock === 'number') || stock < 0) return res.status(400).json({ message: 'Stock must be 0 or more' })
        const hasUpload = Boolean(imageBase64 && imageContentType)
        const hasUrl = Boolean(imageUrl && String(imageUrl).trim())
        if (!hasUpload && !hasUrl) return res.status(400).json({ message: 'Image is required via upload or imageUrl' })
        if (imageBase64 && imageContentType) {
            update.image = { data: Buffer.from(imageBase64, 'base64'), contentType: imageContentType }
        }
        const updated = await Product.findByIdAndUpdate(
            id,
            update,
            { new: true }
        )
        if (!updated) return res.status(404).json({ message: 'Not found' })
        res.json(updated)
    } catch (e) {
        res.status(400).json({ message: 'Failed to update product' })
    }
})

adminRouter.delete('/admin/products/:id', async (req, res) => {
    try {
        const { id } = req.params
        const deleted = await Product.findByIdAndDelete(id)
        if (!deleted) return res.status(404).json({ message: 'Not found' })
        res.json({ ok: true })
    } catch (e) {
        res.status(400).json({ message: 'Failed to delete product' })
    }
})

// serve image for a product
adminRouter.get('/admin/products/:id/image', async (req, res) => {
    try {
        const { id } = req.params
        const product = await Product.findById(id)
        if (!product || !product.image || !product.image.data) {
            return res.status(404).json({ message: 'Image not found' })
        }
        res.set('Content-Type', product.image.contentType || 'application/octet-stream')
        res.send(product.image.data)
    } catch (e) {
        res.status(400).json({ message: 'Failed to fetch image' })
    }
})

module.exports = adminRouter


