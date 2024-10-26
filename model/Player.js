import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  account_id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  match_id: {
    type: Number,
  },
});

const Player = mongoose.model("Player", PlayerSchema);
export default Player;