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
	var html = 	'<ul id="peopleList" data-role="listview" data-filter-placeholder="Wyszukaj osoby..." data-inset="true"' +
				'data-theme="c" data-filter-theme="c" data-dividertheme="e">';
	$.each(JSONdata, function(i,person){
		html += '<li><a href="#">' +
				person.givenName + ' ' + person.sn +
				'</a></li>';
      });
	
	html += '</ul>';
	
	return html;
}

function getPeopleList()
{
	$(".ui-loader").css({ "top": "252px !important" });
	//$.mobile.loadingMessage="Ładowanie listy osób";
	$.mobile.showPageLoadingMsg();
		
	//if nie ma w localStorage to pobierz przez REST
	$.get("../rest/people/all", function(data) {
		console.log("rest getPeopleList request...");
		//console.log(data);
		$("#peopleListDiv").empty().append(buildPeopleList(data));
		
		createFilterBar();
		$("#peopleList").listview();
		$("#filterInput").keyup();
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

/*
* "listview" filter extension
*/

function createFilterBar() {

$( "#peopleList" ).live( "listviewcreate", function() {

	var list = $( this ),
		listview = list.data( "listview" );
	
	var wrapper = $( "<form>", {
			"class": "ui-listview-filter ui-bar-" + listview.options.filterTheme,
			"role": "search"
		}),
		search = $( "<input>", {
			placeholder: listview.options.filterPlaceholder,
			"id": "filterInput"
		})
		.attr( "data-" + $.mobile.ns + "type", "search" )
		.jqmData( "lastval", "" )
		.bind( "keyup change", function() {
			
			var $this = $(this),
				val = this.value.toLowerCase(),
				listItems = null,
				lastval = $this.jqmData( "lastval" ) + "",
				childItems = false,
				itemtext = "",
				item, change;
			
			// Change val as lastval for next execution
			$this.jqmData( "lastval" , val );
			change = val.substr( 0 , lastval.length - 1 ).replace( lastval , "" );

			if ( val.length < lastval.length || change.length != ( val.length - lastval.length ) ) {

				// Removed chars or pasted something totally different, check all items
				listItems = list.children();
			} else {

				// Only chars added, not removed, only use visible subset
				listItems = list.children( ":not(.ui-screen-hidden)" );
			}
			
			if (val.length < 2) {
				//filtervalue is less than 2 => hide all
				listItems.toggleClass( "ui-screen-hidden", true );
			} else	if ( val ) {

				// This handles hiding regular rows without the text we search for
				// and any list dividers without regular rows shown under it

				for ( var i = listItems.length - 1; i >= 0; i-- ) {
					item = $( listItems[ i ] );
					itemtext = item.jqmData( "filtertext" ) || item.text();

					if ( item.is( "li:jqmData(role=list-divider)" ) ) {

						item.toggleClass( "ui-filter-hidequeue" , !childItems );

						// New bucket!
						childItems = false;

					} else if ( listview.options.filterCallback( itemtext, val ) ) {

						//mark to be hidden
						item.toggleClass( "ui-filter-hidequeue" , true );
					} else {

						// There's a shown item in the bucket
						childItems = true;
					}
				}

				// Show items, not marked to be hidden
				listItems
					.filter( ":not(.ui-filter-hidequeue)" )
					.toggleClass( "ui-screen-hidden", false );

				// Hide items, marked to be hidden
				listItems
					.filter( ".ui-filter-hidequeue" )
					.toggleClass( "ui-screen-hidden", true )
					.toggleClass( "ui-filter-hidequeue", false );

			} else {

				//filtervalue is empty => show all
				listItems.toggleClass( "ui-screen-hidden", false );
			}
			listview._refreshCorners();
		})
		.appendTo( wrapper )
		.textinput();

	if ( $( this ).jqmData( "inset" ) ) {
		wrapper.addClass( "ui-listview-filter-inset" );
	}

	wrapper.bind( "submit", function() {
		return false;
	})
	.insertBefore( list );
});

}
