const User = require("../models/user");
const bcrypt = require("bcryptjs");
const Event = require("../models/events");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const singleProgram = require("../models/singleProgram");
const groupeProgram = require("../models/groupeProgram");
const events = require("../models/events");
const async = require("async");

module.exports = {
  user_register_post: [
    body("name")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("name must be specified.")
      .isAlpha("en-US", { ignore: " " })
      .withMessage("name must be in alphabetics"),
    body("adm_no")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("Admission number must be specified.")
      .isNumeric()
      .withMessage("Admission number must be numeric"),
    body("mobile")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("Mobile number must be specified.")
      .isNumeric()
      .withMessage("Mobile number must be numeric"),
    body("year")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("Year must be specified.")
      .isLength({ max: 1 })
      .withMessage("year length must be 1"),
    body("department")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("Department must be specified.")
      .isAlpha("en-US", { ignore: " " })
      .withMessage("department must be in alphabetics"),
    body("password")
      .isLength({ min: 8 })
      .escape()
      .withMessage("password require minimum of 8 characters"),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.errors[0] });
      }
      const { name, adm_no, mobile, year, department, password } = req.body;

      const isAdmNo = await User.findOne({ adm_no: adm_no });
      if (isAdmNo)
        return res
          .status(401)
          .json({ error: { msg: "Admission number already taken" } });
      const isMobile = await User.findOne({ mobile: mobile });
      if (isMobile)
        return res
          .status(401)
          .json({ error: { msg: "mobile number already taken" } });

      try {
        await User.create({ name, adm_no, mobile, department, year, password });
        res.status(200).json({ ok: "ok" });
      } catch (error) {
        res.status(500).json({ error });
      }
    },
  ],

  user_login_post: [
    body("adm_no")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("Admission number must be specified.")
      .isNumeric()
      .withMessage("Admission number must be numeric"),
    body("password")
      .trim()
      .isLength({ min: 8 })
      .escape()
      .withMessage("password require minimum of 8 characters"),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.errors[0] });
      }

      try {
        const user = await User.findOne({ adm_no: req.body.adm_no });
        if (!user)
          return res.status(401).json({
            error: { msg: "Admission number not found! try register" },
          });

        const isPasswordMatch = await bcrypt.compare(
          req.body.password,
          user.password
        );
        if (!isPasswordMatch)
          return res.status(401).json({ error: { msg: "incorrect password" } });

        const payload = {
          id: user._id,
          username: user.name,
        };
        jwt.sign(
          payload,
          process.env.SECRET,
          { expiresIn: "1d" },
          (err, token) => {
            if (err) return res.status(500).json({ err });
            res.status(200).json({ token });
            console.log(user.name);
          }
        );
      } catch (error) {
        res.status(500).json({ error });
      }
    },
  ],
  user_enroll_single_post: async (req, res) => {
    const { proId } = req.params;
    const { userId, type, house, eventId } = req.body;
    try {
      if (type === "off-stage" || type === "on-stage") {
        const user = await User.findById(userId, "limit chestNo");
        if (type === "off-stage") {
          if (user.limit.offStage === 4)
            return res.status(400).json({
              msg: "You can not enroll more than 4 programs in off-satge type",
            });
          await singleProgram.updateOne(
            { _id: proId },
            { $push: { participants: userId } }
          );
          await User.updateOne(
            { _id: userId },
            { $set: { "limit.offStage": ++user.limit.offStage } }
          );
        } else if (type === "on-stage") {
          if (user.limit.onStage === 4)
            return res.status(400).json({
              msg: "You can not enroll more than 4 individual programs in on-satge type",
            });
          await singleProgram.updateOne(
            { _id: proId },
            { $push: { participants: userId } }
          );
          await User.updateOne(
            { _id: userId },
            { $set: { "limit.onStage": ++user.limit.onStage } }
          );
        }
        if(user.chestNo == 0){
            const event = await Event.findById(eventId);
            let number;
            event.houses.forEach(item=>{
                if(item.name == house)
                number = item.numbers[item.numbers.length-1];
            });
            await Event.updateOne({_id: eventId, "houses.name": house}, {$push: {"houses.$.numbers": number+1}});
            await User.findByIdAndUpdate(userId, {chestNo: number+1});
        } 
        return res.status(200).json({ ok: "ok" });
      }

      await singleProgram.updateOne(
        { _id: proId },
        { $push: { participants: userId } }
      );
      res.status(200).json({ ok: "ok" });
    } catch (error) {
        console.log(error);
      res.status(500).json({ error });
    }
  },
  user_fetch_single_get: async (req, res) => {
    const { eventId, userId } = req.params;
    try {
      const single = await singleProgram.find({
        event_id: eventId,
        participants: { $nin: userId },
      });
      res.status(200).json({ single });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error });
    }
  },

  user_fetch_groupe_get: async (req, res) => {
    const { eventId, userId } = req.params;
    try {
      const groupe = await groupeProgram.find({
        event_id: eventId,
        "groups.head_id": { $nin: userId },
        groups: {$not: {$elemMatch: {members: userId}}}
      });

      res.status(200).json({ groupe });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error });
    }
  },

  user_fetch_enrolled_get: (req, res) => {
    const { eventId, userId } = req.params;
    async.parallel(
      {
        single(callback) {
          singleProgram
            .find({ event_id: eventId, participants: { $in: userId } })
            .exec(callback);
        },
        groupe_head(callback) {
          groupeProgram
            .find({ event_id: eventId, "groups.head_id": userId })
            .exec(callback);
        },
        groupe_member(callback) {
          groupeProgram
            .find({ event_id: eventId, groups: {$elemMatch:{members: userId}} })
            .exec(callback);
        },
      },
      (error, result) => {
        if (error) return res.status(500).json({ error });
        res.status(200).json({
          enrolled: [result.single, [...result.groupe_head, ...result.groupe_member]],
        });
      }
    );
  },

  user_enroll_groupe_post: async (req, res) => {
    const { proId } = req.params;
    const { groupe, type } = req.body;
    try {
      if (type === "off-stage" || type === "on-stage") {
        const program = await groupeProgram.findById(proId, "limit");
        let index;
        program.limit.forEach((item, i) => {
          if (item.house === groupe.house) {
            index = i;
          }
        });
        if (type === "off-stage") {
          if (program.limit[index].items === 3)
            return res.status(400).json({
              msg: `${groupe.house} house has already 3 teams in this program`,
            });
            await User.findByIdAndUpdate(groupe.head_id, { $inc: { "limit.offStage": 1 } });
            let temp = groupe.members;
            temp = [...new Set(temp)]
            temp.forEach(async item=>{
                await User.findByIdAndUpdate(item, { $inc: { "limit.offStage": 1 } });
            });
            
        } else if (type === "on-stage") {
          if (program.limit[index].items === 2)
            return res.status(400).json({
              msg: `${groupe.house} house has already 3 teams in this program`,
            });
        }
        await groupeProgram.updateOne(
          { _id: proId, "limit.house": groupe.house },
          {
            $set: {
              "limit.$.items": ++program.limit[index].items,
            },
            $push: { groups: groupe },
          }
        );
        return res.status(200).json({ ok: "ok" });
      }
      await groupeProgram.updateOne(
        { _id: proId },
        { $push: { groups: groupe } }
      );
      res.status(200).json({ ok: "ok" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error });
    }
  },

  user_fetch_houses_get: async (req, res) => {
    const { eventId } = req.params;
    try {
      const houses = await events.findById(eventId, "houses");
      if (houses) return res.status(200).json({ houses });

      return res.json({ msg: "no houses" });
    } catch (error) {
      res.status(500).json({ error });
    }
  },

  user_fetch_house_get: async (req, res) => {
    const { userId } = req.params;
    try {
      const user = await User.findById(userId, "house");
      return res.status(200).json({ house: user.house });
    } catch (error) {
      return res.status(500).json({ error });
    }
  },

  user_set_house_post: async (req, res) => {
    const { userId } = req.params;
    const { house } = req.body;
    try {
      await User.findByIdAndUpdate(userId, { house });
      return res.status(200).json({ ok: "ok" });
    } catch (error) {
      return res.status(500).json({ error });
    }
  },

  user_check_limit_0ff_stage_get: async (req, res) => {
    const { admNo } = req.params;
    try {
      const user = await User.findOne({ adm_no: admNo }, "limit");
      if (user.limit.offStage === 4)
        return res.status(400).json({
          msg: "user can not enroll more than 4 programs in off-satge type",
        });
      res.status(200).json({ user });
    } catch (error) {
      return res.status(500).json({ error });
    }
  },

  user_check_limit_on_stage_get: async (req, res) => {
    const { admNo } = req.params;
    try {
      const user = await User.findOne({ adm_no: admNo }, "limit");
      if (user.limit.onStage === 4)
        return res.status(400).json({
          msg: "user can not enroll more than 4 inidividula programs in on-satge type",
        });
      res.status(200).json({ user });
    } catch (error) {
      return res.status(500).json({ error });
    }
  },
};
