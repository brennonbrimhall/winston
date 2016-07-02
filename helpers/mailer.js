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
	},

	text: function(toNumber, subject, text, callback){
		var imos = require('./imos.js');

		if(toNumber instanceof Array){//Send b
			var phoneEmails = [];
			for(var i = 0; i < toNumber.length; i++){
				console.log(imos.phoneNumberToEmail(toNumber[i]));
				phoneEmails.push(imos.phoneNumberToEmail(toNumber[i]));
			}

			this.mail(phoneEmails, subject, text, callback);
		}else{//Only send one
			this.mail(imos.phoneNumberToEmail(toNumber), subject, text, callback);
		}
	},

	massText: function(toNumber, subject, text, callback){
		this.text(toNumber, subject, text);
		
		var othersToMail = require('./toText.json');

		for(var i = 0; i < othersToMail.length; i++){
			console.log("Mailing "+othersToMail[i]);
			this.mail(othersToMail[i], "Winston Mass Text", text);
			if((i+1) == othersToMail.length){
				this.mail(othersToMail[i], "Winston Mass Text", text, callback);
			}
		}
	}
}