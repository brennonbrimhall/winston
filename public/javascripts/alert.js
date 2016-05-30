var alert = function(type, strongText, bodyText){

	//What type of alert?
	var typeclass;
	if(type == "success"){
		typeclass = "alert-success";
	}else if(type == "warning"){
		typeclass = "alert-warning";
	}else if(type == "error"){
		typeclass = "alert-danger";
	}else{
		typeclass = "alert-info";
	}

	//Make HTML string
	var alertString = "<div class=\"alert "+typeclass+" alert-dismissible\" role=\"alert\">\n<button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>\n<strong>"+strongText+"</strong> "+bodyText+"\n</div>"

	//Append new alert to alerts-div
	$('#alerts-div').append(alertString);
}