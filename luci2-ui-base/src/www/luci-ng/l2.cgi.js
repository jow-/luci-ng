angular.module('LuCI2').factory('l2cgi', function($q, $http, l2rpc) {
	var _cgi = { };
	return angular.extend(_cgi, {

		_upload: function(fd)
		{
			var def=$q.defer();
			$http.post("/cgi-bin/luci-upload", fd, {
				transformRequest: angular.identity,
				headers: {
					'Accept': '*/*',
					'Content-Type': undefined
				},
			}).then(function(response){
					def.resolve(response.data);
				}, function(response){
					def.reject(response);
				});
			return def.promise;
		},

		uploadBackup: function(file) {
			var fd =new FormData();
			fd.append('sessionid', l2rpc.getToken());
			fd.append('filename', '/tmp/backup.tar.gz');
			fd.append('filemode', '0400');
			fd.append('filedata', file);
			return _cgi._upload(fd);
		},

		uploadUpgrade: function(file) {
			var fd =new FormData();
			fd.append('sessionid', l2rpc.getToken());
			fd.append('filename', '/tmp/firmware.bin');
			fd.append('filemode', '0400');
			fd.append('filedata', file);
			return _cgi._upload(fd);
		},

		_download: function()
		{
			var fileName = "backup.tar.gz";
			var a = document.createElement("a");
			document.body.appendChild(a);
			a.style = "display: none";
			return $http({
				url: '/cgi-bin/luci-backup',
				data: 'sessionid=' + l2rpc.getToken(),
				method: 'POST',
				headers: {
					'Accept': '*/*',
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				responseType: "arraybuffer",
				cache: false
				}).then(function(response){
						console.log("success");
						var file = new Blob([response.data],{
							type: 'application/x-gzip'
							});
						var fileURL = window.URL.createObjectURL(file);
						a.href = fileURL;
						a.download = fileName;
						a.click();
					},function(response){
						console.log("failed");
					});
		}
	});
});
