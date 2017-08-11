
angular.module('LuCI2').directive('uciValidator', function(L2validation) {
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, elm, attrs, ctrl) {
			var validator;
			if (attrs.uciValidator) {
				validator = new L2validation(attrs.uciValidator);
				ctrl.$validators.uciValidator = validator.getValidator(ctrl);
			}
		}
	};
});


angular.module('LuCI2').factory('L2validation', function(l2ip, gettext) {
	function Validation(code) {
		var self = this;

		this.types= {
			'integer': function() {
				if (this.match(/^-?[0-9]+$/) != null)
					return true;

				self.message = gettext('Must be a valid integer');
				return false;
			},

			'uinteger': function() {
				if (self.types['integer'].apply(this) && (this >= 0))
					return true;

				self.message = gettext('Must be a positive integer');
				return false;
			},

			'float': function() {
				if (!isNaN(parseFloat(this)))
					return true;

				self.message = gettext('Must be a valid number');
				return false;
			},

			'ufloat': function() {
				if (self.types['float'].apply(this) && (this >= 0))
					return true;

				self.message = gettext('Must be a positive number');
				return false;
			},

			'ipaddr': function() {
				if (l2ip.parseIPv4(this) || l2ip.parseIPv6(this))
					return true;

				self.message = gettext('Must be a valid IP address');
				return false;
			},

			'ip4addr': function() {
				if (l2ip.parseIPv4(this))
					return true;

				self.message = gettext('Must be a valid IPv4 address');
				return false;
			},

			'ip6addr': function() {
				if (l2ip.parseIPv6(this))
					return true;

				self.message = gettext('Must be a valid IPv6 address');
				return false;
			},

			'netmask4': function() {
				if (l2ip.isNetmask(l2ip.parseIPv4(this)))
					return true;

				self.message = gettext('Must be a valid IPv4 netmask');
				return false;
			},

			'netmask6': function() {
				if (l2ip.isNetmask(l2ip.parseIPv6(this)))
					return true;

				self.message = gettext('Must be a valid IPv6 netmask6');
				return false;
			},

			'cidr4': function() {
				if (this.match(/^([0-9.]+)\/(\d{1,2})$/))
					if (RegExp.$2 <= 32 && l2ip.parseIPv4(RegExp.$1))
						return true;

				self.message = gettext('Must be a valid IPv4 prefix');
				return false;
			},

			'cidr6': function() {
				if (this.match(/^([a-fA-F0-9:.]+)\/(\d{1,3})$/))
					if (RegExp.$2 <= 128 && l2ip.parseIPv6(RegExp.$1))
						return true;

				self.message = gettext('Must be a valid IPv6 prefix');
				return false;
			},

			'ipmask4': function() {
				if (this.match(/^([0-9.]+)\/([0-9.]+)$/)) {
					var addr = RegExp.$1, mask = RegExp.$2;
					if (l2ip.parseIPv4(addr) && l2ip.isNetmask(l2ip.parseIPv4(mask)))
						return true;
				}

				self.message = gettext('Must be a valid IPv4 address/netmask pair');
				return false;
			},

			'ipmask6': function() {
				if (this.match(/^([a-fA-F0-9:.]+)\/([a-fA-F0-9:.]+)$/)) {
					var addr = RegExp.$1, mask = RegExp.$2;
					if (l2ip.parseIPv6(addr) && l2ip.isNetmask(l2ip.parseIPv6(mask)))
						return true;
				}

				self.message = gettext('Must be a valid IPv6 address/netmask pair');
				return false;
			},

			'port': function() {
				if (self.types['integer'].apply(this) &&
					(this >= 0) && (this <= 65535))
					return true;

				self.message = gettext('Must be a valid port number');
				return false;
			},

			'portrange': function() {
				if (this.match(/^(\d+)-(\d+)$/)) {
					var p1 = RegExp.$1;
					var p2 = RegExp.$2;

					if (self.types['port'].apply(p1) &&
						self.types['port'].apply(p2) &&
						(parseInt(p1) <= parseInt(p2)))
						return true;
				} else if (self.types['port'].apply(this)) {
					return true;
				}

				self.message = gettext('Must be a valid port range');
				return false;
			},

			'macaddr': function() {
				if (this.match(/^([a-fA-F0-9]{2}:){5}[a-fA-F0-9]{2}$/) != null)
					return true;

				self.message = gettext('Must be a valid MAC address');
				return false;
			},

			'host': function() {
				if (self.types['hostname'].apply(this) ||
					self.types['ipaddr'].apply(this))
					return true;

				self.message = gettext('Must be a valid hostname or IP address');
				return false;
			},

			'hostname': function() {
				if ((this.length <= 253) &&
					((this.match(/^[a-zA-Z0-9]+$/) != null ||
					 (this.match(/^[a-zA-Z0-9_][a-zA-Z0-9_\-.]*[a-zA-Z0-9]$/) &&
					  this.match(/[^0-9.]/)))))
					return true;

				self.message = gettext('Must be a valid host name');
				return false;
			},

			'network': function() {
				if (self.types['uciname'].apply(this) ||
					self.types['host'].apply(this))
					return true;

				self.message = gettext('Must be a valid network name');
				return false;
			},

			'wpakey': function() {
				var v = this;

				if ((v.length == 64)
					  ? (v.match(/^[a-fA-F0-9]{64}$/) != null)
					  : ((v.length >= 8) && (v.length <= 63)))
					return true;

				self.message = gettext('Must be a valid WPA key');
				return false;
			},

			'wepkey': function() {
				var v = this;

				if (v.substr(0, 2) == 's:')
					v = v.substr(2);

				if (((v.length == 10) || (v.length == 26))
					  ? (v.match(/^[a-fA-F0-9]{10,26}$/) != null)
					  : ((v.length == 5) || (v.length == 13)))
					return true;

				self.message = gettext('Must be a valid WEP key');
				return false;
			},

			'uciname': function() {
				if (this.match(/^[a-zA-Z0-9_]+$/) != null)
					return true;

				self.message = gettext('Must be a valid UCI identifier');
				return false;
			},

			'range': function(min, max) {
				var val = parseFloat(this);

				if (self.types['integer'].apply(this) &&
					!isNaN(min) && !isNaN(max) && ((val >= min) && (val <= max)))
					return true;

				self.message = gettext('Must be a number between %d and %d').format(min, max);
				return false;
			},

			'min': function(min) {
				var val = parseFloat(this);

				if (self.types['integer'].apply(this) &&
					!isNaN(min) && !isNaN(val) && (val >= min))
					return true;

				self.message = gettext('Must be a number greater or equal to %d').format(min);
				return false;
			},

			'max': function(max) {
				var val = parseFloat(this);

				if (self.types['integer'].apply(this) &&
					!isNaN(max) && !isNaN(val) && (val <= max))
					return true;

				self.message = gettext('Must be a number lower or equal to %d').format(max);
				return false;
			},

			'rangelength': function(min, max) {
				var val = '' + this;

				if (!isNaN(min) && !isNaN(max) &&
					(val.length >= min) && (val.length <= max))
					return true;

				if (min != max)
					self.message = gettext('Must be between %d and %d characters').format(min, max);
				else
					self.message = gettext('Must be %d characters').format(min);
				return false;
			},

			'minlength': function(min) {
				var val = '' + this;

				if (!isNaN(min) && (val.length >= min))
					return true;

				self.message = gettext('Must be at least %d characters').format(min);
				return false;
			},

			'maxlength': function(max) {
				var val = '' + this;

				if (!isNaN(max) && (val.length <= max))
					return true;

				self.message = gettext('Must be at most %d characters').format(max);
				return false;
			},

			'or': function() {
				var msgs = [];

				for (var i = 0; i < arguments.length; i += 2) {
					delete self.message;

					if (typeof(arguments[i]) != 'function') {
						if (arguments[i] == this)
							return true;

						msgs.push('"%s"'.format(arguments[i]));
						i--;
					} else if (arguments[i].apply(this, arguments[i+1])) {
						return true;
					}

					if (self.message)
						msgs.push(self.message.format.apply(self.message, arguments[i+1]));
				}

				self.message = msgs.join( gettext(' - or - '));
				return false;
			},

			'and': function() {
				var msgs = [];

				for (var i = 0; i < arguments.length; i += 2) {
					delete self.message;

					if (typeof arguments[i] != 'function') {
						if (arguments[i] != this)
							return false;
						i--;
					} else if (!arguments[i].apply(this, arguments[i+1])) {
						return false;
					}

					if (self.message)
						msgs.push(self.message.format.apply(self.message, arguments[i+1]));
				}

				self.message = msgs.join(', ');
				return true;
			},

			'neg': function() {
				return self.types['or'].apply(
					this.replace(/^[ \t]*![ \t]*/, ''), arguments);
			},

			'list': function(subvalidator, subargs) {
				if (typeof subvalidator != 'function')
					return false;

				var tokens = this.match(/[^ \t]+/g);
				for (var i = 0; i < tokens.length; i++)
					if (!subvalidator.apply(tokens[i], subargs))
						return false;

				return true;
			},

			'phonedigit': function() {
				if (this.match(/^[0-9\*#!\.]+$/) != null)
					return true;

				self.message = gettext('Must be a valid phone number digit');
				return false;
			},

			'string': function() {
				return true;
			}
		};

		this.compile(code);
	}

	Validation.prototype = {
		message: undefined,
		result: undefined,
		_stack: null,

		compile: function(code) {
			this.code = code;
			this._stack = this._compile(code);
		},

		_compile: function(code) {
			var pos = 0;
			var esc = false;
			var depth = 0;
			var stack = [];

			code += ',';

			for (var i = 0; i < code.length; i++) {
				if (esc) {
					esc = false;
					continue;
				}

				switch (code.charCodeAt(i)) {
					case 92: // '\'
						esc = true;
						break;

					case 40: // '('
					case 44: // ','
						if (depth <= 0) {
							if (pos < i) {
								var label = code.substring(pos, i);
								label = label.replace(/\\(.)/g, '$1');
								label = label.replace(/^[ \t]+/g, '');
								label = label.replace(/[ \t]+$/g, '');

								if (label && !isNaN(label)) {
									stack.push(parseFloat(label));
								} else if (label.match(/^(['"]).*\1$/)) {
									stack.push(label.replace(/^(['"])(.*)\1$/, '$2'));
								} else if (typeof this.types[label] == 'function') {
									stack.push(this.types[label]);
									stack.push([]);
								} else							{
									throw new Error('Syntax error, unhandled token \''+label+'\'');
								}
							}
							pos = i+1;
						}
						depth += (code.charCodeAt(i) == 40);
						break;

					case 41: // ')'
						if (--depth <= 0) {
							if (typeof stack[stack.length-2] != 'function')
								throw new Error('Syntax error, argument list follows non-function');

							stack[stack.length-1] = this._compile(code.substring(pos, i));

							pos = i+1;
						}
						break;
				}
			}

			return stack;
		},

		test: function(value) {
			this.message=null;

			if (this._stack &&
				!this._stack[0].apply(value, this._stack[1])) {
				this.result = false;
				this.message = this.message || gettext('Validation error');
				return this.message;
			}

			this.result = true;

			return undefined;
		},

		getValidator: function(modelCtrl) {
			var self = this;

			return function(modelValue, viewValue) {
				modelCtrl.uciValidationMessage = '';
				if (viewValue=='' || angular.isUndefined(viewValue)) return true; // allow empty fields
				if (!angular.isArray(viewValue)) viewValue = [viewValue];
				for (var i=0; i < viewValue.length; i++) {
					self.test(viewValue[i]);
					modelCtrl.uciValidationMessage = modelCtrl.uciValidationMessage || self.message || '';
					if (!self.result) break;
				}
				return self.result;
			};
		}


	};

	return Validation;
});
