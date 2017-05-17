module.exports = {
    cookieSecret: 'cookie-secret',
    gmail: {
        user: 'youremail@gmail.com',
        password: 'yourpassword'
    },
    mongo: {
        development: {
            connectionString: 'mongodb://human:123123@ds143181.mlab.com:43181/express-mongo'
        },
        production: {
            connectionString: 'mongodb://human:123123@ds143181.mlab.com:43181/express-mongo'
        }
    }
}