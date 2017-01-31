/* eslint no-extend-native: 0 */

if (!angular.element.findAll) {
	angular.element.prototype.findAll = function(select) {
		if (this.length)
			return angular.element(this[0].querySelectorAll(select));

		return this;
	};
}

if (!(angular.element.findParent && angular.element.findPrev &&
	      angular.element.findNext && angular.element.findChildren)) {
	var docElem = document.documentElement,
		    nativeMatchFn = docElem.matches ||
				docElem.matchesSelector ||
				docElem.mozMatchesSelector ||
				docElem.webkitMatchesSelector ||
				docElem.msMatchesSelector;

	var matchFn = function(node, sel) {
		if (nativeMatchFn)
			return (node.nodeType === 1 && nativeMatchFn.call(node, sel));

		if (!node.parentNode)
			return false;

		var nodeList = node.parentNode.querySelectorAll(sel);

		for (var i = 0; i < nodeList.length; i++)
			if (nodeList[i] === node)
				return true;

		return false;
	};

	var traverseFn = function(node, sel, prop) {
		while (node && (node = node[prop]))
			if (matchFn(node, sel))
				return node;

		return null;
	};

	angular.element.prototype.findParent = function(select) {
		return this.length
				? angular.element(traverseFn(this[0], select, 'parentNode'))
				: this
			;
	};

	angular.element.prototype.findPrev = function(select) {
		return this.length
				? angular.element(traverseFn(this[0], select, 'previousSibling'))
				: this
			;
	};

	angular.element.prototype.findNext = function(select) {
		return this.length
				? angular.element(traverseFn(this[0], select, 'nextSibling'))
				: this
			;
	};

	angular.element.prototype.findChildren = function(select) {
		if (!this.length)
			return this;

		var childNodes = this[0].childNodes,
			    childLength = childNodes.length,
			childList = angular.element();

		for (var i = 0; i < childLength; i++)
			if (matchFn(childNodes[i], select))
				childList[childList.length++] = childNodes[i];

		return childList;
	};
}

