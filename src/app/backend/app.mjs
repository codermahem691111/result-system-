const express = require("express");
const mongoose = require("mongoose");

/* =======================
   DATABASE CONNECTION
======================= */
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://maheemshahreear2:r3iZJpAcyefauKSV@cluster0.op4beda.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB connection failed");
    process.exit(1);
  }
};

/* =======================
   MODEL
======================= */
const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Todo = mongoose.model("Todo", todoSchema);

/* =======================
   APP SETUP
======================= */
const app = express();
connectDB();

app.use(express.json());

/* =======================
   ROUTES
======================= */

/* CREATE TODO */
app.post("/api/todos", async (req, res) => {
  try {
    const todo = await Todo.create({ title: req.body.title });
    res.status(201).json(todo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* GET TODOS */
app.get("/api/todos", async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.status(200).json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* UPDATE TODO */
app.put("/api/todos/:id", async (req, res) => {
  try {
    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(todo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* DELETE TODO */
app.delete("/api/todos/:id", async (req, res) => {
  try {
    await Todo.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Todo deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* =======================
   SERVER
======================= */
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
