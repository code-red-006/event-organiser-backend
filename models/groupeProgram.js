const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GroupeProgramSchema = new Schema({
    program_name: { type:String, required: true },
    event_id: { type: Schema.Types.ObjectId, ref: "Event", required: true }
})

module.exports = mongoose.model('GroupeProgram', GroupeProgramSchema);