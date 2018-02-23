// @flow
/** ******************************************************************************************************************
 * @file Test Augmentation Library
 * @authors Danny Michaelis <daniel.michaelis@iongroup.com>,
 * @date 13-Jan-2018
 *********************************************************************************************************************/

import { simpleTypeAssert as assert, required as R } from './util';

let suiteFunc = 'describe';
let testFunc = 'test';

const global = ( ( () => {} ).constructor( 'return this' ) )();

/**
 * Most testing libraries us a similar structure of
 * group( 'description', function() {
 *      test( 'description' () => ... )
 * } )
 * config lets the user specify which one their chosen library uses
 * @param {string} suite -
 * @param {string} test -
 */
export function config( { suite = 'describe', test = 'test' } )
{
    suiteFunc = suite;
    testFunc = test;
}

/**
 * An adapter for the `test` function so it can easily slot in with Object.entries
 * @param {string} description - description text for this test
 * @param {function} func - a function to evaluate a given situation
 */
export function entriesTest( [ description, func ] )
{
    global[ testFunc ]( description, func );
}

/**
 * A short cut for the describe and test just to save some repetitive characters
 * @param {string|function} topic - description text for this group of tests
 * @param {object} tests - configured Jest tests where each entry's key:value is description string:test code
 */
export function testGroup( topic = R( 'topic' ), tests = R( 'tests' ) )
{
    assert( topic, 'string|function', testGroup );
    assert( tests, 'object|function', testGroup );
    if ( !global || !global[ suiteFunc ] || !typeof global[ suiteFunc ] === 'function' )
        throw new Error( `${suiteFunc} is not available on the global scope or is not a function` );

    const topicName = topic.name || topic;

    if ( typeof tests === 'function' )
        tests = tests( testWrap( topic ) );

    global[ suiteFunc ]( topicName, () => {
        let clone = Object.assign( tests );
        // Handle all of the before and after hooks that are common to most test libraries
        Object.keys( clone )
            .filter( key => /^(before|after)[^ ]*$/.test( key ) )
            .forEach( key => {
                global[ key ]( clone[ key ] );
                delete clone[ key ];
            } );

        const onlyRunList = Object.keys( clone ).some( str => str.startsWith( '--' ) )
            ? Object.keys( clone ).filter( name => name.startsWith( '--' ) )
            : Object.entries( clone );

        onlyRunList.forEach( entriesTest );
    } );
}

/**
 * A tag function to succinctly update a test dom.
 * Tagged Templates are a really cool piece of native JS.
 * If you don't know about them you can read a nice tutorial here:
 * https://ponyfoo.com/articles/es6-template-strings-in-depth#demystifying-tagged-templates
 * @example
 *      dom` <div>${name}</div>`
 * @param {Array<string>} strings -
 * @param {Array<*>} args -
 */
export function dom( strings, ...args ) {
    if ( !document || !document.body  ) throw Error( 'document.body is not available' );

    document.body.innerHTML = strings.reduce( ( accumulator, part, i ) => {
        return accumulator + args[ i - 1 ] + part;
    } );
}

/**
 * A utility to repeat an action
 * @param {string|number} times -
 * @param {function} func -
 */
export function repeat( times, func ) {
    Array( times ).fill( '' ).forEach( func );
}

function isPrimitive( val )
{
    return val === null || /^[sbn]/.test( typeof val );
}

function parsePrimitive( val )
{
    if ( !val || !isPrimitive( val ) )
        return val;
    if ( val.includes( 'undefined' ) )
        return undefined;

    try
    {
        return JSON.parse( val );
    }
    catch ( e ) // If parse throws an error that means val is a proper string 'a' vs 'true' or '2', that's still a valid value
    {

        return val;
    }
}

/**
 * Converts equivalence short hand into the test library's API equivalent
 * This does assume's Jest's API
 * @param {string} evalFunction
 * @param {*} value
 * @returns {string}
 */
function parseAssertion( evalFunction, value )
{   // TODO: configure to handle alternate assertion libraries
    switch ( evalFunction ) {
        case '==':
            return 'toBe';
        case '===':
            return 'toEqual';
        case '!=':
            return 'not.toBe';
        case '!==':
            return 'not.toEqual';
        case '->':
            return isPrimitive( value ) ? 'toBe' : 'toEqual';
        case '!-':
            return isPrimitive( value ) ? 'not.toBe' : 'not.toEqual';
        default:
            return evalFunction;
    }
}

/**
 * Wraps a function with a proxy that WHEN THE FUNCTION IS CALLED will
 *  1. Intercept the function call
 *  2. Execute the function call
 *  3. return the function result with an `expect`
 * @param {function} func -
 * @returns {function}
 */
