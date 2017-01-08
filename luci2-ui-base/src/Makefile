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
	$(BOWER) install
	mkdir -p .tmp
	touch .tmp/.bower_stamp


prepare: .tmp/.npm_stamp .tmp/.bower_stamp

build: prepare
	$(GULP) build

clean: 
	$(GULP) clean
	 
distclean: clean
	rm -rf bower_components
	rm -rf node_modules
	
