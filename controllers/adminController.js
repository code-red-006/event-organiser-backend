const Admin = require("../models/admin");
const User = require("../models/user");
const Event = require("../models/events");
const SingleProgram = require("../models/singleProgram");
const GroupeProgram = require("../models/groupeProgram");
const async = require("async");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

module.exports = {
  admin_login_post: [
    body("username")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("username must be specified.")
      .isAlpha("en-US", { ignore: " " })
      .withMessage("username must be in alphabetics"),
    body("password")
      .isLength({ min: 7 })
      .withMessage("password must contain 7 charecters"),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log(errors.errors[0]);
        return res.status(400).json({ error: errors.errors[0] });
      }
      try {
        var admin = await Admin.findOne({ username: req.body.username });
        if (!admin) {
          return res.status(401).json({ error: { msg: "invalid username" } });
        }
        var isPasswordMatch = await bcrypt.compare(
          req.body.password,
          admin.password
        );
        if (!isPasswordMatch) {
          console.log("not");
          return res.status(401).json({ error: { msg: "invalid password" } });
        }
        var payload = {
          id: admin._id,
          username: req.body.username,
        };
        jwt.sign(
          payload,
          process.env.SECRET,
          { expiresIn: "1d" },
          (err, token) => {
            res.status(200).json({ token });
            console.log(req.body.username);
          }
        );
      } catch (error) {
        res.status(500).json({ error });
      }
    },
  ],

  admin_reset_password_post: [
    body("new_password")
      .isLength({ min: 7 })
      .withMessage("new password must contain 7 characters"),
    body("confirm_password")
      .isLength({ min: 7 })
      .withMessage("confirm password must contain 7 characters"),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ error: errors.errors[0] });

      const { new_password, confirm_password } = req.body;
      if (new_password != confirm_password)
        return res.status(401).json({
          error: [{ msg: "new password didn't mathch confirm password" }],
        });

      try {
        const hash = await bcrypt.hash(new_password, 10);
        await Admin.updateOne({ _id: req.userId }, { password: hash });
        res.json({ ok: "success" });
      } catch (error) {
        res.status(500).json({ error });
      }
    },
  ],

  admin_fetch_events_get: async (req, res) => {
    try {
      const events = await Event.find();
      res.status(200).json({ events });
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  admin_fetch_one_event_get: async (req, res) => {
    try {
      const id = req.params.eventId;
      const event = await Event.findById(id);
      res.status(200).json({ event });
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  admin_add_event_post: [
    body("event_name")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("event name must be specified")
      .isAlpha("en-US", { ignore: " " })
      .withMessage("event name must be in alphabetics"),
    body("date")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("event date must be specified"),
    body("type")
      .isLength({ min: 1 })
      .escape()
      .withMessage("event type must be specified")
      .isAlpha("en-US", { ignore: " " })
      .withMessage("event type must be in alphabetics"),
    body("days")
      .not()
      .isEmpty()
      .withMessage("event days must be specified")
      .isNumeric()
      .withMessage("event days must be in numeric"),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ error: errors.errors[0] });
      try {
        if (req.body.type === "Arts") {
          if (req.body.houses && req.body.houses.length > 0) {
            const { event_name, date, type, days, houses } = req.body;
            let temp = [];
            houses.forEach((item, index) => {
              temp.push({
                name: item,
                numbers: (index + 1) * 100,
              });
            });
            const groupe_points = [10, 5, 3];
            const single_points = [5, 3, 1];
            await Event.create({
              event_name,
              date,
              type,
              days,
              houses: temp,
              groupe_points,
              single_points,
            });
            return res.status(200).json({ ok: "ok" });
          } else {
            return res
              .status(400)
              .json({ error: { msg: "house must be specified" } });
          }
        } else {
          const { event_name, days, date, type } = req.body;
          await Event.create({ event_name, date, type, days });
          return res.status(200).json({ ok: "ok" });
        }
      } catch (error) {
        console.log(error);
        res.status(500).json({ error });
      }
    },
  ],

  admin_remove_event_get: async (req, res) => {
    try {
      await Event.findByIdAndDelete(req.params.id);
      await SingleProgram.deleteMany({ event_id: req.params.id });
      await GroupeProgram.deleteMany({ event_id: req.params.id });
      res.status(200).json({ ok: "ok" });
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  admin_edit_event_post: [
    body("event_name")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("event name must be specified")
      .isAlpha("en-US", { ignore: " " })
      .withMessage("event name must be in alphabetics"),
    body("date")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("event date must be specified"),
    body("type")
      .isLength({ min: 1 })
      .escape()
      .withMessage("event type must be specified")
      .isAlpha("en-US", { ignore: " " })
      .withMessage("event type must be in alphabetics"),
    body("days")
      .not()
      .isEmpty()
      .withMessage("event days must be specified")
      .isNumeric()
      .withMessage("event days must be in numeric"),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ error: errors.errors[0] });
      const id = req.params.id;
      try {
        if (req.body.type === "Arts") {
          if (req.body.houses && req.body.houses.length > 0) {
            const { event_name, date, days } = req.body;
            await Event.findByIdAndUpdate(id, {
              event_name,
              date,
              days,
            });
            return res.status(200).json({ ok: "ok" });
          } else {
            return res
              .status(400)
              .json({ error: { msg: "house must be specified" } });
          }
        } else {
          const { event_name, date, type } = req.body;
          await Event.findByIdAndUpdate(id, { event_name, date, type });
          return res.status(200).json({ ok: "ok" });
        }
      } catch (error) {
        console.log(error);
        res.status(500).json({ error });
      }
    },
  ],

  admin_fetch_programs_get: (req, res) => {
    const eventId = req.params.eventId;
    async.parallel(
      {
        singlePrograms(callback) {
          SingleProgram.find({ event_id: eventId }).populate('participants', 'name chestNo adm_no house').exec(callback);
        },
        groupePrograms(callback) {
          GroupeProgram.find({ event_id: eventId }).populate('groups.head_id', 'name adm_no house').populate('groups.members', 'name adm_no').exec(callback);
        },
        event(callback) {
          Event.findById(eventId).exec(callback);
        },
      },
      (error, result) => {
        if (error) return res.status(500).json({ error });

        res.status(200).json({
          single: result.singlePrograms,
          groupe: result.groupePrograms,
          event: result.event,
        });
      }
    );
  },

  admin_add_single_program_post: [
    body("program_name")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("program name must be specified"),
    body("description")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("description must be specified"),
    body("start_time")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("description must be specified"),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ error: errors.errors[0] });
      try {
        await SingleProgram.create({
          event_id: req.body.eventId,
          program_name: req.body.program_name,
          description: req.body.description,
          start_time: req.body.start_time,
          report_time: req.body.report_time,
          type: req.body.type ? req.body.type : undefined,
        });
        res.status(200).json({ ok: "ok" });
      } catch (error) {
        console.log(error);
        res.status(500).json({ error });
      }
    },
  ],

  admin_remove_single_get: async (req, res) => {
    const { id } = req.params;
    try {
      await SingleProgram.findByIdAndDelete(id);
      res.status(200).json({ ok: "ok" });
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  admin_add_groupe_program_post: [
    body("program_name")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("program name must be specified"),
    body("description")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("description must be specified"),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ error: errors.errors[0] });
      try {
        const data = await Event.findById(req.body.eventId, "houses");
        let temp = [];
        data.houses.forEach((item) => {
          temp.push({
            house: item.name,
            items: 0,
          });
        });
        await GroupeProgram.create({
          event_id: req.body.eventId,
          program_name: req.body.program_name,
          description: req.body.description,
          start_time: req.body.start_time,
          report_time: req.body.report_time,
          limit: [...temp],
          type: req.body.type ? req.body.type : undefined,
        });

        res.status(200).json({ ok: "ok" });
      } catch (error) {
        console.log(error);
        res.status(500).json({ error });
      }
    },
  ],

  admin_remove_groupe_get: async (req, res) => {
    const { id } = req.params;
    try {
      await GroupeProgram.findByIdAndDelete(id);
      res.status(200).json({ ok: "ok" });
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  admin_fetch_groupe_program: async (req, res) => {
    const { id } = req.params;
    try {
      const groupeProgram = await GroupeProgram.findById(id).populate('groups.head_id', 'name adm_no').populate('groups.members', 'name adm_no');
      res.status(200).json({ groupeProgram });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error });
    }
  },

  admin_fetch_single_program: async (req, res) => {
    const { id } = req.params;
    try {
      const singleProgram = await SingleProgram.findById(id).populate('participants', 'name chestNo adm_no house');
      res.status(200).json({ singleProgram });
    } catch (error) {
      res.status(500).json({ error });
      console.log("er"+error);
    }
  },

  admin_update_groupe_program: [
    body("program_name")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("program name must be specified"),
    body("description")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("description must be specified"),
    body("start_time")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("description must be specified"),
    async (req, res) => {
      const { id } = req.params;
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ error: errors.errors[0] });
      const { program_name, description, start_time, report_time } = req.body;
      try {
        await GroupeProgram.findByIdAndUpdate(id, {
          program_name,
          description,
          start_time,
          report_time,
          type: req.body.type ? req.body.type : undefined,
        });
        res.status(200).json({ ok: "ok" });
      } catch (error) {
        console.log(error);
        res.status(500).json({ error });
      }
    },
  ],

  admin_update_single_program: [
    body("program_name")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("program name must be specified"),
    body("description")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("description must be specified"),
    body("start_time")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("description must be specified"),
    async (req, res) => {
      const { id } = req.params;
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ error: errors.errors[0] });
      const { program_name, description, start_time, report_time } = req.body;
      console.log(program_name);
      try {
        await SingleProgram.findByIdAndUpdate(id, {
          program_name,
          description,
          start_time,
          report_time,
          type: req.body.type ? req.body.type : undefined,
        });
        res.status(200).json({ ok: "ok" });
      } catch (error) {
        console.log(error);
        res.status(500).json({ error });
      }
    },
  ],

  admin_finish_single_post: async(req, res) => {
    const { proId } = req.params;
    const { first, second, third, eventId } = req.body;

    if(first != -1){
      try {
        const {single_points: points} = await Event.findById(eventId, "single_points")
        await User.findByIdAndUpdate(first.id, {
          $inc: { points: points[0]}
        })
        await Event.updateOne({_id: eventId, "houses.name": first.house}, { $inc: { "houses.$.overall": points[0] } })
        if(second != -1){
          await User.findByIdAndUpdate(second.id, { $inc: { points: points[1]} })
          await Event.updateOne({_id: eventId, "houses.name": second.house}, { $inc: { "houses.$.overall": points[1] } })
        }
        if(third != -1){
          await User.findByIdAndUpdate(third.id, { $inc: { points: points[2]} })
          await Event.updateOne({_id: eventId, "houses.name": third.house}, { $inc: { "houses.$.overall": points[2] } })
        }
        await SingleProgram.findByIdAndUpdate(proId, {
          $set: {
            finished: true,
            first: first.id,
            second: second != -1? second.id: null,
            third: third != -1? third.id: null
          }
        })
        return res.status(200).json({ ok: "ok" });
      } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
      }
    }
    
  },

  admin_finish_group_post: async(req, res) => {
    const { proId } = req.params;
    const { first, second, third, eventId } = req.body;
    console.log(first);
    if(first != -1){
      try {
        const {groupe_points: points} = await Event.findById(eventId, "groupe_points")
        await GroupeProgram.updateOne({_id: proId, "groups.head_id": first.head_id}, {
          $set: {
            "groups.$.points": points[0]
          }
        })
        console.log(first.house);
        await Event.updateOne({_id: eventId, "houses.name": first.house}, { $inc: { "houses.$.overall": points[0] } })
        first.members.forEach(async(user)=> await User.findByIdAndUpdate(user, { $inc: { points: 3} }) )
        if(second != -1){
          await GroupeProgram.updateOne({_id: proId, "groups.head_id": second.head_id}, { $set: { "groups.$.points": points[1] } } )
          await Event.updateOne({_id: eventId, "houses.name": second.house}, { $inc: { "houses.$.overall": points[1] } })
          second.members.forEach(async(user)=> await User.findByIdAndUpdate(user, { $inc: { points: 2} }) )
        }
        if(third != -1){
          await GroupeProgram.updateOne({_id: proId, "groups.head_id": third.head_id}, { $set: { "groups.$.points": points[2] } } )
          await Event.updateOne({_id: eventId, "houses.name": third.house}, { $inc: { "houses.$.overall": points[2] } })
          third.members.forEach(async(user)=> await User.findByIdAndUpdate(user, { $inc: { points: 1} }) )
        }
        await GroupeProgram.findByIdAndUpdate(proId, {
          $set: {
            finished: true,
            first: first.head_id,
            second: second != -1? second.head_id: null,
            third: third != -1? third.head_id: null
          }
        })
        return res.status(200).json({ ok: "ok" });
      } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
      }
    }
  },

  admin_get_event_score: async(req, res) => {
    const { eventId } = req.params;
    try {
      const scores = await Event.findById(eventId, "houses.name houses.overall");
      return res.status(200).json({ scores: scores.houses });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  },

  admin_get_individual_points: async(req, res) => {
    const {eventId} = req.params;
    try {
      const participants = await User.find({}, "name house points").sort({points: -1})
      return res.status(200).json({ participants });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

};
