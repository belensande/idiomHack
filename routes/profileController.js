var express = require('express');
var router = express.Router();
const multer = require('multer');
const upload = multer({ dest: './public/images/profile' });

// User model
const User = require("../models/user");
const Language = require("../models/language");
const Relationship = require("../models/relationship");

// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;

const genders = User.schema.path('gender').enumValues;
const cities = User.schema.path('city').enumValues;

router.use("/", function (req, res, next) {
	isLoggedIn(req, res, next);
});

router.get('/search', function (req, res, next) {
	Language.find((err, languages) => {
		if (err) {
			next(err);
			return;
		}
		res.render("profile/search", { userInfo: {}, languages, genders, cities});
	});
});

router.post('/', function (req, res, next) {
	let userInfo = {
		name: req.body.name,
		gender: req.body.gender,
		city: req.body.city,
		languagesOffered: JSON.parse(req.body.languagesOffered),
		languagesDemanded: JSON.parse(req.body.languagesDemanded)
	};
	Language.find((err, languages) => {
		if (err) {
			next(err);
			return;
		}
		if (Object.keys(userInfo).every((key) => {
			return !userInfo[key];
		})) {
			res.render("profile/search", { message: "You must fill any field", userInfo, languages, genders, cities });
		} else {
			let query = Object.keys(userInfo).reduce((value, key) => {
				if (userInfo[key]) {
					if (Array.isArray(userInfo[key])) {
						if (userInfo[key].length) {
							value[key] = { $all: userInfo[key] };
						}
					} else {
						value[key] = userInfo[key];
					}
				}
				return value;
			}, {});

			User.find(query).populate({
				path: 'languagesOffered',
				model: 'Language'
			}).populate({
				path: 'languagesDemanded',
				model: 'Language'
			}).exec(
				(err, users) => {
					if (err) {
						mext(err);
						return;
					}
					if (!users || !users.length) {
						res.render("profile/search", { message: "No users found", userInfo, languages, genders, cities });
						return;
					}
					res.render("profile/index", { users });
				});
		}
	});
});

router.get('/:id', function (req, res, next) {
	if (req.session.currentUser._id === req.params.id) {
		res.render('profile/show', { user: req.session.currentUser });
	} else {
		User.findById(req.params.id).populate({
			path: 'languagesOffered',
			model: 'Language'
		}).populate({
			path: 'languagesDemanded',
			model: 'Language'
		}).exec((err, user) => {
			if (err || !user) {
				next(err || new Error("User not found"));
				return;
			}
			Relationship.findOne({ users: { $all: [req.session.currentUser._id, user._id.toString()] } }, (err, rel) => {
				if (err) {
					next(err);
					return;
				}
				let typeRel = "";
				if (rel && rel.accepted) {
					typeRel = "friends";
				} else if (rel && rel.users[0] == req.session.currentUser._id) {
					typeRel = "waiting";
				} else if (rel && rel.users[1] == req.session.currentUser._id) {
					typeRel = "pending";
				}
				res.render('profile/show', { user, typeRel });
			});
		});
	}
});

router.get('/:id/edit', function (req, res, next) {
	if (req.session.currentUser._id === req.params.id) {
		Language.find((err, languages) => {
			if (err) {
				next(err);
				return;
			}
			res.render('profile/edit', { languages, genders, cities, userInfo: req.session.currentUser });
		});
	} else {
		res.redirect('/login');
	}
});

router.post('/:id', upload.single('photo'), function (req, res, next) {
	if (req.session.currentUser._id === req.params.id) {
		let userInfo = {
			name: req.body.name,
			password: req.body.password,
			email: req.body.email,
			gender: req.body.gender,
			city: req.body.city,
			description: req.body.description,
			interests: req.body.interests,
			languagesOffered: JSON.parse(req.body.languagesOffered),
			languagesDemanded: JSON.parse(req.body.languagesDemanded),
			imageUrl: req.body.imageUrl
		};

		if (req.file) {
			userInfo["imageUrl"] = `/images/profile/${req.file.filename}`;
		}

		Language.find((err, languages) => {
			if (err) {
				next(err);
				return;
			}

			if (req.body.name === "" || req.body.password === "" || req.body.email === "") {
				res.render("profile/edit", {
					message: "Indicate a name, password and email.", languages, genders, cities, userInfo
				});
				return;
			}

			if (userInfo.email != req.session.currentUser.email) {
				User.findOne({ "email": req.body.email }, (err, user) => {
					if (err) {
						next(err);
						return;
					}
					if (user !== null) {
						res.render("profile/edit", {
							message: "Email registered before", languages, genders, cities, userInfo
						});
						return;
					}
				});
			}

			if (userInfo.name != req.session.currentUser.name) {
				User.findOne({ "name": req.body.name }, (err, user) => {
					if (err) {
						next(err);
						return;
					}
					if (user !== null) {
						res.render("profile/edit", {
							message: "Name already exists", languages, genders, cities, userInfo
						});
						return;
					}
				});
			}

			if (userInfo.password != req.session.currentUser.password) {
				const salt = bcrypt.genSaltSync(bcryptSalt);
				const hashPass = bcrypt.hashSync(userInfo.password, salt);

				userInfo["password"] = hashPass;
			}

			User.findByIdAndUpdate(req.params.id, { $set: userInfo }, { new: true })
				.populate({
					path: 'languagesOffered',
					model: 'Language'
				}).populate({
					path: 'languagesDemanded',
					model: 'Language'
				}).exec((err, user) => {
					if (err) {
						next(err);
						return;
					}

					req.session.currentUser = user;

					res.redirect("/dashboard");
			});
		});
	} else {
		res.redirect('/login');
	}
});

function isLoggedIn(req, res, next) {
		if (req.session.currentUser) {
			next();
		} else {
			res.redirect('/login');
		}
}

module.exports = router;