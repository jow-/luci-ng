angular.module('LuCI2')
	.factory('l2class', function() {
		var _class = function() { };
		return angular.extend(_class, {
			extend: function(properties) {
				var prototype;

				_class.__init__ = true;
				prototype = new _class();
				delete _class.__init__;

				angular.extend(prototype, properties, {
					__super__: this.prototype,
					callSuper: function() {
						var args = [];
						var func = arguments[0];
						var ctx = this.__super__;
						var ret;

						if (typeof(ctx) != 'object' || typeof(ctx[func]) != 'function')
							return undefined;

						for (var i = 1; i < arguments.length; i++)
							args.push(arguments[i]);

						_class.__scope__ = ctx;
						ret = ctx[func].apply(this, args);
						delete _class.__scope__;

						return ret;
					}
				});

				function Subclass() {
					this.options = arguments[0] || { };

					if (!_class.__init__ && typeof(this.init) == 'function')
						this.init.apply(this, arguments);
				}

				Subclass.prototype = prototype;
				Subclass.prototype.constructor = Subclass;
				Subclass.extend = _class.extend;

				return Subclass;
			}
		});
	});
