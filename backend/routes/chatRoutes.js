const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { generateResponse } = require('../controllers/chatcompletion');
const Chat = require('../models/Chat');
const redis = require('redis');

const router = express.Router();

const redisClient = redis.createClient({
  url: process.env.REDIS_URI,
});

redisClient.connect()
// Function to handle creating a new chat
const createNewChat = async (userId, heading, message) => {
    try {
      // Ensure the message is a string
      if (typeof message !== 'string') {
        throw new Error('Invalid argument type: message should be a string');
      }
  
      const cachedAnswer = await redisClient.get(message);
      let answer;
  
      if (cachedAnswer) {
        answer = cachedAnswer;
      } else {
        // Ensure the answer is generated correctly
        answer = await generateResponse(message);
      }
  
      // Ensure heading and userId are strings
      if (typeof heading !== 'string') {
        throw new Error('Invalid argument type: heading should be a string');
      }
  
      const chat = new Chat({
        userId: userId,
        heading: heading,
        messages: [
          { content: message, type: 'question'} ,
          { content: answer, type: 'response'}
        ]
      });
      await redisClient.set(message, answer);
      const savedChat = await chat.save();
      return { chatId: savedChat._id, answer };
    } catch (err) {
      throw new Error('Error creating new chat: ' + err.message);
    }
  };
  

// Function to handle appending to an existing chat
const appendToExistingChat = async (chatId, message) => {
  try {
    console.log("Appending to existing chat:", chatId);
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    const cachedAnswer = await redisClient.get(message);
    let answer;

    if (cachedAnswer) {
      answer = cachedAnswer;
    } else {
      answer = await generateResponse(message);
    }

    chat.messages.push({ content: message, type: 'question' });
    chat.messages.push({ content: answer, type: 'response' });
    await redisClient.set(message, answer);

    await chat.save();
    return { chatId: chat._id, answer };
  } catch (err) {
    console.error("Error appending to existing chat:", err.message);
    throw new Error('Error appending to existing chat: ' + err.message);
  }
};

// Unified chat route
router.post('/chat', [
  body('message').not().isEmpty().withMessage('Message is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { message, heading, chatId } = req.body;
  const userId = '60f7a6f9f3c3d40015f1f5b2'; // Hardcoded userId for now

  if (!message) {
    return res.status(400).send('Message is required');
  }

  try {
    let result;

    if (heading) {
      // New chat request
      result = await createNewChat(userId, heading, message);
    } else if (chatId) {
      // Existing chat request
      result = await appendToExistingChat(chatId, message);
    } else {
      return res.status(400).send('Either heading or chatId is required');
    }

    return res.status(200).json({
      chatId: result.chatId,
      answer: result.answer
    });

  } catch (err) {
    console.error('Error handling chat request:', err.message);
    return res.status(500).send('Server Error');
  }
});

module.exports = router;
