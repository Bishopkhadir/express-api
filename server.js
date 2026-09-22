require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/todoapp')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err.message));

// ===== MODELS =====
const User = mongoose.model('User', {
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

const Todo = mongoose.model('Todo', {
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  done: Boolean,
  dueDate: { type: String, default: '' },
  priority: { type: String, default: 'medium' }
});

// ===== AUTH ROUTES =====

// Signup
app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== MIDDLEWARE =====
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ===== PROTECTED TODO ROUTES =====

app.get('/todos', auth, async (req, res) => {
  const todos = await Todo.find({ userId: req.userId });
  res.json(todos);
});

app.post('/todos', auth, async (req, res) => {
  const todo = new Todo({
    userId: req.userId,
    text: req.body.text,
    dueDate: req.body.dueDate || '',
    priority: req.body.priority || 'medium',
    done: false
  });
  await todo.save();
  res.status(201).json(todo);
});

app.put('/todos/:id', auth, async (req, res) => {
  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    {
      text: req.body.text,
      done: req.body.done,
      dueDate: req.body.dueDate,
      priority: req.body.priority
    },
    { new: true }
  );
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json(todo);
});

app.delete('/todos/:id', auth, async (req, res) => {
  await Todo.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.json({ message: 'Deleted' });
});

// Root
app.get('/', (req, res) => {
  res.json({ message: 'API is running!', endpoints: ['/auth/signup', '/auth/login', '/todos'] });
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ API running on port ${PORT}`));