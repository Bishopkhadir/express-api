const express = require('express');
const app = express();

app.use(express.json());

// In-memory "database" (a simple array)
let todos = [
  { id: 1, text: 'Learn Express', done: false },
  { id: 2, text: 'Build an API', done: false }
];

// GET all todos
app.get('/todos', (req, res) => {
  res.json(todos);
});

// GET one todo
app.get('/todos/:id', (req, res) => {
  const todo = todos.find(t => t.id === Number(req.params.id));
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json(todo);
});

// POST create new todo
app.post('/todos', (req, res) => {
  const newTodo = {
    id: todos.length + 1,
    text: req.body.text,
    done: false
  };
  todos.push(newTodo);
  res.status(201).json(newTodo);
});

// PUT update todo
app.put('/todos/:id', (req, res) => {
  const todo = todos.find(t => t.id === Number(req.params.id));
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  todo.text = req.body.text ?? todo.text;
  todo.done = req.body.done ?? todo.done;
  res.json(todo);
});

// DELETE todo
app.delete('/todos/:id', (req, res) => {
  todos = todos.filter(t => t.id !== Number(req.params.id));
  res.json({ message: 'Deleted' });
});

app.listen(3000, () => {
  console.log('✅ API running at http://localhost:3000');
});