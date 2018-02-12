const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: './public/images/flags' });

const Language = require("../../models/language");

router.use('/', checkRoles('Admin'), (req, res, next) => {
	next();
});

router.get("/", (req, res, next) => {
	Language.find((err, languages) => {
		if (err) {
			next(err);
		} else {
			res.render("languages/index", { languages });
		}
	});
});

router.get("/new", (req, res, next) => {
	res.render('languages/new', { message: '' } );
});


router.post("/", upload.single('photo'), (req, res, next) => {

	let languageInfo = {
		"name": req.body.name
	};

	if (languageInfo.name === "") {
		res.render('languages/new', { message: 'Name is mandatory' });
	}

	Language.findOne({ name: languageInfo.name }, (err, lang) => {
		if (err) {
			next(err);
			return;
		}

		if (lang) {
			res.render('languages/new', { message: `There's already a language named ${languageInfo.name}` });
			return;
		}

		if (req.file) {
			languageInfo["flagImgPath"] = `/images/flags/${req.file.filename}`;
		}

		let newLanguage = new Language(languageInfo);

		newLanguage.save((saveErr) => {
			if (saveErr) {
				if (saveErr.name == 'ValidationError') {
					res.render("languages/new", { message: saveErr.errors[0].message });
				} else {
					next(err);
				}
				return;
			}
			res.redirect('/languages');
		});

	});
});

function checkRoles(role) {
	return function (req, res, next) {
		if (req.session.currentUser && req.session.currentUser.role === role) {
			return next();
		} else {
			res.redirect('/login');
		}
	}
}

module.exports = router;