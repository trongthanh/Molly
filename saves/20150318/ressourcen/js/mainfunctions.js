function getrandomheadline(){
	headlines = [getmsg("headline1").replace('{name}',localStorage['settingsname']),getmsg("headline2").replace('{name}',localStorage['settingsname'])];
	return headlines[Math.floor(Math.random() * (headlines.length))];
}
function getlanguagestrings(){
	$('.msg').each(function(){
		if(getmsg($(this).attr('msg')).length > 0) $(this).html(getmsg($(this).attr('msg')));
	});
}

function getmsg(string){
	return chrome.i18n.getMessage(string);
}

function log(string){
	console.log(string);
}

function initvars(){
	/* VARS */
	thiscard = new Array();
	requestgo = false;
	request_started = false;
	
	/* All commands in users language*/
	all_comm = [];
	objkeys = []
	objcommands = new commands();
	objkeys = Object.keys(objcommands);
	for (i = 0;i <= objkeys.length-1;i++){
		objcommands[objkeys[i]].prototype = new ObjCommand()
		cur_obj = new objcommands[objkeys[i]];
		all_comm.push(cur_obj.id);
		if(typeof(cur_obj.synonyms) != 'undefined'){
			if(cur_obj.synonyms.length > 0) all_comm.push(cur_obj.synonyms);
		}
	}
}

function similar_text(first, second, percent) {
	//  discuss at: http://phpjs.org/functions/similar_text/
	// original by: Rafal Kukawski (http://blog.kukawski.pl)
	// bugfixed by: Chris McMacken
	// bugfixed by: Jarkko Rantavuori original by findings in stackoverflow (http://stackoverflow.com/questions/14136349/how-does-similar-text-work)
	// improved by: Markus Padourek (taken from http://www.kevinhq.com/2012/06/php-similartext-function-in-javascript_16.html)
	//   example 1: similar_text('Hello World!', 'Hello phpjs!');
	//   returns 1: 7
	//   example 2: similar_text('Hello World!', null);
	//   returns 2: 0

	if (first === null || second === null || typeof first === 'undefined' || typeof second === 'undefined') return 0;
	first += '';second += '';

	var pos1 = 0,
    pos2 = 0,
    max = 0,
    firstLength = first.length,
    secondLength = second.length,
    p, q, l, sum;

	max = 0;

	for (p = 0; p < firstLength; p++) {
		for (q = 0; q < secondLength; q++) {
      for (l = 0;
        (p + l < firstLength) && (q + l < secondLength) && (first.charAt(p + l) === second.charAt(q + l)); l++)
      ;
      if (l > max) {
        max = l;pos1 = p;pos2 = q;
      }
    }
  }
  sum = max;
  if (sum) {
    if (pos1 && pos2) sum += this.similar_text(first.substr(0, pos1), second.substr(0, pos2));
    if ((pos1 + max < firstLength) && (pos2 + max < secondLength)) sum += this.similar_text(first.substr(pos1 + max, firstLength - pos1 - max), second.substr(pos2 + max,secondLength - pos2 - max));
  }

  if (!percent) return sum;
  else return (sum * 200) / (firstLength + secondLength);
}

function getnotifications(view){
	notifcards = localStorage['getnotif'].split(',');
	notifarray = [];
	for(var r=0;r<=notifcards.length-1;r++){
		if(notifcards[r].length > 1){
			if(typeof(objcommands[notifcards[r]]) == 'function'){
				lcommand = new objcommands[notifcards[r]];
				if (lcommand.hasOwnProperty('getnotif')){
					lArray = lcommand.getnotif($('#notifications'));
				}
				//else falsch einsortiert :/
			}
		}		
	}
	if(r==0) view.html(getmsg("nocardsfornotification")+'<a href="#" class="command" command="help notifications"> '+getmsg("idhelp")+' </a> ');
}	
function stopspracheingabe(){
	$('#nachricht').hide();
	$('#spracheingabebox').hide();
	$('#overlay').hide();
	newRecognition.stop();
}
function startspracheingabe(){
	if(localStorage['settingssprachsuche'] == 'true'){
		shownachricht('<div id="spracheingabebox">'+$('#spracheingabe').html()+'</div>');
		newRecognition.start();
		
		newRecognition.onresult = function(event){
			log(event.results[0][0].transcript);
			$('#spracheingabebox .results').html(event.results[0][0].transcript.toLowerCase());
			
			setasfinal = window.setTimeout(function(){
				stopspracheingabe();
				
				$('input').val($('#spracheingabebox .results').html());
				
				$('input').trigger('keypress');
			},300);
		}
	}
	else{
		//Funktion in Einstellungen Deaktiviert
	}
}
function opencardslider(container){
	$('#cardslider .scroller').html('');
	loadcards($('#cardslider .scroller'));
	
	$('#MainContent').toggleClass('top');
	$('#MainContent').toggleClass('down');
	
	$('#cardslider,.bin').toggleClass('toggle');
	$('.bin .caption').html(getmsg("dropcardstoremove"));
	
	$('.cardslideropener').toggleClass('toggle');
	
	if($('.cardslideropener').hasClass('icon-uniE617')) $('.cardslideropener').removeClass('icon-uniE617').addClass('icon-arrow-left');
	else $('.cardslideropener').removeClass('icon-arrow-left').addClass('icon-uniE617');
	
	
	$('#cardslider .scroller div').draggable({
		cursor:'pointer'
	});
	$( "#draggable" ).draggable();
	$( ".bin" ).droppable({
		hoverClass: "drop-hover",
		drop: function(event,ui) {
			element = ui.draggable;
			console.log(element);
			hi = localStorage['cards'].split(',');
			for (i=0;i<=hi.length-1;i++){
				if( $(element).attr('command') == hi[i].replace(' ','')){
					localStorage['cards'] = localStorage['cards'].replace(hi[i],'');
					element.remove();
					$('.bin .caption').html(getmsg("removesuccessfull"));
					window.setTimeout(function(){ $('.bin .caption').html(getmsg("dropcardstoremove")); },1500);
				}
			}
		}
	});
}

