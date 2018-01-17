let suiteFunc = 'describe';
let testFunc = 'test';

export function config( { suite, test } ) {
    suiteFunc = suite;
    testFunc = test;
}
/**
 * An adapter for Jest's `test` function so it can easily slot in with Object.entries
 * @param {string} description - description text for this test
 * @param {function} func - a function to evaluate a given situation
 */
export function entriesTest( [ description, func ] ) {
    global[ testFunc ]( description, func );
}

/**
 * A short cut for Jest's describe and test just to save some repetitive characters
 * @param {string} topic - description text for this group of tests
 * @param {object} tests - configured Jest tests where each entry's key:value is description string:test code
 */
export function testGroup( topic, tests ) {
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

export function dom( strings, ...args ) {
    document.body.innerHTML = strings.reduce( (accumulator, part, i) => {
        return accumulator + args[i - 1] + part
    } )
}

export function repeat( times, func ) {
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

export default function( defaultValue = null ) {
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
}
