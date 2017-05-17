const Product = require('../mock/product.js')

exports.hoodRiver = function(req, res){
    res.render('tours/hood-river')
}

exports.requestGroupRate = function(req, res){
    res.render('tours/request-group-rate')
}

exports.tour =  function(req, res, next){
    console.log(Product)
	Product.findOne({ category: 'tour', slug: req.params.tour }, function(err, tour){
		if(err) return next(err)
		if(!tour) return next()
		res.render('tour', { tour: tour })
	})
}
exports.adventure = function(req, res, next){
	Product.findOne({ category: 'adventure', slug: req.params.subcat + '/' + req.params.name  }, function(err, adventure){
		if(err) return next(err)
		if(!adventure) return next()
		res.render('adventure', { adventure: adventure })
	})
}