function loadcards(container){
	applyedcards = localStorage['cards'].split(',');
	for (i = 0; i <= applyedcards.length-1; i++ ){
		if (applyedcards[i].length > 2){
			id = 'id' + (new Date()).getTime();
			container.append('<div class="card '+id+' "></div>')
			
			start_request($('.card.'+id),applyedcards[i],false);
		}
	}
	if (i < 1){
		container.html(getmsg("nocardstoshowincardslider"));
		container.addClass('nocards');
	}	
}

function start_request(view,eingabe,start){ 
	//$('#overlay').show();
	if(typeof(start) == 'undefined') start = false;
	
	request_started = true;
	eingabe = eingabe.split(" ");
	
	for(var propertyName in objcommands) { //welches Object hat ID von command?
		cur_view = new objcommands[propertyName];
		if((cur_view.id.toLowerCase() == eingabe[0].toLowerCase()) || (typeof(cur_view.synonyms) != 'undefined' && cur_view.synonyms.toLowerCase()  == eingabe[0].toLowerCase() )){
			view.html('').show().addClass('show');
			if (cur_view.hasOwnProperty('permission')) checkpermission(eingabe[0],cur_view.permission);
			if (cur_view.hasOwnProperty('origin')) checkorigin(eingabe[0],cur_view.origin);
			
			eingabe.shift();
			command = propertyName;
			if(cur_view.hasOwnProperty('params')){
				if (eingabe.length < cur_view.params.length){
					if(cur_view.hasOwnProperty('notallparams')){
						cur_view.notallparams(view);
						initregulary(cur_view,eingabe);
					}
					else{
						view.html(getmsg("needed_params")+cur_view.params.join());
					}	
					setTimeout(function(){request_started = false;},200);
				}
				else{
					if (!cur_view.startdirectly && !start){
						self = this;
						if (typeof(starttimer) != 'undefined') clearTimeout(starttimer);
						starttimer = window.setTimeout(function(){
							window.start_request(results,$('input').val(),true);
						},5000); //f�ngt erst 5sekunden nach der letzten eingabe an (bei Commands wo es n�tig ist).
					}
					else{
						cur_view.initview(view,eingabe);
						initregulary(cur_view,eingabe);
						setTimeout(function(){
							request_started = false;
						},200);
						return false;	
					}					
				}
			}
			else{
				cur_view.initview(view,eingabe);
				initregulary(cur_view,eingabe);
				setTimeout(function(){request_started = false;},200);
				return false;
			}
			break;break;
		}
		
	}
}
function initregulary(cur_view,eingabe){
	if(cur_view.regulary){
		$('#show_card_regulary').show().attr('command',cur_view.id+' '+eingabe.join(" "));
		if(localStorage['cards'].indexOf(cur_view.id+' '+eingabe.join(" ")) == -1) $('#show_card_regulary').html(getmsg("putonwatchlist"));
		else $('#show_card_regulary').html(getmsg("alreadyonlist"));
		
		onetime = false;
		$('#show_card_regulary').click(function(){
			if(!onetime){
				if (localStorage['cards'].length > 0){
					if(localStorage['cards'].indexOf($(this).attr('command')) == -1) localStorage['cards'] += ','+$(this).attr('command');
					else alert(getmsg("alreadyonlist"));
				}	
				else localStorage['cards'] += $(this).attr('command');
				onetime = true;
			}	
		});
	}	
	if(cur_view.hasrefresh){
		$('.refresh').show().attr('doonrefresh',cur_view.id+' '+eingabe.join(" "));
		$('.refresh').click(function(cur_view){
			results.html('');
			var array = $(this).attr('doonrefresh').split(' ');
			var command = array[0];
			array.shift();
			start_request(results,command,array.join(" "));
		});
	}
	
	/*if(cur_view.hasOwnProperty('getnotif')){
		if(localStorage['getnotif'].indexOf(cur_view.id) > -1){
			$('#show_notif').show().html(getmsg("youalreadygetnotif"));
		}
		else{
			$('#show_notif').show().html(getmsg("getnotifforthis")).attr('command',cur_view.id);
			$('#show_notif').click(function(){
				localStorage['getnotif'] += ','+$(this).attr('command');
			});
		}
	}*/
}
String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
function initcommandclick(){
	$('.command').click(function(){
		$('input').val($(this).attr('command'));
		start_request(results,$(this).attr('command'));
		$('input').focus();
		return false;
	});
}	
$('.refresh').click(function(){
	location.reload();
});

