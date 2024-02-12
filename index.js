const express = require('express')
const app = express()
require('dotenv').config()
const PORT = process.env.PORT || 4000
const userRouter = require('./routes/userRouter')
const adminRouter = require('./routes/adminRouter')
const mongoose = require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/userDatabase')


app.use('/public',express.static('public'))


app.use('/',userRouter)
app.use('/',adminRouter)
app.listen(PORT,()=>{
    console.log(`Server is running on ${PORT}`)
})