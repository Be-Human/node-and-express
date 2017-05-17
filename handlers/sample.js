const jqupload = require('jquery-file-upload-middleware')

exports.fail = function (req, res) {
	throw new Error('Nope!')
}
exports.jqueryTest = function(req, res){
	res.render('jquery-test');
};

exports.nurseryRhyme = function(req, res){
	res.render('nursery-rhyme');
};

exports.nurseryRhymeData = function(req, res){
	res.json({
		animal: 'squirrel',
		bodyPart: 'tail',
		adjective: 'bushy',
		noun: 'heck',
	});
};

exports.epicFail = function(req, res){
    process.nextTick(function(){
        throw new Error('Kaboom!');
    });
};

// jQuery File Upload endpoint middleware
exports.upload = function(req, res, next){
	var now = Date.now();
	jqupload.fileHandler({
		uploadDir: function(){
			return __dirname + '/public/uploads/' + now;
		},
		uploadUrl: function(){
			return '/uploads/' + now;
		},
	})(req, res, next);
}

exports.process = function(req, res){
	if (req.xhr || req.accepts('json, html') === 'json') {
		res.send({success: true})
	} else {
		console.log('Form (from querystring): ' + req.query.form); 
		console.log('CSRF token (from hidden form field): ' + req.body._csrf); 
		console.log('Name (from visible form field): ' + req.body.name); 
		console.log('Email (from visible form field): ' + req.body.email); 
		res.redirect(303, '/thank-you');
	}
}