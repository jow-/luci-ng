# BUILDING LUCI-NG

There are two scenarios for building Luci-ng:

- Release
- Development

## Release

This case is completely handled by LEDE's build system. No external tools are needed.
The only prerequisite is to add luci-ng's feed and to select the LUCI2-UI-BASE package.
Once installed, the page will be available at:
router.ip/luci-ng.html

## Development

For developing Luci-NG it could be helpfull to have some tools installed globally, 
instead of solely relying on the local versions that LEDE's building system builds from source.

- Node.js:

Install from [Node.js](https://nodejs.org/en/download/) site or in Ubuntu Linux manually with:

``
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
``

- Gulp:
Install globally with:

`npm install -g gulp-cli`

- Bower: 
`npm install -g bower`

- Dependencies
All web development occurs inside the `/src` folder.
To prepare all dependencies for local development, you should change to that folder and issue these commands:

```
npm install 
bower install
gulp download
```

alternatively just: `make prepare`

### Build Tasks

Once the environment is prepared, inside the `/src` folder the following build tasks are available with the command:
`gulp <task>`

Maint Tasks:
- `clean`: empty dist and temp folders
- `dist`: generate final distribution files in the `/dist` folder
- `serve`: start a local web server to test the application. All ubus request will be forwarded to the server 
configured in `/gulp/conf.js`. This makes possible to continuilly test changes without the need to reinstall any
package in the router. It serves individual files, making it easier to debug.
- `serve:dist`: same as above but directly serving final dist files, instead of intermediate files.
- `lint:fix`: runs the linter enabling option to fix some simple errors directly in place.

Tasks in development:
These are still incomplete tasks to help prepare files for internalization:
- `translatePot`: generates the pot template to use as base for translations
- `translateJson`: converts .po files in `/po` folder to .json files to be loaded by the app