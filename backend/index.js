const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./db');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Task Management API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend API listening on port ${PORT}`);
  });
});

