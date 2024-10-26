import mongoose from 'mongoose';

const HeroSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
  },
  localized_name: {
    type: String,
    required: true,
  },
  primary_attr: {
    type: String,
  },
  attack_type: {
    type: String,
  },
  roles: {
    type: Array,
  },
  legs: {
    type: Number,
  },
}, { collection: 'heroes' });

const Hero = mongoose.model("Hero", HeroSchema);
export default Hero;