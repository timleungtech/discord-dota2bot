import mongoose from 'mongoose';

const HeroSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  localized_name: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Hero", HeroSchema);
