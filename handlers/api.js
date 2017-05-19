// api

var Attraction = require('../models/attraction.js');

// var rest = require('connect-rest');

exports.attractions = function(req, res){
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
}

exports.postAttraction = function(req, res){
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
}

exports.getAttraction = function(req, res){
    Attraction.findById(req.params.id, function(err, a){
        if(err) return res.send({ error: 'Unable to retrieve attraction.' });
        res.json({
            id: a._id, 
            name: a.name,
            description: a.description,
            location: a.location,
        });
    });
}