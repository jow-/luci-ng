/**
 * This file will only be loaded by legacy browsers with no 'module' support
 */

var app = document.querySelector('#approot');
if (app) app.style.display = 'none';

var legacy = document.querySelector('#legacy');
if (legacy) legacy.style.display = 'block';
