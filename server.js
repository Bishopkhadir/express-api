const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

// 1. Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/todoapp')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// 2. Define a Todo model
const Todo = mongoose.model('Todo', {
  text: String,
  done: Boolean
});

// 3. Routes
// GET all todos
app.get('/todos', async (req, res) => {
  const todos = await Todo.find();
  res.json(todos);
});

// POST create todo
app.post('/todos', async (req, res) => {
  const todo = new Todo({ text: req.body.text, done: false });
  await todo.save();
  res.status(201).json(todo);
});

// PUT update todo
app.put('/todos/:id', async (req, res) => {
  const todo = await Todo.findByIdAndUpdate(
    req.params.id,
    { text: req.body.text, done: req.body.done },
    { new: true }
  );
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json(todo);
});

// DELETE todo
app.delete('/todos/:id', async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

app.listen(3000, () => {
  console.log('✅ API running at http://localhost:3000');
});