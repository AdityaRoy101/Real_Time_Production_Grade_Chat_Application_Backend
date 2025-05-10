import mongoose from 'mongoose';
import Message from '../server/models/mongo_collections/messageModel.js';
import Conversation from '../server/models/mongo_collections/conversationModel.js';
import UserSchema from '../server/models/mongo_collections/userModel.js';

const chatController = {
  // Getting or creating a conversation between two users
  getConversation: async (req, res) => {
    try {
      const { userId, otherUserId } = req.params;
      
      let conversation = await Conversation.findConversation(userId, otherUserId);
      
      if (!conversation) {
        conversation = await Conversation.create({
          participants: [userId, otherUserId],
          lastMessage: null
        });
      }
      
      await conversation.populate('participants', 'name email online lastActive');
      
      res.status(200).json(conversation);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Getting all conversations for a user
  getUserConversations: async (req, res) => {
    try {
      const { userId } = req.params;
      
      const conversations = await Conversation.find({
        participants: userId
      })
      .sort({ 'lastMessage.timestamp': -1 })
      .populate('participants', 'name email online lastActive')
      .populate('lastMessage.sender', 'name');
      
      res.status(200).json(conversations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Sending a new message
  sendMessage: async (req, res) => {
    try {
      const { conversationId, sender, recipient, content } = req.body;
      
      if (!sender || !recipient || !content) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const senderUser = await UserSchema.findById(sender);
      if (!senderUser) {
        return res.status(404).json({ error: "Sender user not found" });
      }
      
      const recipientUser = await UserSchema.findById(recipient);
      if (!recipientUser) {
        return res.status(404).json({ error: "Recipient user not found" });
      }
      
      let actualConversationId;
      let conversation;
      
      if (conversationId.startsWith('temp-')) {
        conversation = await Conversation.findOne({
          participants: { 
            $all: [sender, recipient],
            $size: 2
          }
        });
        
        if (!conversation) {
          conversation = await Conversation.create({
            participants: [sender, recipient],
            lastMessage: {
              content,
              sender,
              timestamp: new Date()
            },
            unreadCount: { [recipient]: 1 }
          });
        }
        
        actualConversationId = conversation._id;
        
        await conversation.populate('participants', 'name email online lastActive');
      } else {
        actualConversationId = conversationId;
        
        await Conversation.findByIdAndUpdate(
          actualConversationId,
          { 
            lastMessage: {
              content,
              sender,
              timestamp: new Date()
            },
            $inc: { [`unreadCount.${recipient}`]: 1 }
          }
        );
      }
      
      const newMessage = await Message.create({
        conversationId: actualConversationId,
        sender,
        content,
        read: false
      });
      
      await newMessage.populate({
        path: 'sender',
        select: 'name email _id avatar'
      });
      
      const response = {
        ...newMessage.toObject(),
        _conversationId: actualConversationId
      };
      
      res.status(201).json(response);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Getting paginated messages for a conversation
  getMessages: async (req, res) => {
    try {
      const { conversationId } = req.params;
      
      if (conversationId.startsWith('temp-')) {
        return res.status(200).json({
          messages: [],
          hasMore: false,
          nextPage: null
        });
      }
      
      const { page = 1, limit = 50, before = Date.now() } = req.query;
      
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      
      const messages = await Message.find({ 
        conversationId,
        createdAt: { $lt: new Date(parseInt(before)) }
      })
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .populate({
          path: 'sender',
          select: 'name email _id avatar'
        });
      
      const oldestTimestamp = messages.length > 0 ? 
        messages[messages.length-1].createdAt.getTime() : 
        null;
      
      res.status(200).json({
        messages: messages.reverse(),
        hasMore: messages.length === limitNum,
        nextPage: oldestTimestamp
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // markAsRead function
  markAsRead: async (req, res) => {
    try {
      const { conversationId, userId } = req.body;
      
      if (!conversationId || !userId) {
        return res.status(400).json({ error: "Missing conversationId or userId" });
      }
      
      const updateResult = await Message.updateMany(
        { 
          conversationId,
          sender: { $ne: userId },
          read: false
        },
        { read: true }
      );
      
      await Conversation.findByIdAndUpdate(
        conversationId,
        { [`unreadCount.${userId}`]: 0 }
      );
      
      const updatedMessages = await Message.find({
        conversationId,
        sender: { $ne: userId },
        read: true
      }).select('_id sender');
      
      const updatedMessageIds = updatedMessages.map(msg => msg._id.toString());
      
      const uniqueSenderIds = [...new Set(updatedMessages.map(msg => msg.sender.toString()))];
      
      res.status(200).json({
        success: true,
        updatedCount: updateResult.modifiedCount,
        updatedMessageIds: updatedMessageIds,
        senderIds: uniqueSenderIds
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Getting all users (except the current user)
  getAllUsers: async (req, res) => {
    try {
      const { userId } = req.params;
      
      const users = await UserSchema.find(
        { _id: { $ne: userId } },
        'name email online lastActive'
      );
      
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
export default chatController;