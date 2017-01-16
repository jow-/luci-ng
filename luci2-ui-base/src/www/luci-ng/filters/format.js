angular.module('LuCI2')
	.filter('format', function() {
		return function(input, template, ifnull) {
			if (input === null || input === undefined) {
				if (ifnull !== null && ifnull !== undefined)
					return ifnull;

				return '';
			}

			if (angular.isString(template))
				return template.format(input);

			return input;
		};
	});
