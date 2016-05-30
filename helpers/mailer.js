module.exports = {
	mail: function(to, subject, text, callback){
		var nodemailer = require('nodemailer');
		
		//Getting secret auth data:
		var auth = require('../auth.json');
		var options = {
			pool: true,
			service: 'gmail',
			auth: auth
		}
		
		var transporter = nodemailer.createTransport(options);

		var mailOptions = {
			from: '"Winston" <cdsmwinston@gmail.com>',
			to: to,
			subject: subject,
			text: text
		};

		transporter.sendMail(mailOptions, function(err, info){
			callback(err, info);
		});
	}
}