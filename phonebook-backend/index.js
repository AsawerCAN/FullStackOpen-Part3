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

const frontendBuildPath = path.join(__dirname, "dist");
app.use(express.static(frontendBuildPath));
console.log(`Serving static files from: ${frontendBuildPath}`);

const mongoUrl = process.env.MONGO_URI;
if (!mongoUrl) {
  console.error(
    "MongoDB connection error: MONGO_URI environment variable not set."
  );
  process.exit(1);
}
mongoose.set("strictQuery", false);
mongoose
  .connect(mongoUrl)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
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
        res.status(404).json({ error: "Person not found" });
      }
    })
    .catch((error) => next(error));
});

// DELETE a person by ID
app.delete("/api/persons/:id", (req, res, next) => {
  const id = req.params.id;

  Person.findByIdAndDelete(id)
    .then((result) => {
      if (result) {
        res.status(204).end();
      } else {
        res.status(404).json({ error: "Person not found" });
      }
    })
    .catch((error) => {
      console.error("Backend delete error:", error);
      next(error);
    });
});

// POST a new person
app.post("/api/persons", async (req, res, next) => {
  const { name, number } = req.body;

  if (!name || !number) {
    return res.status(400).json({ error: "name or number is missing" });
  }

  const person = new Person({
    name,
    number,
  });

  try {
    const savedPerson = await person.save();
    res.status(201).json(savedPerson);
  } catch (error) {
    next(error);
  }
});

// PUT (update) person by ID
app.put("/api/persons/:id", (req, res, next) => {
  const { name, number } = req.body;
  const id = req.params.id;

  if (!name || !number) {
    return res.status(400).json({ error: "name or number is missing" });
  }

  const personUpdates = {
    name,
    number,
  };

  Person.findByIdAndUpdate(id, personUpdates, {
    new: true,
    runValidators: true,
    context: "query",
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
  const indexFile = path.join(frontendBuildPath, "index.html");
  res.sendFile(indexFile, (err) => {
    if (err) {
      console.error("Error serving index.html:", err);
      res.status(500).send("Error serving application");
    }
  });
});

// Error-handling middleware
const errorHandler = (error, req, res, next) => {
  console.error("Error Name:", error.name);
  console.error("Error Message:", error.message);

  if (error.name === "CastError") {
    return res.status(400).json({ error: "Malformatted ID" });
  } else if (error.name === "ValidationError") {
    const messages = Object.values(error.errors)
      .map((el) => el.message)
      .join(". ");
    return res.status(400).json({ error: messages || error.message });
  } else if (error.code === 11000) {
    return res.status(409).json({
      error: `Duplicate key error: ${
        Object.keys(error.keyValue)[0]
      } must be unique.`,
    });
  }
  res
    .status(500)
    .json({ error: "An unexpected internal server error occurred" });
};

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
