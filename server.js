const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());
app.use(cors());

// Connect to MongoDB (uses Railway's environment variable in production)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/todoapp')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// Todo model
const Todo = mongoose.model('Todo', {
  text: String,
  done: Boolean
});

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

// Dynamic port for Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API running at http://localhost:${PORT}`);
});