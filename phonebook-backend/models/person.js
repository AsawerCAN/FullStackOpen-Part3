const mongoose = require("mongoose");

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    unique: true,
    minlength: [3, "Name must be at least 3 characters long"],
  },
  number: {
    type: String,
    required: [true, "Number is required"],
    validate: {
      validator: function (v) {
        return /^\d{2,3}-\d+$/.test(v) && v.length >= 8;
      },
      message:
        "Invalid phone number. It must be in the format XX-YYYYYY or XXX-YYYYYY and have a minimum length of 8.",
    },
  },
});

personSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Person", personSchema);
