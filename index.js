require('dotenv').config();
const cors = require('cors');
const express = require('express');

//DB connection
const connectDB = require('./config/db');


// Routes 
const authRoutes = require('./routes/auth.routes');
const paymentRoutes = require('./routes/payment.routes');
const accountRoutes = require('./routes/account.routes');
const activityRoutes = require('./routes/activity.routes');
const { connectRedis } = require('./config/redis');

const app = express();


// Connect to Database
connectDB();
connectRedis();
// Middleware
app.use(cors());
app.use(express.json());
  //Rate limiter
app.use(require('./middleware/rateLimiter'));

// use Router
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api',paymentRoutes);
app.use('/api', activityRoutes);



// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});