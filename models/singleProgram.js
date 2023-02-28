const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SingleProgramSchema = new Schema({
    program_name: { type: String, required: true },
    event_id: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    description: { type: String, required: true },
    start_time: { type: String },
    report_time: { type: String },
    type: { type: String },
    participants: [{type: Schema.Types.ObjectId, ref: "User"}],
    finished: {type: Schema.Types.Boolean}
})

SingleProgramSchema.virtual('getStartTime').get(function(){
    var timeSplit = this.start_time.split(':'),
    hours,
    minutes,
    meridian;
  hours = timeSplit[0];
  minutes = timeSplit[1];
  if (hours > 12) {
    meridian = 'PM';
    hours -= 12;
  } else if (hours < 12) {
    meridian = 'AM';
    if (hours == 0) {
      hours = 12;
    }
  } else {
    meridian = 'PM';
  }
  return(hours + ':' + minutes + ' ' + meridian);
});

SingleProgramSchema.virtual('getReportTime').get(function(){
    var timeSplit = this.report_time.split(':'),
    hours,
    minutes,
    meridian;
  hours = timeSplit[0];
  minutes = timeSplit[1];
  if (hours > 12) {
    meridian = 'PM';
    hours -= 12;
  } else if (hours < 12) {
    meridian = 'AM';
    if (hours == 0) {
      hours = 12;
    }
  } else {
    meridian = 'PM';
  }
  return(hours + ':' + minutes + ' ' + meridian);
})

module.exports = mongoose.model('SingleProgram', SingleProgramSchema);