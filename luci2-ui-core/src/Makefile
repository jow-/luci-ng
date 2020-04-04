#
# Copyright (C) 2020 Adrian Panella <ianchi74@outlook.com>
#
# Licensed under the Apache License, Version 2.0.
#

all: build

node_modules: package.json
	npm ci

icons.yaml: ;

.icons: node_modules icons.yaml
	npm run svg
	touch .icons

prepare: node_modules .icons 

build: prepare
	npm run gen-schema
	npm run build

compile: build

clean: 
	rm -rf dist
	rm -rf out
	rm .icons
	 
distclean: clean
	rm -rf node_modules
	