function nocommands(eingabe){
	results.html('<ul id="noresults"> </ul>');
	this.init = function(){
		$('#noresults').append('<li class="refresh">'+getmsg("nocommands")+'</li>');
		this.addLink(getmsg("idgoogle")+" - "+eingabe,"google "+eingabe);
		this.addLink(getmsg("idsuggest")+" - "+eingabe,"suggest "+eingabe);
		this.addLink(getmsg("idwiki")+" - "+eingabe,"wiki "+eingabe);
		$('.command').click(function(){
			start_request(results,$(this).attr('command'));
		});
		$('.refresh').click(function(){
			location.reload();
		});
	}
	this.addLink = function(text,command){
		$('#noresults').append('<li class="command" command="'+command+'">'+text+'</li>');
	}
}

function ValidUrl(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
  '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  if(!pattern.test(str)) return false;
  else return true;
}


/*!
 * classie - class helper functions
 * from bonzo https://github.com/ded/bonzo
 * 
 * classie.has( elem, 'my-class' ) -> true/false
 * classie.add( elem, 'my-new-class' )
 * classie.remove( elem, 'my-unwanted-class' )
 * classie.toggle( elem, 'my-class' )
 */

(function(e){"use strict";function t(e){return new RegExp("(^|\\s+)"+e+"(\\s+|$)")}function s(e,t){var s=n(e,t)?i:r;s(e,t)}var n,r,i;if("classList"in document.documentElement){n=function(e,t){return e.classList.contains(t)};r=function(e,t){e.classList.add(t)};i=function(e,t){e.classList.remove(t)}}else{n=function(e,n){return t(n).test(e.className)};r=function(e,t){if(!n(e,t)){e.className=e.className+" "+t}};i=function(e,n){e.className=e.className.replace(t(n)," ")}}var o={hasClass:n,addClass:r,removeClass:i,toggleClass:s,has:n,add:r,remove:i,toggle:s};if(typeof define==="function"&&define.amd){define(o)}else{e.classie=o}})(window)

/**
 * gnmenu.js v1.0.0
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2013, Codrops
 * http://www.codrops.com
 */
