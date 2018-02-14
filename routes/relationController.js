var express = require('express');
var router = express.Router();

const User = require("../models/user");
const Relationship = require("../models/relationship");
const Message = require("../models/message");

router.use("/", function (req, res, next) {
	isLoggedIn(req, res, next);
});

router.get("/", function (req, res, next) {
	Relationship.find({ users: req.session.currentUser._id, accepted: true })
	.populate({
		path: 'users',
		model: 'User',
		populate: [{
			path: 'languagesOffered',
			model: 'Language'
		},
		{
			path: 'languagesDemanded',
			model: 'Language'
		}]
		})
	.populate({
		path: 'messages',
		model: 'Message'
	}).exec((err, relations) => {
		if (err) {
			next(err);
			return;
		}
		relations.forEach(rel => {
			rel.messagesCount = rel.messages.length;
			rel.messagesUnread = rel.messages.reduce((total, msg) => {
				if (msg.reciever.toString() == req.session.currentUser._id && !msg.read) {
					return ++total;
				}
				return total;
			}, 0);
		});
		res.render("relations/index", { relations });
	});
});

router.get("/:id/askContact", function (req, res, next) {
	if (req.params.id == req.session.currentUser._id) {
		next(new Error("Can't connect with yourself"));
		return;
	}
	User.findById(req.params.id, (err, user) => {
		if (err || !user) {
			next(err || new Error("User not found"));
			return;
		}

		Relationship.findOne({ users: { $all: [req.session.currentUser._id, user._id] } }, (err, rel) => {
			if (err || rel) {
				next(err || new Error("Already exists a connection"));
				return;
			}

			let relation = new Relationship({
				users: [req.session.currentUser._id, user._id]
			});

			relation.save((err) => {
				if (err) {
					next(err);
					return;
				}

				res.redirect("/relations");
			});
		});
	});
});

router.get("/:id/acceptContact", function (req, res, next) {
	if (req.params.id == req.session.currentUser._id) {
		next(new Error("Can't connect with yourself"));
		return;
	}
	User.findById(req.params.id, (err, user) => {
		if (err || !user) {
			next(err || new Error("User not found"));
			return;
		}

		Relationship.findOne({ users: { $all: [req.session.currentUser._id, user._id] } }, (err, rel) => {
			if (err || !rel) {
				next(err || new Error("Connection not found"));
				return;
			}

			if (rel.users[0] == req.session.currentUser._id) {
				next(new Error("Waiting for user to accept"));
				return;
			}

			rel.set({ accepted: true });
			rel.save((err, updatedTank) => {
				if (err) {
					next(err);
					return;
				}

				res.redirect("/relations");
			});
		});
	});
});

router.get("/:id/send", function (req, res, next) {
	if (req.params.id == req.session.currentUser._id) {
		next(new Error("Can't send message to yourself"));
		return;
	}
	User.findById(req.params.id, (err, user) => {
		if (err || !user) {
			next(err || new Error("User not found"));
			return;
		}

		Relationship.findOne({ users: { $all: [req.session.currentUser._id, user._id] } }, (err, rel) => {
			if (err || !rel) {
				next(err || new Error("Connection not found"));
				return;
			}

			if (!rel.accepted) {
				next(new Error("Connection not confirmed"));
				return;
			}

			res.render("relations/send", { contact: req.params.id });
		});
	});
});

router.post("/:id", function (req, res, next) {
	if (!req.body.text) {
		res.render("relations/send", { message: "Write a message", contact: req.params.id });
		return;
	}
	if (req.params.id == req.session.currentUser._id) {
		next(new Error("Can't send message to yourself"));
		return;
	}
	User.findById(req.params.id, (err, user) => {
		if (err || !user) {
			next(err || new Error("User not found"));
			return;
		}

		Relationship.findOne({ users: { $all: [req.session.currentUser._id, user._id] } }, (err, rel) => {
			if (err || !rel) {
				next(err || new Error("Connection not found"));
				return;
			}

			if (!rel.accepted) {
				next(new Error("Connection not confirmed"));
				return;
			}

			const newMessage = new Message({
				relation: rel._id,
				sender: req.session.currentUser._id,
				reciever: req.params.id,
				text: req.body.text
			});

			newMessage.save((err, msg) => {
				if (err || !msg) {
					next(err || new Error("Message not inserted"));
				}
				res.redirect("/relations");
			});
		});
	});
});

function isLoggedIn(req, res, next) {
	if (req.session.currentUser) {
		next();
	} else {
		res.redirect('/login');
	}
}

module.exports = router;