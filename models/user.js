const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')
const Schema = mongoose.Schema;


const UserSchema = new Schema({
    name: { type: String, required: true },
    adm_no: { type: Number, required: true, unique: true },
    mobile: { type: Number, required: true, unique: true },
    year: { type: Number, required: true, min: 1, max: 3 },
    department: { type: String, required: true },
    house: { type: String },
    chestNo: { type: Number, default: 0 },
    limit: {
        offStage: { type: Number, default: 0 }, //individul and groupe
        onStage: { type: Number, default: 0 } //individual only
    },
    password: { type: String, required: true } 
});

UserSchema.pre('save', async function(next){
    var user = this;
    if(!user.isModified('password')) {return next()}
    user.password = await bcrypt.hash(user.password, 10);
    next();
});

module.exports = mongoose.model('User', UserSchema);