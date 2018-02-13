/** ******************************************************************************************************************
 * @file Test Augmentation Library
 * @authors Danny Michaelis <daniel.michaelis@iongroup.com>,
 * @date 13-Jan-2018
 *********************************************************************************************************************/

let suiteFunc = 'describe';
let testFunc = 'test';

const global = Function( 'return this' )(); // vs ( 1, eval )( 'this' ); what is the benefit of one over the other
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
 * @param {string} topic - description text for this group of tests
 * @param {object} tests - configured Jest tests where each entry's key:value is description string:test code
 */
export function testGroup( topic, tests )
{
    const topicName = typeof topic === 'string' ? topic : topic.name;
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
    return JSON.parse( val );
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
    // This is an example of what we can do since we are wrapping the function.
    // Like a spy this will let us keep track of how many times the function has been called.
    func.called = [];
    func.clearCalled = () => {
        func.called = [];
    };

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
function wrapExpresProxy( _ex ) {
    const func = () => _ex;
    return new Proxy( func, {
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
        }
    } );
}
