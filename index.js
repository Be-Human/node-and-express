const http = require('http')
	, express = require('express')
	, bodyParser = require('body-parser')
	, session = require('express-session')
	, fortune = require('./lib/fortune.js')
	, weatherData = require('./lib/weatherData.js')
	, credentials = require('./lib/credentials.js')
	, formidable = require('formidable')
	, emailService = require('./lib/email.js')(credentials)
	, jqupload = require('jquery-file-upload-middleware')
	, app = express()

const handlebars = require('express-handlebars').create({
    defaultLayout:'main',
    helpers: {
        section: function(name, options){
            if(!this._sections) this._sections = {}
            this._sections[name] = options.fn(this)
            return null
        }
    }
})


// app.enable('trust proxy');
app.disable('x-powered-by')
app.engine('handlebars', handlebars.engine)
app.set('view engine', 'handlebars')
app.set('port', process.env.PORT || 3001)

// use domains for better error handling
app.use(function(req, res, next){
    // create a domain for this request
    var domain = require('domain').create();
    // handle errors on this domain
    domain.on('error', function(err){
        console.error('DOMAIN ERROR CAUGHT\n', err.stack);
        try {
            // failsafe shutdown in 5 seconds
            setTimeout(function(){
                console.error('Failsafe shutdown.');
                process.exit(1);
            }, 5000);

            // disconnect from the cluster
            var worker = require('cluster').worker;
            if(worker) worker.disconnect();

            // stop taking new requests
            server.close();

            try {
                // attempt to use Express error route
                next(err);
            } catch(error){
                // if Express error route failed, try
                // plain Node response
                console.error('Express error mechanism failed.\n', error.stack);
                res.statusCode = 500;
                res.setHeader('content-type', 'text/plain');
                res.end('Server error.');
            }
        } catch(error){
            console.error('Unable to send 500 response.\n', error.stack);
        }
    })

    // add the request and response objects to the domain
    domain.add(req);
    domain.add(res);

    // execute the rest of the request chain in the domain
    domain.run(next);
});

