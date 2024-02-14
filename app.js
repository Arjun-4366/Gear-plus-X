const express = require('express')
const app = express()
require('dotenv').config()
const PORT = 8080
const userRouter = require('./routes/userRouter')
const adminRouter = require('./routes/adminRouter')
const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URL)

app.use('/public',express.static('public'))


app.use('/',userRouter)
app.use('/',adminRouter)
app.listen(PORT,()=>{
    console.log(`Server is running on ${PORT}`)
})