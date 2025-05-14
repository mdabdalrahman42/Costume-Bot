const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["question", "response"],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  heading: {
    type: String,
    required: true,
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
