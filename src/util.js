/** ******************************************************************************************************************
 * @file A collection of small, non-domain-specific function
 * @authors Danny Michaelis <dmichaelis0@gmail.com>,
 * @date 19-Feb-2018
 *********************************************************************************************************************/
"use strict";

export function simpleTypeAssert( value, type, parentFunction = { name: 'function' } )
{
    if ( !new RegExp( type ).test( typeof value ) )
    {
        const err = new TypeError( `${parentFunction.name}'s first paramter must be of type a function or string not ${typeof topic}` );
        err.stack = err.stack.replace( /\n([^\n]+)/, '' ); // Remove the line referring to this file from the stack trace
        throw err;
        throw err;
    }
}

/**
 * Used as a default parameter to force parameters to be required
 *
 * function someFunc( firstParam = '', secondParam = require( 'secondParam' ), )
 * @param {string} name
 */
export function required( name = '' )
{
    // TODO: get the function name from the stack trace and use it in the messaging.
    const err = new Error( name ? name.toString() + " is a required parameter" : "A parameter is required for this function." );
    err.stack = err.stack.replace( /\n([^\n]+)/, '' ); // Remove the line referring to this file from the stack trace
    throw err;
};