// logging
switch(app.get('env')){
    case 'development':
    	// compact, colorful dev logging
    	app.use(require('morgan')('dev'));
        break;
    case 'production':
        app.use(require('morgan')('tiny'));
        break;
}
app.use(express.static(__dirname+'/public'))
app.use(bodyParser.urlencoded({ extended:false }))
app.use(session({
	secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))

// flash message middleware
app.use(function(req, res, next){
	// if there's a flash message, transfer
	// it to the context, then clear it
	res.locals.flash = req.session.flash;
	delete req.session.flash;
	next();
});

app.use(function (req, res, next) {
    res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1'
    next()
})

// middleware to add weather data to context
app.use(function(req, res, next){
	if(!res.locals.partials) res.locals.partials = {};
 	res.locals.partials.weatherContext = weatherData.getWeatherData();
 	next();
});


app.get('/', function (req, res) {
    // console.log(req.cookies)
    // console.log(req.signedCookies)
    
    res.render('home', {
        currency: {
            name: 'United States dollars',
            abbrev: 'USD',
        }, 
        tours: [
            { name: 'Hood River', price: '$99.95' },
            { name: 'Oregon Coast', price: '$159.95' }
        ],
        specialsUrl: '/january-specials',
        currencies: [ 'USD', 'GBP', 'BTC' ],
    })
})

app.get('/headers', function(req,res){
    res.set('Content-Type','text/plain');
    var s ='';
    for(var name in req.headers) s += name + ': ' + req.headers[name] + '\n'
    res.send(s);
})

app.get('/about', function (req, res) {
    res.render('about', { 
        fortune: fortune.getFortune(),
        pageTestScript: '/qa/tests-about.js'
    })
})

app.get('/tours/hood-river', function(req, res){
    res.render('tours/hood-river');
});

app.get('/tours/request-group-rate', function(req, res){
    res.render('tours/request-group-rate');
});

app.get('/jquery-test', function(req, res){
	res.render('jquery-test');
});
app.get('/nursery-rhyme', function(req, res){
	res.render('nursery-rhyme');
});
app.get('/data/nursery-rhyme', function(req, res){
	res.json({
		animal: 'squirrel',
		bodyPart: 'tail',
		adjective: 'bushy',
		noun: 'heck',
	});
});
app.get('/thank-you', function(req, res){
	res.render('thank-you');
});
app.get('/newsletter', function(req, res) {
    res.render('newsletter', {csrf: 'CSRF token goes here'})
})

app.post('/process', function(req, res){
    if (req.xhr || req.accepts('json, html') === 'json') {
        res.send({success: true})
    } else {
        console.log('Form (from querystring): ' + req.query.form); 
        console.log('CSRF token (from hidden form field): ' + req.body._csrf); 
        console.log('Name (from visible form field): ' + req.body.name); 
        console.log('Email (from visible form field): ' + req.body.email); 
        res.redirect(303, '/thank-you');
    }
})

app.get('/contest/vacation-photo',function(req,res){ 
    var now = new Date();
    res.render('contest/vacation-photo',{
        year: now.getFullYear(),month: now.getMonth()
    });
});

app.post('/contest/vacation-photo/:year/:mouth', function (req, res) {
    let form = new formidable.IncomingForm()
    form.parse(req, function(err, fields, files){
        if(err) return res.redirect(303, '/error'); 
        console.log('received fields:'); 
        console.log(fields);
        console.log('received files:'); 
        console.log(files);
        res.redirect(303, '/thank-you');
    });
})

app.get('/cart/checkout', function(req, res, next){
	req.session.cart = {}
	var cart = req.session.cart;
	if(!cart) next()
	else
	res.render('cart-checkout');
});
app.get('/cart/thank-you', function(req, res){
	res.render('cart-thank-you', { cart: req.session.cart });
});
app.get('/email/cart/thank-you', function(req, res){
	res.render('email/cart-thank-you', { cart: req.session.cart, layout: null });
});

app.post('/cart/checkout', function(req, res, next){ 
	var cart = req.session.cart;
	if(!cart) next(new Error('Cart does not exist.'));
	var name = req.body.name || '', email = req.body.email || ''; // 输入验证
	if(!email.match(VALID_EMAIL_REGEX))
		return res.next(new Error('Invalid email address.')); // 分配一个随机的购物车 ID;一般我们会用一个数据库 ID 
	cart.number = Math.random().toString().replace(/^0\.0*/, ''); 
	cart.billing = {
		name: name,
		email: email,
	};
	res.render('email/cart-thank-you', { layout: null, cart: cart }, function(err, html){
		if( err ) console.log('error in email template'); 

		emailService.send(
			cart.billing.email, 
			'Thank You for Book your Trip with Meadowlark',
			html
		)
	})
	res.render('cart-thank-you', { cart: cart })
});

// jQuery File Upload endpoint middleware
app.use('/upload', function(req, res, next){
    var now = Date.now();
    jqupload.fileHandler({
        uploadDir: function(){
            return __dirname + '/public/uploads/' + now;
        },
        uploadUrl: function(){
            return '/uploads/' + now;
        },
    })(req, res, next);
});

// for now, we're mocking NewsletterSignup:
function NewsletterSignup(){

}
NewsletterSignup.prototype.save = function(cb){
	cb();
};

// mocking product database
function Product(){
}
Product.find = function(conditions, fields, options, cb){
	if(typeof conditions==='function') {
		cb = conditions;
		conditions = {};
		fields = null;
		options = {};
	} else if(typeof fields==='function') {
		cb = fields;
		fields = null;
		options = {};
	} else if(typeof options==='function') {
		cb = options;
		options = {};
	}
	var products = [
		{
			name: 'Hood River Tour',
			slug: 'hood-river',
			category: 'tour',
			maximumGuests: 15,
			sku: 723,
		},
		{
			name: 'Oregon Coast Tour',
			slug: 'oregon-coast',
			category: 'tour',
			maximumGuests: 10,
			sku: 446,
		},
		{
			name: 'Rock Climbing in Bend',
			slug: 'rock-climbing/bend',
			category: 'adventure',
			requiresWaiver: true,
			maximumGuests: 4,
			sku: 944,
		}
	];
	cb(null, products.filter(function(p) {
		if(conditions.category && p.category!==conditions.category) return false;
		if(conditions.slug && p.slug!==conditions.slug) return false;
		if(isFinite(conditions.sku) && p.sku!==Number(conditions.sku)) return false;
		return true;
	}));
};
Product.findOne = function(conditions, fields, options, cb){
	if(typeof conditions==='function') {
		cb = conditions;
		conditions = {};
		fields = null;
		options = {};
	} else if(typeof fields==='function') {
		cb = fields;
		fields = null;
		options = {};
	} else if(typeof options==='function') {
		cb = options;
		options = {};
	}
	Product.find(conditions, fields, options, function(err, products){
		cb(err, products && products.length ? products[0] : null);
	});
};

var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

app.post('/newsletter', function(req, res){
	var name = req.body.name || '', email = req.body.email || '';
	// input validation
	if(!email.match(VALID_EMAIL_REGEX)) {
		if(req.xhr) return res.json({ error: 'Invalid name email address.' });
		req.session.flash = {
			type: 'danger',
			intro: 'Validation error!',
			message: 'The email address you entered was  not valid.',
		};
		return res.redirect(303, '/newsletter/archive');
	}
	new NewsletterSignup({ name: name, email: email }).save(function(err){
		if(err) {
			if(req.xhr) return res.json({ error: 'Database error.' });
			req.session.flash = {
				type: 'danger',
				intro: 'Database error!',
				message: 'There was a database error; please try again later.',
			};
			return res.redirect(303, '/newsletter/archive');
		}
		if(req.xhr) return res.json({ success: true });
		req.session.flash = {
			type: 'success',
			intro: 'Thank you!',
			message: 'You have now been signed up for the newsletter.',
		};
		return res.redirect(303, '/newsletter/archive');
	});
});

app.get('/newsletter/archive', function(req, res){
	res.render('newsletter/archive')
})

app.get('/fail', function (req, res) {
	throw new Error('Nope!')
})

app.get('/epic-fail', function(req, res){ 
	process.nextTick(function(){
		throw new Error('Kaboom!')
	})
})

app.use(function (req, res) {
    res.status(404)
    res.render('404')
})

app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500)
    res.render('500')
})

// app.listen(app.get('port'), function () {
//     console.log('Express started in' + app.get('env')
// 		+  'http://localhost:' + app.get('port') 
// 		+ '; press Ctrl - C to terminate. ')
// })

function startServer() {
    http.createServer(app).listen(app.get('port'), function(){
    	console.log('Express started in' + app.get('env')
		+  'http://localhost:' + app.get('port') 
		+ '; press Ctrl - C to terminate. ')
    })
}
if(require.main === module){
    // application run directly; start app server
    startServer();
} else {
    // application imported as a module via "require": export function to create server
    module.exports = startServer;
}