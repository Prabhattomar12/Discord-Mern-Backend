import mongoose from 'mongoose';

const channelSchema = mongoose.Schema({
  channelName: String,
  conversation: [
    {
      message: String,
      timestamp: String,
      user: {
        uid: String,
        username: String,
        image: String,
        email: String,
      },
    },
  ],
});

export default mongoose.model('conversations', channelSchema);
