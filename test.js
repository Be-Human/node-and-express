var fs = require('fs')
var reader = fs.createReadStream('index.js')
var writer = fs.createWriteStream('out.js')
reader.pipe(writer)
//reader.on('data', function(chunk) {
//  writer.write(chunk)
//}) 

//reader.on('end', function () {
//  writer.end()
//})

