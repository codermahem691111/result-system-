import Todo from "../models/todo.model.js";

/* CREATE TODO */
export const createTodo = async (req, res, next) => {
  try {
    const todo = await Todo.create({
      title: req.body.title,
    });
    res.status(201).json(todo);
  } catch (error) {
    next(error);
  }
};

/* GET ALL TODOS */
export const getAllTodos = async (req, res, next) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.status(200).json(todos);
  } catch (error) {
    next(error);
  }
};

/* UPDATE TODO */
export const updateTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(todo);
  } catch (error) {
    next(error);
  }
};

/* DELETE TODO */
export const deleteTodo = async (req, res, next) => {
  try {
    await Todo.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Todo deleted successfully" });
  } catch (error) {
    next(error);
  }
};
