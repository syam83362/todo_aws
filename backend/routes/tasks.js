const express = require('express');
const jwt = require('jsonwebtoken');

const Task = require('../models/Task');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function toClient(task) {
  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description,
    completed: task.completed,
    createdAt: task.createdAt,
  };
}

// Get all tasks
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    res.json(tasks.map(toClient));
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task
router.post('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    const task = await Task.create({
      userId,
      title,
      description: description || '',
    });
    res.status(201).json(toClient(task));
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const taskId = req.params.id;
  const { title, description, completed } = req.body;

  try {
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (typeof completed === 'boolean') updates.completed = completed;

    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId },
      updates,
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(toClient(task));
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const taskId = req.params.id;

  try {
    const task = await Task.findOneAndDelete({ _id: taskId, userId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

