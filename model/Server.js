import mongoose from 'mongoose';

const ServerSchema = new mongoose.Schema({
  server_id: {
    type: String,
    required: true,
    unique: true,
  },
  channel_id: {
    type: String,
    required: true,
    unique: true,
  },
  players_tracking: {
    type: Array,
    required: true,
  },
});

const Server = mongoose.model("Server", ServerSchema);
export default Server;