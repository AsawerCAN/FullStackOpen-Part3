const mongoose = require("mongoose");

if (process.argv.length < 3) {
  console.log("Usage: node mongo.js <password> [name] [number]");
  process.exit(1);
}

const password = process.argv[2];
const name = process.argv[3];
const number = process.argv[4];

const url = `mongodb+srv://fullstack:${password}@cluster0.tyxba.mongodb.net/phonebookApp?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.set("strictQuery", false);
mongoose
  .connect(url)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  });

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
});

const Person = mongoose.model("Person", personSchema);

if (!name && !number) {
  console.log("Phonebook:");
  Person.find({})
    .then((persons) => {
      persons.forEach((person) => {
        console.log(`${person.name} ${person.number}`);
      });
    })
    .finally(() => {
      mongoose.connection.close();
    });
} else if (name && number) {
  const person = new Person({
    name,
    number,
  });

  person
    .save()
    .then((savedPerson) => {
      console.log(
        `Added ${savedPerson.name} number ${savedPerson.number} to phonebook`
      );
    })
    .finally(() => {
      mongoose.connection.close();
    });
} else {
  console.log("Usage: node mongo.js <password> [name] [number]");
  mongoose.connection.close();
  process.exit(1);
}
