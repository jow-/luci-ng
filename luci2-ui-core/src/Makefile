#
# Copyright (C) 2020 Adrian Panella <ianchi74@outlook.com>
#
# Licensed under the Apache License, Version 2.0.
#

all: build

node_modules: package.json
	npm install

prepare: node_modules 

build: prepare
	npm run gen-schema
	npm run build

compile: build

clean: 
	rm -rf dist
	 
distclean: clean
	rm -rf node_modules
	
