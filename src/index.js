let suiteFunc = 'describe';
let testFunc = 'test';

const global = Function('return this')(); // vs ( 1, eval )( 'this' ); what is the benefit of one over the other
/**
 * Most testing libraries us a similar structure of
 * group( 'description', function() {
 *      test( 'description' () => ... )
 * } )
 * config lets the user specify which one their chosen library uses
 * @param {string} suite -
 * @param {string} test -
 */
export function config( { suite = 'describe', test = 'test' } ) {
    suiteFunc = suite;
    testFunc = test;
}

/**
 * An adapter for the `test` function so it can easily slot in with Object.entries
 * @param {string} description - description text for this test
 * @param {function} func - a function to evaluate a given situation
 */
export function entriesTest( [ description, func ] ) {
    global[ testFunc ]( description, func );
}

/**
 * A short cut for the describe and test just to save some repetitive characters
 * @param {string} topic - description text for this group of tests
 * @param {object} tests - configured Jest tests where each entry's key:value is description string:test code
 */
export function testGroup( topic, tests ) {
    const topicName = typeof topic === 'string'? topic : topic.name;
    global[ suiteFunc ]( topicName, () => {
        let clone = Object.assign( tests )
        // Handle all of the before and after hooks that are common to most test libraries
        Object.keys( clone )
            .filter( key => /^(before|after)[^ ]*$/.test( key ) )
            .forEach( key => {
                global[ key ]( clone[ key ] );
                delete clone[ key ]
            } );


        const onlyRunList = Object.keys( clone ).some( str => str.startsWith( '--' ) )
            ? Object.entries( clone ).filter( ( [ name, func ] ) => name.startsWith( '--' ) )
            : Object.entries( clone );

        onlyRunList.forEach( entriesTest );
    } )
}

/**
 * A tag function to succinctly update a test dom.
 * Tagged Templates are a really cool piece of native JS.
 * If you don't know about them you can read a nice tutorial here:
 * https://ponyfoo.com/articles/es6-template-strings-in-depth#demystifying-tagged-templates
 * @example
 *      dom` <div>${name}</div>`
 * @param {Array<string>} strings -
 * @param {Array{*}} args -
 */
export function dom( strings, ...args ) {
    if( !document || !document.body  ) throw Error( 'document.body is not available' );

    document.body.innerHTML = strings.reduce( (accumulator, part, i) => {
        return accumulator + args[i - 1] + part
    } )
}

/**
 * A utility to repeat an action
 * @param {string|number} times -
 * @param {function} func -
 */
export function repeat( times, func ) {
    Array(times).fill('').forEach( func );
}

function isPrimitive (val)
{
    return val === null || /^[sbn]/.test( typeof val )
}

function parsePrimitive( val )
{
    if( !val || !isPrimitive( val ) ) return val;
    return JSON.parse( val )
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
    switch( evalFunction ) {
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
            return evalFunction
    }
}

export function testWrap(func)
{
    func.called = [];
    func.clearCalled = () => {
        func.called = [];
    };
    return new Proxy(func, {
        apply(target, thisArg, args) {
            target.called.push(args);
            let _ex;
            try {
                _ex = expect(target(...args));
            } catch (e) {
                _ex = expect(() => {
                    throw e;
                });
            }
            return wrapExpresProxy(_ex);
        }
    });
}


export default function( defaultValue = null ) {
    let value = [];

    function test( val = typeof defaultValue === 'function' ? defaultValue() : defaultValue ) {
        if( typeof defaultValue === 'function' ) val = defaultValue( val )

        const setup = expect( val );

        value.push( val );

        return function evaluation( [ str ], argValue ) {
            let [ wholeStr, evaluationFunc, expectationValue = argValue ] = str.replace(/^\s+|\s+$/g, "").match( /^(\S+)(\s+\S[\s\S]*)?/ );

            evaluationFunc = parseAssertion( evaluationFunc, val );

            evaluationFunc.split('.')
                .reduce( ( t, func ) => t[ func ], setup )( parsePrimitive( expectationValue ) );
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
}
