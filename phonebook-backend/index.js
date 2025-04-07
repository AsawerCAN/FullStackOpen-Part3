const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const Person = require("./models/person");

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("tiny"));

const frontendBuildPath = path.join(__dirname, "../phonebook-backend", "dist");
app.use(express.static(frontendBuildPath));

const mongoUrl = process.env.MONGO_URI;
mongoose
  .connect(mongoUrl)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
  });

// GET all persons
app.get("/api/persons", (req, res, next) => {
  Person.find({})
    .then((persons) => {
      res.json(persons);
    })
    .catch((error) => next(error));
});

// GET phonebook info
app.get("/info", (req, res, next) => {
  const currentTime = new Date();
  Person.countDocuments({})
    .then((numberOfEntries) => {
      res.send(`
        <p>Phonebook has info for ${numberOfEntries} people</p>
        <p>${currentTime}</p>
      `);
    })
    .catch((error) => next(error));
});

// GET single person by ID
app.get("/api/persons/:id", (req, res, next) => {
  const id = req.params.id;

  Person.findById(id)
    .then((person) => {
      if (person) {
        res.json(person);
      } else {
        res.status(404).end();
      }
    })
    .catch((error) => next(error));
});

// DELETE a person by ID
app.delete("/api/persons/:id", (req, res, next) => {
  const id = req.params.id;

  Person.findByIdAndRemove(id)
    .then(() => {
      res.status(204).end();
    })
    .catch((error) => next(error));
});

// POST a new person
app.post("/api/persons", async (req, res, next) => {
  const body = req.body;

  if (!body.name || !body.number) {
    return res.status(400).json({ error: "name or number is missing" });
  }

  const existingPerson = await Person.findOne({ name: body.name });
  if (existingPerson) {
    return res.status(409).json({
      error: "already exists- name must be unique",
    });
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  });

  person
    .save()
    .then((savedPerson) => {
      res.status(201).json(savedPerson);
    })
    .catch((error) => next(error));
});

// PUT (update) person by ID
app.put("/api/persons/:id", (req, res, next) => {
  const id = req.params.id;
  const body = req.body;

  if (!body.name || !body.number) {
    return res.status(400).json({ error: "name or number is missing" });
  }

  const updatedPerson = {
    name: body.name,
    number: body.number,
  };

  Person.findByIdAndUpdate(id, updatedPerson, {
    new: true,
    runValidators: true,
  })
    .then((updatedPerson) => {
      if (updatedPerson) {
        res.json(updatedPerson);
      } else {
        res.status(404).json({ error: "Person not found" });
      }
    })
    .catch((error) => next(error));
});

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

// Error-handling middleware
const errorHandler = (error, req, res, next) => {
  console.error("Error:", error.message);

  if (error.name === "CastError") {
    return res.status(400).json({ error: "Malformatted ID" });
  } else if (error.name === "ValidationError") {
    return res.status(400).json({ error: error.message });
  }

  return res.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
