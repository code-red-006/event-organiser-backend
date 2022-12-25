const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs')

const AdminSchema = new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
})

AdminSchema.pre('save', async function(next){
    var admin = this;
    if(!admin.isModified('password')) {return next()}
    admin.password = await bcrypt.hash(admin.password, 10);
    next();
})

module.exports = mongoose.model("Admin", AdminSchema);