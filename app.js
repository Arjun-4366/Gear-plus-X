const express = require('express')
const app = express()
require('dotenv').config()

const userRouter = require('./routes/userRouter')
const adminRouter = require('./routes/adminRouter')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URL)

app.use('/public',express.static('public'))




// Create a Secrets Manager client
const client = new AWS.SecretsManager();

// Define parameters for retrieving the secret
const params = {
  SecretId: 'secrets'
};

// Retrieve the secret value
client.getSecretValue(params, (err, data) => {
  if (err) {
    console.error("Error retrieving secret:", err);
  } else {
    // Parse the secret JSON string
    const secret = JSON.parse(data.SecretString);

    // Set the environment variables
    process.env.PORT = secret.PORT;
    process.env.HOST = secret.HOST;
    process.env.SMPT_MAI = secret.SMPT_MAI;
    process.env.SMPT_PASSWORD = secret.SMPT_PASSWORD;
    process.env.SECRET = secret.SECRET;
    process.env.ADMIN_SECRET = secret.ADMIN_SECRET;
    process.env.RAZORPAY_KEY_ID = secret.RAZORPAY_KEY_ID;
    process.env.RAZORPAY_SECRET_KEY = secret.RAZORPAY_SECRET_KEY;
    process.env.CLLIENT_ID = secret.CLLIENT_ID;
    process.env.CLLIENT_SECRET = secret.CLLIENT_SECRET;
    process.env.MONGO_URL = secret.MONGO_URL;

    // Start your application
    // Your application code here
  }
});

const PORT = process.env.PORT || 4000


app.use('/',userRouter)
app.use('/',adminRouter)
app.listen(PORT,()=>{
    console.log(`Server is running on ${PORT}`)
})