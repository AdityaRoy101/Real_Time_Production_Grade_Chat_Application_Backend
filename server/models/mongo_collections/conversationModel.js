import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const conversationSchema = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'UserSchema',
    required: true
  }],
  lastMessage: {
    content: String,
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'UserSchema'
    },
    timestamp: Date
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  }
}, { 
  timestamps: true 
});

// Added index for participants ObjectId Array for quick lookup
conversationSchema.index({ participants: 1 });

conversationSchema.statics.findConversation = async function(userId1, userId2) {
  const id1 = typeof userId1 === 'string' ? mongoose.Types.ObjectId(userId1) : userId1;
  const id2 = typeof userId2 === 'string' ? mongoose.Types.ObjectId(userId2) : userId2;
  
  return this.findOne({
    participants: { 
      $all: [id1, id2],
      $size: 2
    }
  });
};

conversationSchema.statics.getOrCreateConversation = async function(userId1, userId2) {
  const id1 = mongoose.Types.ObjectId.isValid(userId1) ? 
    new mongoose.Types.ObjectId(userId1) : userId1;
  
  const id2 = mongoose.Types.ObjectId.isValid(userId2) ? 
    new mongoose.Types.ObjectId(userId2) : userId2;

  let conversation = await this.findOne({
    participants: { 
      $all: [id1, id2],
      $size: 2
    }
  });
  
  if (!conversation) {
    conversation = await this.create({
      participants: [id1, id2],
      lastMessage: null,
      unreadCount: { [id1]: 0, [id2]: 0 }
    });
  }
  
  await conversation.populate('participants', 'name email online lastActive');
  
  return conversation;
};

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;