;( function( window ) {
	
	'use strict';

	// http://stackoverflow.com/a/11381730/989439
	function mobilecheck() {
		var check = false;
		(function(a){if(/(android|ipad|playbook|silk|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
		return check;
	}

	function gnMenu( el, options ) {	
		this.el = el;
		this._init();
	}

	gnMenu.prototype = {
		_init : function() {
			this.trigger = this.el.querySelector( 'a.icon-menu' );
			this.menu = this.el.querySelector( 'nav.gn-menu-wrapper' );
			this.isMenuOpen = false;
			this.eventtype = mobilecheck() ? 'touchstart' : 'click';
			this._initEvents();

			var self = this;
			this.bodyClickFn = function() {
				self._closeMenu();
				this.removeEventListener( self.eventtype, self.bodyClickFn );
			};
		},
		_initEvents : function() {
			var self = this;

			if( !mobilecheck() ) {
				this.trigger.addEventListener( 'mouseover', function(ev) { self._openIconMenu(); } );
				this.trigger.addEventListener( 'mouseout', function(ev) { self._closeIconMenu(); } );
			
				this.menu.addEventListener( 'mouseover', function(ev) {
					self._openMenu(); 
					document.addEventListener( self.eventtype, self.bodyClickFn ); 
				} );
			}
			this.trigger.addEventListener( this.eventtype, function( ev ) {
				ev.stopPropagation();
				ev.preventDefault();
				if( self.isMenuOpen ) {
					self._closeMenu();
					document.removeEventListener( self.eventtype, self.bodyClickFn );
				}
				else {
					self._openMenu();
					document.addEventListener( self.eventtype, self.bodyClickFn );
				}
			} );
			this.menu.addEventListener( this.eventtype, function(ev) { ev.stopPropagation(); } );
		},
		_openIconMenu : function() {
			classie.add( this.menu, 'gn-open-part' );
			$('.gn-trigger').css('background','rgba(255,255,255,0.5);');
			$('a.gn-icon.icon-menu').css('color','#5f6f81');
		},
		_closeIconMenu : function() {
			classie.remove( this.menu, 'gn-open-part' );
			$('.gn-trigger').css('background','rgba(255,255,255,0.5)');
			$('a.gn-icon.icon-menu').css('color','white');
		},
		_openMenu : function() {
			if( this.isMenuOpen ) return;
			classie.add( this.trigger, 'gn-selected' );
			this.isMenuOpen = true;
			classie.add( this.menu, 'gn-open-all' );
			this._closeIconMenu();
			$('.gn-trigger').css('background','rgba(255,255,255,0.5);').css('padding-right','240px');

		},
		_closeMenu : function() {
			if( !this.isMenuOpen ) return;
			classie.remove( this.trigger, 'gn-selected' );
			this.isMenuOpen = false;
			classie.remove( this.menu, 'gn-open-all' );
			this._closeIconMenu();
			$('.gn-trigger').css('background','transparent');
			$('.gn-trigger').css('padding-right','0px');
			$('a.gn-icon.icon-menu').css('color','white');
		}
	}

	// add to global namespace
	window.gnMenu = gnMenu;

} )( window );

function loadtopsites(){
	$('nav ul.gn-menu .alllinks').html('');
	chrome.topSites.get (function(urls) {
		for (i=0;i<=($(window).height()/46)-4;i++){
			$('nav ul.gn-menu .alllinks').append("<li><a href="+urls[i].url+" class='gn-icon'><img width='20px' src='chrome://favicon/"+urls[i].url+"'/>"+(urls[i].title.length >20?urls[i].title.substring(0,20)+'...' : urls[i].title)+"</a></li>");
		}
	});	
}
function checkpermission(id,permission){
	if(permission.length > 0){
		chrome.permissions.contains({
			permissions: [permission]
		}, function(result) {
			if (!result) {
				results.html('<div class="GETpermission" id="'+permission+'">'+getmsg("commandneedspermission")+permission+'"! <a class="allow"> '+getmsg("allow")+' </a><a class="deny"> '+getmsg("deny")+' </a></div>');
				$('.GETpermission .deny').click(function(){
					results.hide();
					$('input').val('');
					$('input').trigger('keypress');
					alert(getmsg("cantviewwithoutpermission"));
				});	
				$('.GETpermission .allow').click(function(){
					chrome.permissions.request({
						permissions: [$(this).parent().attr('id')]
					}, function(granted) {
						if (granted) {
							$('input').trigger('keypress');
							$('input').focus();
						}
					});	
				});
			}	
		});
	}	
}	  
function checkorigin(id,permission){
	if(permission.length > 0){
		chrome.permissions.contains({
			origins: [permission]
		}, function(result) {
			if (!result) {
				results.html('<div class="GETpermission" id="'+permission+'">'+getmsg("commandneedspermission")+' "'+permission+'"! <a class="allow"> '+getmsg("allow")+' </a><a class="deny"> '+getmsg("deny")+' </a></div>');
				$('.GETpermission .deny').click(function(){
					results.hide();
					$('input').val('');
					$('input').trigger('keypress');
					alert(getmsg("cantviewwithoutpermission"));
				});	
				$('.GETpermission .allow').click(function(){
					chrome.permissions.request({
						origins: [$(this).parent().attr('id')]
					}, function(granted) {
						if (granted) {
							$('input').trigger('keypress');
							$('input').focus();
						}
					});	
				});
			}	
		}); 
	}	
}
function refreshClock() {
	var now = getTime();
	$('#clock').html((now.hour.toString().length == 1?'0'+now.hour:now.hour)+ ":" + (now.minute.toString().length == 1?'0'+now.minute:now.minute));
}
function getTime() {
	var date = new Date();
	return {
		hour: date.getHours(),
		minute: date.getMinutes()
	};
}




