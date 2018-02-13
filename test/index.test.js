import * as tst from '../src';
import * as built_tst from '../dist/bundle.js';
const { testGroup, testWrap } = process.env.NODE_ENV === "build" ? built_tst : tst;

const
    identity = ( val = 1 ) => val,
    err = ( message = '' )  => { throw Error( message ) };

testGroup( 'testGroup works with objects', {
    'with expect': () =>
        expect( identity() ).toEqual( 1 ),

    'with wrapped func with the normal api': () =>
        testWrap( identity )().toEqual( 1 ),

    'with wrapped func with the succinct': () =>
        testWrap( identity )()` -> 1`,

    'thrown error': () => {
        expect( err ).toThrow();
        testWrap( err )()` toThrow `;
    }
} );

testGroup( identity, ident => ( {
    'with expect': () =>
        expect( identity() ).toEqual( 1 ),

    'with wrapped func with the normal api': () => {
        ident().toEqual( 1 );
        ident( 2 ).toEqual( 2 );
    },

    'with wrapped func with the succinct': () => {
        ident()` -> 1 `;
        ident( 2 )` toEqual 2 `;
        ident( 'abc' )` not.toEqual ${[ 'x', 'y', 'z' ].join()} `;
    },
    'thrown error': () => {
        expect( err ).toThrow();
        testWrap( err )()` toThrow `;
    }
} ) );

testGroup( err, troubleMaker => ( {
    'thrown error': () => {
        expect( err ).toThrow();
        troubleMaker().toThrow();
        troubleMaker()` toThrow `;
    }
} ) );

testGroup( testGroup, _testGroup => ( {
    'is a function': () => {
        expect( typeof testGroup );
    },
    'let\'s get a little nuts': () => {
        _testGroup( 'inception', {
            'braaww': () => _testGroup()` toThrow `
        } )` -> undefined `;
    }
} ) );

