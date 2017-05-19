var main = require('./handlers/main.js'),
	contest = require('./handlers/contest.js'),
	vacation = require('./handlers/vacation.js'),
	cart = require('./handlers/cart.js'),
	cartValidation = require('./lib/cartValidation.js');
	contact = require('./handlers/contact.js'),
	tours = require('./handlers/tours.js'),
	samples = require('./handlers/sample.js'),
	api = require('./handlers/api.js')
    
module.exports = function (app) {

    // miscellaneous routes
	app.get('/', main.home);
    app.get('/headers', main.header)
	app.get('/about', main.about);
	app.get('/newsletter', main.newsletter);
	app.post('/newsletter', main.newsletterProcessPost);
	app.get('/newsletter/archive', main.newsletterArchive);
	app.get('/thank-you', main.genericThankYou);

    // contest routes
	app.get('/contest/vacation-photo', contest.vacationPhoto);
	app.post('/contest/vacation-photo/:year/:month', contest.vacationPhotoProcessPost);
	app.get('/contest/vacation-photo/entries', contest.vacationPhotoEntries);

    // vacation routes
	app.get('/vacations', vacation.list);
	app.get('/vacation/:vacation', vacation.detail);
	app.get('/notify-me-when-in-season', vacation.notifyWhenInSeason);
	app.post('/notify-me-when-in-season', vacation.notifyWhenInSeasonProcessPost);

    // shopping cart routes
	app.get('/cart', cart.middleware, cartValidation.checkWaivers, cartValidation.checkGuestCounts, cart.home);
	app.get('/cart/add', cart.addProcessGet);
	app.post('/cart/add', cart.addProcessPost);
	app.get('/cart/checkout', cart.checkout);
	app.post('/cart/checkout', cart.checkoutProcessPost);
	app.get('/cart/thank-you', cart.thankYou);
	app.get('/email/cart/thank-you', cart.emailThankYou);
	app.get('/set-currency/:currency', cart.setCurrency);

	// contact
	app.get('/request-group-rate', contact.requestGroupRate);
	app.post('/request-group-rate', contact.requestGroupRateProcessPost);
	app.get('/contact', contact.home);
	app.post('/contact', contact.homeProcessPost);

	// testing/sample routes

    app.get('/fail', samples.fail)
	app.get('/jquery-test', samples.jqueryTest);
	app.get('/nursery-rhyme', samples.nurseryRhyme);
	app.get('/data/nursery-rhyme', samples.nurseryRhymeData);
	app.get('/epic-fail', samples.epicFail);
    app.use('/upload', samples.upload)
    
	app.get('/tours/:tour', tours.tour)
	app.get('/tours/hood-river', tours.hoodRiver)
    app.get('/tours/request-group-rate', tours.requestGroupRate);
	app.get('/adventures/:subcat/:name', tours.adventure)

	// app.get('/api/attractions', api.attractions)
	// app.post('/api/attraction', api.postAttraction)
	// app.get('/api/attraction/:id', api.getAttraction)
}