angular.module('LuCI2').factory('l2use', function($q, l2spin) {
	var _use = {
		_head: document.getElementsByTagName('head')[0],
		_registry: { },

		load: function(path) {
			var deferred = $q.defer();

			if (!/^(\/|https?:\/\/)/.test(path))
				path = this._base + path;

			if (this._registry[path]) {
				deferred.resolve(false);
			} else {
				l2spin.open();

				var el = document.createElement('script'), loaded = false;

				el.onload = el.onreadystatechange = function() {
					if ((el.readyState && el.readyState !== 'complete' &&
						 el.readyState !== 'loaded') || loaded)
						return;

					el.onload = el.onreadystatechange = null;
					loaded = true;

					deferred.resolve(true);

					l2spin.close();
				};

				el.onerror = function() {
					el.onerror = null;
					loaded = true;

					deferred.reject(false);
				};

				el.async = true;
				el.src = path;

				this._head.insertBefore(el, this._head.firstChild);
				this._registry[path] = true;
			}

			return deferred.promise;
		}
	};

	var scripts = document.getElementsByTagName('script');

	for (var i = 0; i < scripts.length; i++)	{
		if (/^(.*\/)?angular\.min\.js\b/.test(scripts[i].src)) {
			_use._base = RegExp.$1;
			break;
		}
	}

	return _use;
});
