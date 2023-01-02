const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SingleProgramSchema = new Schema({
    program_name: { type: String, required: true },
    event_id: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    participants: [ {type: Schema.Types.ObjectId, ref: "Participant"}]
})

module.exports = mongoose.model('SingleProgram', SingleProgramSchema);