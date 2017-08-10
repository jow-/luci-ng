// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

// tslint:disable-next-line:naming-convention
export const environment = {
  production: false
};


// Reflect.metadata polyfill is only needed in the JIT/dev mode.
//
// In order to load these polyfills early enough (before app code), polyfill.ts imports this file to
// to change the order in the final bundle.
import 'core-js/es6/reflect';
import 'core-js/es7/reflect';
