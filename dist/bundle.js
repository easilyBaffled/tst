(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["tst"] = factory();
	else
		root["tst"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* WEBPACK VAR INJECTION */(function(global) {/* harmony export (immutable) */ __webpack_exports__["config"] = config;
/* harmony export (immutable) */ __webpack_exports__["entriesTest"] = entriesTest;
/* harmony export (immutable) */ __webpack_exports__["testGroup"] = testGroup;
/* harmony export (immutable) */ __webpack_exports__["dom"] = dom;
/* harmony export (immutable) */ __webpack_exports__["repeat"] = repeat;
let suiteFunc = 'describe';
let testFunc = 'test';

function config( { suite, test } ) {
    suiteFunc = suite;
    testFunc = test;
}
/**
 * An adapter for Jest's `test` function so it can easily slot in with Object.entries
 * @param {string} description - description text for this test
 * @param {function} func - a function to evaluate a given situation
 */
function entriesTest( [ description, func ] ) {
    global[ testFunc ]( description, func );
}

/**
 * A short cut for Jest's describe and test just to save some repetitive characters
 * @param {string} topic - description text for this group of tests
 * @param {object} tests - configured Jest tests where each entry's key:value is description string:test code
 */
function testGroup( topic, tests ) {
    const topicName = typeof topic === 'string'? topic : topic.name;
    global[ suiteFunc ]( topicName, () => {
        let clone = Object.assign( tests )

        Object.keys( clone )
            .filter( key => /^(before|after)[^ ]*$/.test( key ) )
            .forEach( key => {
                global[ key ]( clone[ key ] );
                delete clone[ key ]
            } );


        const onlyRunList = Object.keys( clone ).some( str => str.startsWith( '--' ) ) ?
            Object.entries( clone ).filter( ( [ name, func ] ) => name.startsWith( '--' ) )
            : Object.entries( clone );
        onlyRunList.forEach( entriesTest );
    } )
}

function bakedTestGroup( func, tests ) {
    describe( func.name, () => {
        Object.entries( tests ).forEach( ( [ description, func ] ) );
    } )
}

function dom( strings, ...args ) {
    document.body.innerHTML = strings.reduce( (accumulator, part, i) => {
        return accumulator + args[i - 1] + part
    } )
}

function repeat( times, func ) {
    Array(times).fill().forEach( func );
}

function isPrimitive (val)
{
    return val === null || /^[sbn]/.test( typeof val )
}

function parsePrimative( val )
{
    if( !val || !isPrimitive( val ) ) return val;
    return JSON.parse( val )
}

const testNameDict = {
    '==': 'toBe',
    '===': 'toEqual',
    '!=': 'not.toBe',
    '!==': 'not.toEqual',
};

/* harmony default export */ __webpack_exports__["default"] = (function( defaultValue = null ) {
    let value = [];

    function test( val = typeof defaultValue === 'function' ? defaultValue() : defaultValue ) {
        if( typeof defaultValue === 'function' ) val = defaultValue( val )

        const setup = expect( val );

        value.push( val );

        return function evaluation( [ str ], argValue ) {
            let [ wholeStr, evaluationFunc, expectationValue = argValue ] = str.replace(/^\s+|\s+$/g, "").match( /^(\S+)(\s+\S[\s\S]*)?/ );

            evaluationFunc =
                evaluationFunc === '->'        ? isPrimitive(val) ? 'toBe' : 'toEqual'
                : evaluationFunc === '!->'       ? isPrimitive(val) ? 'not.toBe' : 'not.toEqual'
                : evaluationFunc in testNameDict ? testNameDict[ evaluationFunc ]
                : evaluationFunc;

            evaluationFunc.split('.')
                .reduce( ( t, func ) => t[ func ], setup )( parsePrimative( expectationValue ) );
            /*
            'expect( value ).not.toBe( notValue )'

            setup = expect( value )
            setup = setup['not']    -> expect( value )['not']
            setup = setup['toBe']   -> expect( value )['not']['toBe']
            setup( notValue )       -> expect( value )['not']['toBe']( notValue )
            */


            return test;
        }
    }

    test.trigger = ( func ) =>
    {
        func();
        return test;
    };

    test.reassign = ( val ) =>
    {
        defaultValue = val;
        return test;
    };

    Object.defineProperty( test, 'value', {
        get: () => value
    } );

    return test;
});

/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(1)))

/***/ }),
/* 1 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ })
/******/ ]);
});