angular.module('LuCI2').factory('l2validation', function(l2ip, gettext) {
	var _val = { };
	return angular.extend(_val, {
		compile: function(code)
		{
			var pos = 0;
			var esc = false;
			var depth = 0;
			var stack = [ ];

			code += ',';

			for (var i = 0; i < code.length; i++)
			{
				if (esc)
				{
					esc = false;
					continue;
				}

				switch (code.charCodeAt(i))
				{
				case 92:
					esc = true;
					break;

				case 40:
				case 44:
					if (depth <= 0)
					{
						if (pos < i)
						{
							var label = code.substring(pos, i);
								label = label.replace(/\\(.)/g, '$1');
								label = label.replace(/^[ \t]+/g, '');
								label = label.replace(/[ \t]+$/g, '');

							if (label && !isNaN(label))
							{
								stack.push(parseFloat(label));
							}
							else if (label.match(/^(['"]).*\1$/))
							{
								stack.push(label.replace(/^(['"])(.*)\1$/, '$2'));
							}
							else if (typeof _val.types[label] == 'function')
							{
								stack.push(_val.types[label]);
								stack.push([ ]);
							}
							else
							{
								throw "Syntax error, unhandled token '"+label+"'";
							}
						}
						pos = i+1;
					}
					depth += (code.charCodeAt(i) == 40);
					break;

				case 41:
					if (--depth <= 0)
					{
						if (typeof stack[stack.length-2] != 'function')
							throw "Syntax error, argument list follows non-function";

						stack[stack.length-1] =
							_val.compile(code.substring(pos, i));

						pos = i+1;
					}
					break;
				}
			}

			return stack;
		},

		test: function(stack, value) {
			delete _val.message;

			if (!stack[0].apply(value, stack[1]))
				return _val.message;

			return undefined;
		},

		types: {
			'integer': function()
			{
				if (this.match(/^-?[0-9]+$/) != null)
					return true;

				_val.message = gettext('Must be a valid integer');
				return false;
			},

			'uinteger': function()
			{
				if (_val.types['integer'].apply(this) && (this >= 0))
					return true;

				_val.message = gettext('Must be a positive integer');
				return false;
			},

			'float': function()
			{
				if (!isNaN(parseFloat(this)))
					return true;

				_val.message = gettext('Must be a valid number');
				return false;
			},

			'ufloat': function()
			{
				if (_val.types['float'].apply(this) && (this >= 0))
					return true;

				_val.message = gettext('Must be a positive number');
				return false;
			},

			'ipaddr': function()
			{
				if (l2ip.parseIPv4(this) || l2ip.parseIPv6(this))
					return true;

				_val.message = gettext('Must be a valid IP address');
				return false;
			},

			'ip4addr': function()
			{
				if (l2ip.parseIPv4(this))
					return true;

				_val.message = gettext('Must be a valid IPv4 address');
				return false;
			},

			'ip6addr': function()
			{
				if (l2ip.parseIPv6(this))
					return true;

				_val.message = gettext('Must be a valid IPv6 address');
				return false;
			},

			'netmask4': function()
			{
				if (l2ip.isNetmask(l2ip.parseIPv4(this)))
					return true;

				_val.message = gettext('Must be a valid IPv4 netmask');
				return false;
			},

			'netmask6': function()
			{
				if (l2ip.isNetmask(l2ip.parseIPv6(this)))
					return true;

				_val.message = gettext('Must be a valid IPv6 netmask6');
				return false;
			},

			'cidr4': function()
			{
				if (this.match(/^([0-9.]+)\/(\d{1,2})$/))
					if (RegExp.$2 <= 32 && l2ip.parseIPv4(RegExp.$1))
						return true;

				_val.message = gettext('Must be a valid IPv4 prefix');
				return false;
			},

			'cidr6': function()
			{
				if (this.match(/^([a-fA-F0-9:.]+)\/(\d{1,3})$/))
					if (RegExp.$2 <= 128 && l2ip.parseIPv6(RegExp.$1))
						return true;

				_val.message = gettext('Must be a valid IPv6 prefix');
				return false;
			},

			'ipmask4': function()
			{
				if (this.match(/^([0-9.]+)\/([0-9.]+)$/))
				{
					var addr = RegExp.$1, mask = RegExp.$2;
					if (l2ip.parseIPv4(addr) && l2ip.isNetmask(l2ip.parseIPv4(mask)))
						return true;
				}

				_val.message = gettext('Must be a valid IPv4 address/netmask pair');
				return false;
			},

			'ipmask6': function()
			{
				if (this.match(/^([a-fA-F0-9:.]+)\/([a-fA-F0-9:.]+)$/))
				{
					var addr = RegExp.$1, mask = RegExp.$2;
					if (l2ip.parseIPv6(addr) && l2ip.isNetmask(L.parseIPv6(mask)))
						return true;
				}

				_val.message = gettext('Must be a valid IPv6 address/netmask pair');
				return false;
			},

			'port': function()
			{
				if (_val.types['integer'].apply(this) &&
					(this >= 0) && (this <= 65535))
					return true;

				_val.message = gettext('Must be a valid port number');
				return false;
			},

			'portrange': function()
			{
				if (this.match(/^(\d+)-(\d+)$/))
				{
					var p1 = RegExp.$1;
					var p2 = RegExp.$2;

					if (_val.types['port'].apply(p1) &&
						_val.types['port'].apply(p2) &&
						(parseInt(p1) <= parseInt(p2)))
						return true;
				}
				else if (_val.types['port'].apply(this))
				{
					return true;
				}

				_val.message = gettext('Must be a valid port range');
				return false;
			},

			'macaddr': function()
			{
				if (this.match(/^([a-fA-F0-9]{2}:){5}[a-fA-F0-9]{2}$/) != null)
					return true;

				_val.message = gettext('Must be a valid MAC address');
				return false;
			},

			'host': function()
			{
				if (_val.types['hostname'].apply(this) ||
					_val.types['ipaddr'].apply(this))
					return true;

				_val.message = gettext('Must be a valid hostname or IP address');
				return false;
			},

			'hostname': function()
			{
				if ((this.length <= 253) &&
					((this.match(/^[a-zA-Z0-9]+$/) != null ||
					 (this.match(/^[a-zA-Z0-9_][a-zA-Z0-9_\-.]*[a-zA-Z0-9]$/) &&
					  this.match(/[^0-9.]/)))))
					return true;

				_val.message = gettext('Must be a valid host name');
				return false;
			},

			'network': function()
			{
				if (_val.types['uciname'].apply(this) ||
					_val.types['host'].apply(this))
					return true;

				_val.message = gettext('Must be a valid network name');
				return false;
			},

			'wpakey': function()
			{
				var v = this;

				if ((v.length == 64)
					  ? (v.match(/^[a-fA-F0-9]{64}$/) != null)
					  : ((v.length >= 8) && (v.length <= 63)))
					return true;

				_val.message = gettext('Must be a valid WPA key');
				return false;
			},

			'wepkey': function()
			{
				var v = this;

				if (v.substr(0,2) == 's:')
					v = v.substr(2);

				if (((v.length == 10) || (v.length == 26))
					  ? (v.match(/^[a-fA-F0-9]{10,26}$/) != null)
					  : ((v.length == 5) || (v.length == 13)))
					return true;

				_val.message = gettext('Must be a valid WEP key');
				return false;
			},

			'uciname': function()
			{
				if (this.match(/^[a-zA-Z0-9_]+$/) != null)
					return true;

				_val.message = gettext('Must be a valid UCI identifier');
				return false;
			},

			'range': function(min, max)
			{
				var val = parseFloat(this);

				if (_val.types['integer'].apply(this) &&
					!isNaN(min) && !isNaN(max) && ((val >= min) && (val <= max)))
					return true;

				_val.message = gettext('Must be a number between %d and %d').format(min, max);
				return false;
			},

			'min': function(min)
			{
				var val = parseFloat(this);

				if (_val.types['integer'].apply(this) &&
					!isNaN(min) && !isNaN(val) && (val >= min))
					return true;

				_val.message = gettext('Must be a number greater or equal to %d').format(min);
				return false;
			},

			'max': function(max)
			{
				var val = parseFloat(this);

				if (_val.types['integer'].apply(this) &&
					!isNaN(max) && !isNaN(val) && (val <= max))
					return true;

				_val.message = gettext('Must be a number lower or equal to %d').format(max);
				return false;
			},

			'rangelength': function(min, max)
			{
				var val = '' + this;

				if (!isNaN(min) && !isNaN(max) &&
					(val.length >= min) && (val.length <= max))
					return true;

				if (min != max)
					_val.message = gettext('Must be between %d and %d characters').format(min, max);
				else
					_val.message = gettext('Must be %d characters').format(min);
				return false;
			},

			'minlength': function(min)
			{
				var val = '' + this;

				if (!isNaN(min) && (val.length >= min))
					return true;

				_val.message = gettext('Must be at least %d characters').format(min);
				return false;
			},

			'maxlength': function(max)
			{
				var val = '' + this;

				if (!isNaN(max) && (val.length <= max))
					return true;

				_val.message = gettext('Must be at most %d characters').format(max);
				return false;
			},

			'or': function()
			{
				var msgs = [ ];

				for (var i = 0; i < arguments.length; i += 2)
				{
					delete _val.message;

					if (typeof(arguments[i]) != 'function')
					{
						if (arguments[i] == this)
							return true;

						msgs.push('"%s"'.format(arguments[i]));
						i--;
					}
					else if (arguments[i].apply(this, arguments[i+1]))
					{
						return true;
					}

					if (_val.message)
						msgs.push(_val.message.format.apply(_val.message, arguments[i+1]));
				}

				_val.message = msgs.join( gettext(' - or - '));
				return false;
			},

			'and': function()
			{
				var msgs = [ ];

				for (var i = 0; i < arguments.length; i += 2)
				{
					delete _val.message;

					if (typeof arguments[i] != 'function')
					{
						if (arguments[i] != this)
							return false;
						i--;
					}
					else if (!arguments[i].apply(this, arguments[i+1]))
					{
						return false;
					}

					if (_val.message)
						msgs.push(_val.message.format.apply(_val.message, arguments[i+1]));
				}

				_val.message = msgs.join(', ');
				return true;
			},

			'neg': function()
			{
				return _val.types['or'].apply(
					this.replace(/^[ \t]*![ \t]*/, ''), arguments);
			},

			'list': function(subvalidator, subargs)
			{
				if (typeof subvalidator != 'function')
					return false;

				var tokens = this.match(/[^ \t]+/g);
				for (var i = 0; i < tokens.length; i++)
					if (!subvalidator.apply(tokens[i], subargs))
						return false;

				return true;
			},

			'phonedigit': function()
			{
				if (this.match(/^[0-9\*#!\.]+$/) != null)
					return true;

				_val.message = gettext('Must be a valid phone number digit');
				return false;
			},

			'string': function()
			{
				return true;
			}
		}
	});
});
