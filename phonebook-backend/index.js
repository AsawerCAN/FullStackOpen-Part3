const express = require("express");
const path = require("path");
const morgan = require("morgan");
const cors = require("cors");

const app = express();

let persons = [
  { id: "1", name: "Arto Hellas", number: "040-123456" },
  { id: "2", name: "Ada Lovelace", number: "39-44-5323523" },
  { id: "3", name: "Dan Abramov", number: "12-43-234345" },
  { id: "4", name: "Mary Poppendieck", number: "39-23-6423122" },
];

app.use(express.json());
app.use(cors());
app.use(morgan("tiny"));

// Serve static files from the React app
const frontendBuildPath = path.join(__dirname, "../phonebook-backend", "dist");
app.use(express.static(frontendBuildPath));
console.log(frontendBuildPath);

// Custom token for logging POST request body
// morgan.token("body", (req) => {
//   return req.method === "POST" ? JSON.stringify(req.body) : "";
// });
// app.use(
//   morgan(":method :url :status :res[content-length] - :response-time ms :body")
// );

app.get("/api/persons", (req, res) => {
  res.json(persons);
});

app.get("/info", (req, res) => {
  const currentTime = new Date();
  const numberOfEntries = persons.length;

  res.send(`
    <p>Phonebook has info for ${numberOfEntries} people</p>
    <p>${currentTime}</p>
  `);
});

app.get("/api/persons/:id", (req, res) => {
  const id = req.params.id;
  const person = persons.find((p) => p.id === id);

  if (person) {
    res.json(person);
  } else {
    res.status(404).end();
  }
});

app.delete("/api/persons/:id", (req, res) => {
  const id = req.params.id;
  const initialLength = persons.length;

  persons = persons.filter((p) => p.id !== id);

  if (persons.length < initialLength) {
    res.status(204).end();
  } else {
    res.status(404).end();
  }
});

app.post("/api/persons", (req, res) => {
  const body = req.body;

  if (!body.name || !body.number) {
    return res.status(400).json({ error: "name or number is missing" });
  }

  const existingPerson = persons.find((p) => p.name === body.name);
  if (existingPerson) {
    return res.status(400).json({ error: "name must be unique" });
  }

  const newPerson = {
    id: Math.floor(Math.random() * 1000000).toString(),
    name: body.name,
    number: body.number,
  };

  persons = persons.concat(newPerson);
  res.status(201).json(newPerson);
});

app.put("/api/persons/:id", (req, res) => {
  const id = req.params.id;
  const body = req.body;

  if (!body.name || !body.number) {
    return res.status(400).json({ error: "name or number is missing" });
  }

  const personIndex = persons.findIndex((p) => p.id === id);

  if (personIndex === -1) {
    return res.status(404).json({ error: `Person with id ${id} not found` });
  }

  const updatedPerson = {
    ...persons[personIndex],
    name: body.name,
    number: body.number,
  };
  persons[personIndex] = updatedPerson;

  res.json(updatedPerson);
});

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
