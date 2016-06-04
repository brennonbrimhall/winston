//This module contains functions that help Winston connect to iMOS.

module.exports = {
	phoneNumberToEmail: function(phoneNumber){
		var phoneEmail = phoneNumber.slice(3)+'@txt.att.net';
		phoneEmail = phoneEmail.replace('-', '');
		phoneEmail = phoneEmail.replace('-', '');
		return phoneEmail;
	}
}