if (!String.prototype.format) {
	String.prototype.format = function() {
		var html_esc = [/&/g, '&#38;', /"/g, '&#34;', /'/g, '&#39;', /</g, '&#60;',
			               />/g, '&#62;'];
		var quot_esc = [/"/g, '&#34;', /'/g, '&#39;'];
		var i;

		function esc(s, r) {
			for ( i = 0; i < r.length; i += 2 )
				s = s.replace(r[i], r[i+1]);
			return s;
		}

		var str = this;
		var out = '';
		var re = /^(([^%]*)%('.|0|\x20)?(-)?(\d+)?(\.\d+)?(%|b|c|d|u|f|o|s|x|X|q|h|j|t|m))/;
		var a = [], numSubstitutions = 0;

		while ((a = re.exec(str)) != null) {
			var m = a[1];
			var leftpart = a[2], pPad = a[3], pJustify = a[4], pMinLength = a[5];
			var pPrecision = a[6], pType = a[7];

			if (pType == '%') {
				subst = '%';
			} else {
				if (numSubstitutions < arguments.length) {
					var param = arguments[numSubstitutions++];

					var pad = '';
					if (pPad && pPad.substr(0, 1) == '\'')
						pad = leftpart.substr(1, 1);
					else if (pPad)
						pad = pPad;

					var justifyRight = true;
					if (pJustify && pJustify === '-')
						justifyRight = false;

					var minLength = -1;
					if (pMinLength)
						minLength = parseInt(pMinLength);

					var precision = -1;
					if (pPrecision && pType == 'f')
						precision = parseInt(pPrecision.substring(1));

					var subst = param;

					switch (pType) {
						case 'b':
							subst = (parseInt(param) || 0).toString(2);
							break;

						case 'c':
							subst = String.fromCharCode(parseInt(param) || 0);
							break;

						case 'd':
							subst = (parseInt(param) || 0);
							break;

						case 'u':
							subst = Math.abs(parseInt(param) || 0);
							break;

						case 'f':
							subst = (precision > -1)
									? ((parseFloat(param) || 0.0)).toFixed(precision)
									: (parseFloat(param) || 0.0);
							break;

						case 'o':
							subst = (parseInt(param) || 0).toString(8);
							break;

						case 's':
							subst = param;
							break;

						case 'x':
							subst = ('' + (parseInt(param) || 0).toString(16)).toLowerCase();
							break;

						case 'X':
							subst = ('' + (parseInt(param) || 0).toString(16)).toUpperCase();
							break;

						case 'h':
							subst = esc(param, html_esc);
							break;

						case 'q':
							subst = esc(param, quot_esc);
							break;

						case 'j':
							subst = String.serialize(param);
							break;

						case 't':
							var td = 0;
							var th = 0;
							var tm = 0;
							var ts = (param || 0);

							if (ts > 60) {
								tm = Math.floor(ts / 60);
								ts = (ts % 60);
							}

							if (tm > 60) {
								th = Math.floor(tm / 60);
								tm = (tm % 60);
							}

							if (th > 24) {
								td = Math.floor(th / 24);
								th = (th % 24);
							}

							subst = (td > 0)
									? '%dd %dh %dm %ds'.format(td, th, tm, ts)
									: '%dh %dm %ds'.format(th, tm, ts);

							break;

						case 'm':
							var mf = pMinLength ? parseInt(pMinLength) : 1000;
							var pr = pPrecision ? Math.floor(10*parseFloat('0'+pPrecision)) : 2;

							i = 0;
							var val = parseFloat(param || 0);
							var units = ['', 'K', 'M', 'G', 'T', 'P', 'E'];

							for (i = 0; (i < units.length) && (val > mf); i++)
								val /= mf;

							subst = val.toFixed(pr) + ' ' + units[i];
							break;
					}

					subst = (typeof(subst) == 'undefined') ? '' : subst.toString();

					if (minLength > 0 && pad.length > 0)
						for (i = 0; i < (minLength - subst.length); i++)
							subst = justifyRight ? (pad + subst) : (subst + pad);
				}
			}

			out += leftpart + subst;
			str = str.substr(m.length);
		}

		return out + str;
	};
}

angular.extend(angular, {
	isEmptyObject: function(x) {
		if (!angular.isObject(x))
			return false;

		for (var k in x)
			if (x.hasOwnProperty(k))
				return false;

		return true;
	},

	inArray: function(v, a) {
		if (!angular.isArray(a))
			return false;

		for (var i = 0; i < a.length; i++)
			if (a[i] === v)
				return true;

		return false;
	},

	toArray: function(x) {
		var r, i;
		switch (typeof(x)) {
			case 'number':
			case 'boolean':
				return [x];

			case 'string':
				r = [];
				var l = x.split(/\s+/);
				for (i = 0; i < l.length; i++)
					if (l[i].length > 0)
						r.push(l[i]);
				return r;

			case 'object':
				if (angular.isArray(x)) {
					r = [];
					for (i = 0; i < x.length; i++)
						r.push(x[i]);
					return r;
				} else if (angular.isObject(x)) {
					r = [];
					for (var k in x)
						if (x.hasOwnProperty(k))
							r.push(k);
					return r.sort();
				}
		}

		return [];
	},

	toObject: function(x) {
		var r, i;
		switch (typeof(x)) {
			case 'number':
			case 'boolean':
				r = { };
				r[x] = true;
				return r;

			case 'string':
				r = { };
				var l = x.split(/\s+/);
				for (i = 0; i < l.length; i++)
					if (l[i].length > 0)
						r[l[i]] = true;
				return r;

			case 'object':
				if (angular.isArray(x)) {
					r = { };
					for (i = 0; i < x.length; i++)
						r[x[i]] = true;
					return r;
				} else if (angular.isObject(x)) {
					return x;
				}
		}

		return { };
	},

	filterArray: function(array, item) {
		if (!angular.isArray(array))
			return [];

		for (var i = 0; i < array.length; i++)
			if (array[i] === item)
				array.splice(i--, 1);

		return array;
	},

	toClassName: function(str, suffix) {
		var n = str.replace(/(?:^|\/)(.)/g, function(m0, m1) {
			return m1.toUpperCase();
		});

		if (typeof(suffix) == 'string')
			n += suffix;

		return n;
	},

	toColor: function(str) {
		if (typeof(str) != 'string' || str.length == 0)
			return '#CCCCCC';

		if (str == 'wan')
			return '#F09090';
		else if (str == 'lan')
			return '#90F090';

		var i = 0, hash = 0;

		while (i < str.length)
			hash = str.charCodeAt(i++) + ((hash << 5) - hash);

		var r = (hash & 0xFF) % 128;
		var g = ((hash >> 8) & 0xFF) % 128;

		var min = 0;
		var max = 128;

		if ((r + g) < 128)
			min = 128 - r - g;
		else
							max = 255 - r - g;

		var b = min + (((hash >> 16) & 0xFF) % (max - min));

		return '#%02X%02X%02X'.format(0xFF - r, 0xFF - g, 0xFF - b);
	}
});
