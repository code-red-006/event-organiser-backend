const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GroupeSchema = new Schema({
    program_id: { type: Schema.Types.ObjectId, ref: "GroupeProgram", required: true},
    groupe_name: { type: String, required: true},
    house: { type: String, required: true},
    members: [{ type: Schema.Types.ObjectId, ref: "Participant" }]
});

module.exports = mongoose.model('Groupe', GroupeSchema);