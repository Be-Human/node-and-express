const http = require('http')
// const https = require('https')
	, fs = require('fs')
	, express = require('express')
	, bodyParser = require('body-parser')
    , vhost = require('vhost')
    , cors = require('cors')
	, session = require('express-session')
	, mongoose = require('mongoose')
    , MongoStore = require('connect-mongo')(session)
    , static = require('./lib/static.js').map
	, Vacation = require('./models/vacation.js')
	, weatherData = require('./lib/weatherData.js')
	, credentials = require('./lib/credentials.js')
	, app = express()

const handlebars = require('express-handlebars').create({
    defaultLayout:'main',
    helpers: {
        static: function (name){
            return require('./lib/static.js').map(name)
        },
        section: function(name, options){
            if(!this._sections) this._sections = {}
            this._sections[name] = options.fn(this)
            return null
        }
    }
})

app.use(function(req, res, next){ 
    var now = new Date();
    res.locals.logoImage = now.getMonth()==11 && now.getDate()==19 ?
    static('/img/logo_bud_clark.png') : 
    static('/img/logo.png');
    next(); 
});

// app.enable('trust proxy');
app.disable('x-powered-by')
app.engine('handlebars', handlebars.engine)
app.set('view engine', 'handlebars')
app.set('port', process.env.PORT || 3000)

// app.use(require('csurf')());
// app.use(function(req, res, next) {
// 	res.locals._csrfToken = req.csrfToken();
// 	next();
// });

app.use(express.static(__dirname+'/public'))
app.use(bodyParser.urlencoded({ extended:false }))


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

var opts = {
	server: {
		socketOptions: {keepAlive: 1}
	}
}

// logging
switch(app.get('env')){
    case 'development':
    	// compact, colorful dev logging
    	app.use(require('morgan')('dev'));
		mongoose.connect(credentials.mongo.development.connectionString, opts)
        break;
    case 'production':
        app.use(require('morgan')('tiny'));
		mongoose.connect(credentials.mongo.development.connectionString, opts)		
        break;
	default:
		throw new Error('Unknow execution environment: ' + app.get('env'))
}

app.use(session({
	secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}))


// initialize vacations
Vacation.find(function(err, vacations){
    if(vacations.length) return;

    new Vacation({
        name: 'Hood River Day Trip',
        slug: 'hood-river-day-trip',
        category: 'Day Trip',
        sku: 'HR199',
        description: 'Spend a day sailing on the Columbia and ' + 
            'enjoying craft beers in Hood River!',
        priceInCents: 9995,
        tags: ['day trip', 'hood river', 'sailing', 'windsurfing', 'breweries'],
        inSeason: true,
        maximumGuests: 16,
        available: true,
        packagesSold: 0,
    }).save();

    new Vacation({
        name: 'Oregon Coast Getaway',
        slug: 'oregon-coast-getaway',
        category: 'Weekend Getaway',
        sku: 'OC39',
        description: 'Enjoy the ocean air and quaint coastal towns!',
        priceInCents: 269995,
        tags: ['weekend getaway', 'oregon coast', 'beachcombing'],
        inSeason: false,
        maximumGuests: 8,
        available: true,
        packagesSold: 0,
    }).save();

    new Vacation({
        name: 'Rock Climbing in Bend',
        slug: 'rock-climbing-in-bend',
        category: 'Adventure',
        sku: 'B99',
        description: 'Experience the thrill of rock climbing in the high desert.',
        priceInCents: 289995,
        tags: ['weekend getaway', 'bend', 'high desert', 'rock climbing', 'hiking', 'skiing'],
        inSeason: true,
        requiresWaiver: true,
        maximumGuests: 4,
        available: false,
        packagesSold: 0,
        notes: 'The tour guide is currently recovering from a skiing accident.',
    }).save();
});


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


// create "admin" subdomain...this should appear
// before all your other routes
var admin = express.Router();
app.use(require('vhost')('admin.*', admin));

// create admin routes; these can be defined anywhere
admin.get('/', function(req, res){
	res.render('admin/home');
});
admin.get('/users', function(req, res){
	res.render('admin/users');
});


require('./routes.js')(app)
require('./controllers/customer.js').registerRoutes(app)

var Attraction = require('./models/attraction.js');

var api = express.Router();
// var api = express()

// app.use(require('vhost')('api.*', api))
app.use('/api', api)

api.get('/attractions', function(req, res){
    Attraction.find({ approved: false }, function(err, attractions){
        if(err) return res.send({ error: 'Internal error.' });
        res.json(attractions.map(function(a){
            return {
                name: a.name,
                id: a._id,
                description: a.description,
                location: a.location,
            } 
        }))
    });
})
api.post('/attraction', function(req, res){
    var a = new Attraction({
        name: req.body.name,
        description: req.body.description,
        location: { lat: req.body.lat, lng: req.body.lng },
        history: {
            event: 'created',
            email: req.body.email,
            date: new Date(),
        },
        approved: false,
    });
    console.log(a)
    a.save(function(err, a){
        if(err) return res.send(500, 'Error occurred: database error.')
        res.json({ id: a._id });
    })
})
api.get('/attraction/:id', function(req, res){
    Attraction.findById(req.params.id, function(err, a){
        if(err) return res.send({ error: 'Unable to retrieve attraction.' });
        res.json({
            id: a._id, 
            name: a.name,
            description: a.description,
            location: a.location,
        });
    });
});

// add support for auto views
var autoViews = {};

app.use(function(req,res,next){
    var path = req.path.toLowerCase();  
    // check cache; if it's there, render the view
    if(autoViews[path]) return res.render(autoViews[path]);
    // if it's not in the cache, see if there's
    // a .handlebars file that matches
    if(fs.existsSync(__dirname + '/views' + path + '.handlebars')){
        autoViews[path] = path.replace(/^\//, '');
        return res.render(autoViews[path]);
    }
    // no view found; pass on to 404 handler
    next();
});

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
let server

function startServer() {
    server = http.createServer(app).listen(app.get('port'), function(){
    	console.log('Express started in ' + app.get('env')
		+  'http://localhost:' + app.get('port') 
		+ '; press Ctrl - C to terminate. ')
    })
}
//https
// function startServer() {
// 	var keyFile = __dirname + '/ssl/meadowlark.pem',
// 		certFile = __dirname + '/ssl/meadowlark.crt';
// 	if(!fs.existsSync(keyFile) || !fs.existsSync(certFile)) {
// 		console.error('\n\nERROR: One or both of the SSL cert or key are missing:\n' +
// 			'\t' + keyFile + '\n' +
// 			'\t' + certFile + '\n' +
// 			'You can generate these files using openssl; please refer to the book for instructions.\n');
// 		process.exit(1);
// 	}
// 	var options = {
// 		key: fs.readFileSync(__dirname + '/ssl/meadowlark.pem'),
// 		cert: fs.readFileSync(__dirname + '/ssl/meadowlark.crt'),
// 	};
//     server = https.createServer(options, app).listen(app.get('port'), function(){
//       console.log( 'Express started in ' + app.get('env') +
//         ' mode on port ' + app.get('port') + ' using HTTPS' +
//         '; press Ctrl-C to terminate.' );
//     });
// }
if(require.main === module){
    // application run directly; start app server
    startServer();
} else {
    // application imported as a module via "require": export function to create server
    module.exports = startServer;
}