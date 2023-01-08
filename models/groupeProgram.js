const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GroupeProgramSchema = new Schema({
    program_name: { type:String, required: true },
    event_id: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    description: { type: String, required: true },
    start_time: { type: String },
    report_time: { type: String },
    groups:[{
        head_name: {type: Schema.Types.ObjectId, ref: "User"},
        group_name: {type: String}
    }]
})

module.exports = mongoose.model('GroupeProgram', GroupeProgramSchema);