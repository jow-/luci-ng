#
# Copyright (C) 2017 Adrian Panella <ianchi74@outlook.com>
#
# Licensed under the Apache License, Version 2.0.
#

GULP:=node ./node_modules/.bin/gulp
BOWER:=node ./node_modules/.bin/bower

all: build

.tmp/.npm_stamp: package.json
	npm install
	mkdir -p .tmp
	touch .tmp/.npm_stamp

.tmp/.bower_stamp: bower.json 
	$(BOWER) install --config.interactive=false
	mkdir -p .tmp
	touch .tmp/.bower_stamp

.tmp/.download_stamp: ./gulp/conf.js
	$(GULP) download
	mkdir -p .tmp
	touch .tmp/.download_stamp

prepare: .tmp/.npm_stamp .tmp/.bower_stamp .tmp/.download_stamp

build: prepare
	$(GULP) dist

clean: 
	$(GULP) clean
	 
distclean: clean
	rm -rf bower_components
	rm -rf node_modules
	
