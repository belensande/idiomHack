const express = require('express');
const router = express.Router();
const moment = require('moment');

const Relationship = require("../models/relationship");
const Message = require("../models/message");

router.get('/dashboard', function (req, res, next) {
	if (req.session.currentUser) {
		Relationship.find({ users: req.session.currentUser._id})
			.populate({
				path: 'messages',
				model: 'Message'
			}).exec((err, relations) => {
				if (err) {
					return next(err);
				}
				let pending = 0;
				let requests = 0;
				let accepted = [];
				let newMessages = 0;
				let lastMessage;
				relations.forEach(rel => {
					if (rel.accepted) {
						if (rel.messages && rel.messages.length) {
							rel.messages.sort((a, b) => { return Math.abs(b.created_at - a.created_at); });
							rel.newMessages = rel.messages.reduce((total, msg) => {
								if (msg.reciever.toString() == req.session.currentUser._id && !msg.read) {
									return ++total;
								}
								return total;
							}, 0);
							newMessages += rel.newMessages;
						}
						accepted.push(rel);
					}
					accepted.sort((a, b) => { return Math.abs(b.messages.length ? b.messages[0].created_at : 0 - a.messages.length ? a.messages[0].created_at : 0); });
					if (accepted.length && accepted[0].messages.length) {
						lastMessage = accepted[0].messages[0].created_at;
					}
					if (rel.users[0]._id == req.session.currentUser._id && !rel.accepted) {
						request++;
					}
					if (rel.users[0]._id != req.session.currentUser._id && !rel.accepted) {
						pending++;
					}
				});
				relations.sort((a, b) => { return Math.abs(b.messages.length ? b.messages[0].created_at : 0 - a.messages.length ? a.messages[0].created_at : 0) });
				res.render('dashboard', { newMessages, accepted, pending, requests, lastMessage, moment});
			});
	} else {
		res.redirect('/login');
	}
});

module.exports = router;
