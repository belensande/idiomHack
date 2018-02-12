const express = require("express");
const authController = express.Router();
const multer = require('multer');
const upload = multer({ dest: './public/images/profile' });

// User model
const User = require("../models/user");
const Language = require("../models/language");

// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;

const genders = User.schema.path('gender').enumValues;
const cities = User.schema.path('city').enumValues;

authController.get("/", (req, res, next) => {
	if (!req.session.currentUser) {
		res.redirect('/login');
		return;
	}
	res.redirect(`/dashboard`);
});

authController.get("/login", (req, res, next) => {
	res.render("auth/login", {
		message: ""
	});
});

authController.post("/login", (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;

	if (email === "" || password === "") {
		res.render("auth/login", {
			message: "Indicate an email and a password to log in"
		});
		return;
	}

	User.findOne({ "email": email }).populate({
		path: 'languagesOffered',
		model: 'Language'
	}).populate({
		path: 'languagesDemanded',
		model: 'Language'
	}).exec(
		(err, user) => {
			if (err || !user) {
				res.render("auth/login", {
					message: "There's no user with that email"
				});
				return;
			} else {
				if (bcrypt.compareSync(password, user.password)) {
					req.session.currentUser = user;
					return res.redirect(`/dashboard`);
				} else {
					res.render("auth/login", {
						message: "Incorrect password"
					});
					return;
				}
			}
		});
});

authController.get("/logout", (req, res, next) => {
	if (!req.session.currentUser) {
		res.redirect('/');
		return;
	}

	req.session.destroy((err) => {
		if (err) {
			return next(err);
		}
		res.redirect("/login");
	});
});

authController.get("/signup", (req, res, next) => {
	Language.find((err, languages) => {
		if (err) {
			next(err);
			return;
		}
		res.render("auth/signup", { languages, genders, cities, userInfo: {} });
	});
});

authController.post("/signup", upload.single('photo'), (req, res, next) => {
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
			res.render("auth/signup", {
				message: "Indicate a name, password and email to sign up", languages, genders, cities, userInfo
			});
			return;
		}

		User.findOne({ "email": req.body.email }, (err, user) => {
			if (err) {
				next(err);
				return;
			}
			if (user !== null) {
				res.render("auth/signup", {
					message: "Email registered before", languages, genders, cities, userInfo
				});
				return;
			}
		});

		User.findOne({ "name": req.body.name }, (err, user) => {
			if (err) {
				next(err);
				return;
			}
			if (user !== null) {
				res.render("auth/signup", {
					message: "Name already exists", languages, genders, cities, userInfo
				});
				return;
			}
		});

		const salt = bcrypt.genSaltSync(bcryptSalt);
		const hashPass = bcrypt.hashSync(req.body.password, salt);

		userInfo["password"] = hashPass;

		let newUser = new User(userInfo);

		newUser.save((err) => {
			if (err) {
				next(err);
				return;
			}

			res.redirect("/");
		});
	});
});

module.exports = authController;