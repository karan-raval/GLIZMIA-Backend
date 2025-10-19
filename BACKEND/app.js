const express = require('express')
const cors=require('cors')
const connet = require('./Config/server')
const adminRouter = require('./Routes/AdminRouter')
// Use simple router for development (no Razorpay keys required)
const razorpayRouter = require('./Routes/RazorpayRouterSimple')
require('dotenv').config()

const app=express()
app.use(express.json({ limit: '10mb' }))
app.use(cors())

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date() })
})

// mount routers
app.use('/', adminRouter)
app.use('/', razorpayRouter)

app.listen(process.env.port,()=>{
    connet()
    console.log(`server running at ${process.env.port}`);
})