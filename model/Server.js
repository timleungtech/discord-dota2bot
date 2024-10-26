import mongoose from 'mongoose';

const ServerSchema = new mongoose.Schema({
  server_id: {
    type: Number,
    required: true,
  },
  channel_id: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Server", ServerSchema);
