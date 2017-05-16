const nodemailer = require('nodemailer')

module.exports = function (credentials) {
    let mailTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: credentials.gmail.user,
            pass: credentials.gmail.password
        }
    })
    let from = 'your title'
    let errorRecipient = 'your own email'

    return {
        send: function (to, subject, body) {
            mailTransport.sendMail({
                from,
                to,
                subject,
                html: body,
                generateTextFromHtml: true
            }, function (err) {
                if (err) console.error('Unable to send email: ' + err)
            })
        },
        emailError: function(message, filename, exception){
			var body = '<h1>Meadowlark Travel Site Error</h1>' +
				'message:<br><pre>' + message + '</pre><br>';
			if(exception) body += 'exception:<br><pre>' + exception + '</pre><br>';
			if(filename) body += 'filename:<br><pre>' + filename + '</pre><br>';
		    mailTransport.sendMail({
		        from: from,
		        to: errorRecipient,
		        subject: 'Meadowlark Travel Site Error',
		        html: body,
		        generateTextFromHtml: true
		    }, function(err){
		        if(err) console.error('Unable to send email: ' + err);
		    });
		},
    }
    
}