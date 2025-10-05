const mongoose = require('mongoose');

const ReadingSchema = new mongoose.Schema(
  {
    sensorName: { type: String, default: 'temperaturesensor' },
    address: { type: String, default: '' },    
    location: { type: String, default: '' },    
    temperature: { type: Number, required: true }
  },
  { timestamps: true } 
);

module.exports = mongoose.model('Reading', ReadingSchema);
