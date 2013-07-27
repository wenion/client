/* Load this script using conditional IE comments if you need to support IE 7 and IE 6. */

window.onload = function() {
	function addIcon(el, entity) {
		var html = el.innerHTML;
		el.innerHTML = '<span style="font-family: \'icomoon\'">' + entity + '</span>' + html;
	}
	var icons = {
      		'icon-cog' : '&#x22;',
      		'icon-untitled' : '&#x23;',
      		'icon-untitled-2' : '&#x24;',
      		'icon-export_icon' : '&#x25;',
      		'icon-clipboard_copy_icon' : '&#x26;',
      		'icon-pen_1' : '&#x27;',
      		'icon-flag' : '&#x28;',
      		'icon-delete_icon' : '&#x29;',
      		'icon-heart_empty_icon' : '&#x2b;',
      		'icon-heart_icon' : '&#x2c;',
      		'icon-triangle' : '&#x2f;',
      		'icon-copy' : '&#x33;',
      		'icon-eye' : '&#x34;',
      		'icon-x' : '&#x36;',
      		'icon-cancel' : '&#x38;',
      		'icon-checkmark_icon' : '&#x39;',
      		'icon-checkmark' : '&#x3a;',
      		'icon-checkmark-2' : '&#x35;',
      		'icon-clock' : '&#x37;',
      		'icon-export' : '&#x2a;',
      		'icon-checkbox_unchecked_icon' : '&#x3e;',
      		'icon-checkbox_checked_icon' : '&#x3f;',
      		'icon-triangle-2' : '&#x3c;',
      		'icon-unlocked' : '&#xe000;',
      		'icon-locked' : '&#xe001;',
      		'icon-views' : '&#xe002;',
     		'icon-browser' : '&#xe003;',
      		'icon-ddbutton_filled' : '&#xe007;',
      		'icon-ddbutton_empty' : '&#xe008;',
      		'icon-reply' : '&#xe004;',
      		'icon-star_fav_icon' : '&#xe005;',
      		'icon-star_fav_empty_icon' : '&#xe006;',
      		'icon-triright' : '&#xe009;',
      		'icon-trileft' : '&#xe00a;',
      		'icon-comment' : '&#xe00b;',
      		'icon-comment2' : '&#xe00c;',
      		'icon-comment2-2' : '&#xe00e;',
      		'icon-comment2-3' : '&#xe00d;',
      		'icon-settings' : '&#xe00f;',
      		'icon-wrench' : '&#xe020;',
      		'icon-commentflip' : '&#xe010;',
           	'icon-hyp-logo4' : '&#xe014;',
            	'icon-plus' : '&#xe011;',
		'icon-menu' : '&#xe012;',
		'icon-pen-alt-fill' : '&#xe013;'
		},
		els = document.getElementsByTagName('*'),
		i, attr, html, c, el;
	for (i = 0; ; i += 1) {
		el = els[i];
		if(!el) {
			break;
		}
		attr = el.getAttribute('data-icon');
		if (attr) {
			addIcon(el, attr);
		}
		c = el.className;
		c = c.match(/icon-[^\s'"]+/);
		if (c && icons[c[0]]) {
			addIcon(el, icons[c[0]]);
		}
	}
};
