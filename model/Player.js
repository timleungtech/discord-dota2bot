import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  account_id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  match_id: {
    type: Number,
  },
});

const Player = mongoose.model("Player", PlayerSchema);
export default Player;