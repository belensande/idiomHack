var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/dashboard', function (req, res, next) {
	if (req.session.currentUser) {
		res.render('dashboard');
	} else {
		res.redirect('/login');
	}
});

module.exports = router;
