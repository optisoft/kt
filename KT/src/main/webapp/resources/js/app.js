/*
Core JavaScript functionality for the application.  Performs the required
Restful calls, validates return values, and populates the member table.
 */

$(document).bind("mobileinit", function() {
	$.mobile.defaultPageTransition = "slideup";
});

/* Przesuniecie w dol, zeby ukryc pasek adresu na Androidzie. */
$(document).ready(function() { //funkcja ready wywoływana jest tylko raz po potem strony ładują się poprzez Ajax i są wstrzykiwane. Trzeba uzyc pageinit.
	if (navigator.userAgent.match(/Android/i)) {
		window.scrollTo(0, 1);
	}
	$( '#allPeoplePage' ).live( 'pageshow',function(event){
		  showForAdmin("addButton");
		  getPeopleList();
	});
});

function submitLogin() {
	setCookie("username", $("#j_username").val());
	setCookie("password", $("#j_password").val());
	$("#j_submit").click();
}

function submitLoginOnEnter(event) {
	var keycode = (event.keyCode ? event.keyCode : (event.which ? event.which
			: event.charCode));
	if (keycode == 13) {
		submitLogin();
		return false;
	} else {
		return true;
	}
}

function getCookie(c_name) {
	var i, x, y, ARRcookies = document.cookie.split(";");
	for (i = 0; i < ARRcookies.length; i++) {
		x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
		y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
		x = x.replace(/^\s+|\s+$/g, "");
		if (x == c_name) {
			return unescape(y);
		}
	}
}

function setCookie(c_name, value) {
	//7 dni
	var date = new Date();
	date.setTime(date.getTime()+(7*24*60*60*1000));
	var expires = "; expires="+date.toGMTString();
	var c_value = escape(value);
	document.cookie = c_name+"="+c_value+expires+"; path=/";
	// do zamkniecia przegladarki document.cookie = c_name + "=" + c_value + "; ; path=/";
}

function removeCookie(c_name) {
	document.cookie = c_name+"=; expires="+new Date(0).toUTCString() +"; path=/";
}

function getRestIsAdmin(id) {
	$.get('../rest/people/isAdmin', function(data) {
		console.log("rest isAdmin request...");
		if(data == "true") {
			setCookie("isAdmin", "true");
			$("#"+id).show();
		}
		else {
			setCookie("isAdmin", "false");
		}

	}).error(function(error) {
		var errStatus = error.status;
		setCookie("isAdmin", "false");
		console.log("error checking isAdmin" + errStatus);
	});
}

function showForAdmin(id) {
	var isAdmin = getCookie("isAdmin");
	if (isAdmin == null || isAdmin == "") { //wywoływane tylko raz gdy nie jest ustawione cookie.
		getRestIsAdmin(id);
	}
	
	if (isAdmin == "true") {
		$("#"+id).show();
	}
}

/* Builds the updated table for the member list */
function buildMemberRows(members) {
	var html = '';
	$(members)
			.each(
					function() {
						var $member = $(this);
						html += '<tr class="member">';
						var memId = $member.find('id').text();
						html += '<td>' + memId + '</td>';
						html += '<td>' + $member.find('name').text() + '</td>';
						html += '<td>' + $member.find('email').text() + '</td>';
						html += '<td>' + $member.find('phoneNumber').text()
								+ '</td>';
						html += '<td><a href="rest/members/'
								+ memId
								+ '" target="_blank" class="resturl">XML</a> / <a href="rest/members/'
								+ memId
								+ '/json" target="_blank" class="resturl">JSON</a></td>';
					});
	return html;
}

function buildPeopleList(JSONdata) {
	var html = "";
	$.each(JSONdata, function(i,person){
		html += '<p>' + person.uid + '</p>';
        html += '<p>' + person.sn + '</p>';
        html += '<br/>';
      });
	
	return html;
}

function getPeopleList()
{
	$("#peopleList").empty().append("aasassa");
	$(".ui-loader").css({ "top": "252px !important" });
	//$.mobile.loadingMessage="Ładowanie listy osób";
	$.mobile.showPageLoadingMsg();
		
	//if nie ma w localStorage to pobierz przez REST
	$.get("../rest/people/all", function(data) {
		console.log("rest getPeopleList request...");
		//console.log(data);
		$("#peopleList").empty().append(buildPeopleList(data));
		$.mobile.hidePageLoadingMsg();
	}).error(function(error) {
		var errStatus = error.status;
		console.log("error getPeopleList: " + errStatus);
	});
}

/* Uses JAX-RS GET to retrieve current member list */
function updateMemberTable() {
	$.get('rest/members', function(data) {
		alert(data);
		var $members = $(data).find('member');

		$('#members').empty().append(buildMemberRows($members));

	}).error(function(error) {
		var errStatus = error.status;
		console.log("error updating table -" + errStatus);
	});
}

/*
 Attempts to register a new member using a JAX-RS POST.  The callbacks
 the refresh the member table, or process JAX-RS response codes to update
 the validation errors.
 */
function registerMember(formValues) {
	//clear existing  msgs
	$('span.invalid').remove();
	$('span.success').remove();

	$
			.post(
					'rest/members',
					formValues,
					function(data) {
						console.log("Member registered");

						//clear input fields
						$('#reg')[0].reset();

						//mark success on the registration form
						$('#formMsgs')
								.append(
										$('<span class="success">Member Registered</span>'));

						updateMemberTable();
					})
			.error(
					function(error) {
						//var errStatus = error.status;

						if ((error.status == 409) || (error.status == 400)) {
							console.log("Validation error registering user!");

							var errorMsg = JSON.parse(error.responseText);

							$.each(errorMsg, function(index, val) {
								$('<span class="invalid">' + val + '</span>')
										.insertAfter($('#' + index));
							});
						} else {
							console.log("error - unknown server issue");
							$('#formMsgs')
									.append(
											$('<span class="invalid">Unknown server error</span>'));
						}
					});
}