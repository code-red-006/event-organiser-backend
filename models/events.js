const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EventSchema = new Schema({
  event_name: { type: String, required: true },
  date: { type: String, required: true },
  days: { type: Number, required: true },
  houses: [{ type: String }],
  type: { type: String, required: true },
  groupe_points: [{ type: Number }],
  single_points: [{ type: Number }]
});

module.exports = mongoose.model("Event", EventSchema);