export function testWrap( func )
{
    if ( typeof func !== 'function' )
        func = () => func

    // This is an example of what we can do since we are wrapping the function.
    // Like a spy this will let us keep track of how many times the function has been called.
    func.called = [];
    func.clearCalled = () => {
        func.called = [];
    };

    if ( process.env.NODE_ENV === "test" )
        func.isProxy = 'testWrap';

    return new Proxy( func, {
        apply( target, thisArg, args ) { // trap for a function call. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/apply
            target.called.push( args );
            let expected;
            try
            {
                expected = expect( target( ...args ) );
            }
            catch ( e )
            {
                expected = expect( () => {
                    throw e;
                } );
            }

            return wrapExpresProxy( expected );
        }
    } );
}

/**
 * Wraps an object ( presumably the result of an `expect( 'something' )` ) with a function and a proxy that can
 * - Give you access to the original object's properties as if the Proxy weren't there
 * - Intercept the function call and will
 *  1. Detect if the function is being called as a tagged template.
 *      if No it returns the function otherwise ...
 *  2. Parse the template literal into the assertion function and expected value
 *  3. Runs through the assertion functions/properties
 *  4. Executes the assertion test
 * @param _ex
 * @returns {*}
 */
export function wrapExpresProxy( _ex ) {
    const func = () => _ex;

    if ( process.env.NODE_ENV === "test" )
        func.isProxy = 'wrapExpresProxy';

    const proxiedExpress = new Proxy( func, {
        get( _, name ) // Directly access the normal `expect` assertion API
        {
            return _ex[ name ];
        },
        apply( testTarget, thisArg, argumentsList )
        {   // Remember when I said Tagged Templates are a really cool? Here we go again
            const isTagFunction = // The string array in a tagged function has a non-enumerable property 'raw' that you wouldn't know was there if you weren't looking for it
                Array.isArray( argumentsList[ 0 ] ) &&
                argumentsList[ 0 ].every( str => typeof str === "string" ) &&
                !!argumentsList[ 0 ].raw;

            if ( !isTagFunction )
                return testTarget( ...argumentsList ); // I don't know what will happen if you do this, presumably not much

            const [ [ str ], argValue ] = argumentsList; // TODO: this assumes that argValue is NOT a `...args` array which is common to a tag function
            let [
                _,
                evaluationFunc,
                expectationValue = argValue // the assertion string could be ` -> 1` or ` -> ${1} ` in which case the value would not be in the string
            ] = str
                .replace( /^\s+|\s+$/g, "" )
                .match( /^(\S+)(\s+\S[\s\S]*)?/ );

            evaluationFunc = parseAssertion( evaluationFunc, argValue );

            /*
            * This takes the assertion as a string and performs all of the property getting.
            * In the case of something like .is.not.equal it's like
            * expect( 1 )[ 'is' ][ 'not' ][ 'equal' ]
            * which results in a final configured function
            * */
            evaluationFunc = evaluationFunc
                .split( "." )
                .reduce(
                    ( t, func ) =>
                        typeof t[ func ] === "function"
                            ? t[ func ].bind( t ) // t[ func ]'s `this` is the assertion api which could get lost in the shuffle
                            : t[ func ],
                    _ex
                );

            parsePrimitive( expectationValue ) === undefined
                ? evaluationFunc()
                : evaluationFunc( parsePrimitive( expectationValue ) );

            return proxiedExpress;
        }
    } );
    return proxiedExpress;
}


/*
    function submitFetch( url, headers = {}, method = 'GET', body = {} )
    {
        url = baseUrl + url;
        let combinedHeaders = Object.assign( defaultHeaders, headers );

        const config = {
                headers: combinedHeaders,
                cache: method === 'GET' ? "default" : "no-cache", // This needs to be evaluated
                method
            };
        if ( method !== 'GET' ) config.body = typeof body === "string" ? body : JSON.stringify( body );

        const dummyData = generate_dummy_data( url, method, config );

        if ( dummyData ) {
            const
                transformedData = data_transformer( url, method, dummyData ),
                resData = transformedData || dummyData;

            return Promise.resolve( resData );
        }

        return fetch( url, config )
                .then( check_status )
                .then( parse_resp_JSON )
                .then( res => {
                    const transformedData = data_transformer( url, method, res );
                    return transformedData || res;
                } );
    }

    #submitFetch( string! ): validJSON

    $global.fetch = () => Promise.resolve()
    $global.* = identity

    /?id=(\d\d)/.gen() ->
        $global.fetch` wasCalled `
        $0` toBeTruthy `
*/

/*
    #addr( number|string!, number|string! ): number
    $1 > 0, $2 > 0 -> $0 > 0, $0 > $1, $0 > $2
    $1 >= 0, $2 >= 0 -> [ $1, $2, 0 ].every( val => $0 >= val )
    $1 < 0, $2 > 0 -> $0 < $2

*/

/*
export default required( name = '' )=>
{
    // TODO: get the function name from the stack trace and use it in the messaging.
    const err = new Error( name ? name.toString() + " is a required parameter" : "A parameter is required for this function." );
    err.stack = err.stack.replace( /\n([^\n]+)/, '' ); // Remove the line referring to this file from the stack trace
    throw err
};

#required( string ): thrown Error
    $1 = [ /.*{0, 20}/.gen() * 8 ] ->
        $thrown,
        $thrown.stack.length < 2
*/



