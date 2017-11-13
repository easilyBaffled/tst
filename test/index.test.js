import * as tst from '../src';
import * as built_tst from '../dist/bundle.js';
const { default:  _ex, testGroup } = process.env.NODE_ENV === "build" ? built_tst: tst

testGroup( 'susinct', {
    'basic usage': () => {
        let value = 1;
        _ex()
            (1)` toEqual 1`
            (1)` toBe 1`
            (1)` === 1`
            (1)` == 1`
            (1)` -> 1`
            (1)` -> ${value}`
            (1)` !-> 2`
            (1)` !== "1"`
            (1)` not.toEqual "1"`

        let x = true
        let obj = { a: 1 }
        _ex()
            ( x )` -> true`
            ( x )` -> ${x}`
            ( x )` !-> false`
            ( obj )` -> ${new Object(obj)} `
            ( obj )` -> { "a": 1 }`
            ( obj )` !-> ${ { a: 2 } }`
            ( () => { throw Error() } )` toThrowError`
    },
    'default values': () => {
        let value = 1;
        _ex( 1 )
        ()` toEqual 1`
        ()` === 1`
        ()` -> 1`
        ()` -> ${value}`
        ()` !-> 2`
        ()` !== "1"`
            .reassign( 2 )
            ()` -> 2`
        ()` !-> 1`

    },
    'functions get called for each test': () => {
        _ex( () => 1 )
            ()` -> 1`
        .reassign( () => 2 )
            ()` -> 2`
    },
    'trigger functions without breaking from the group': () => {
        const obj = {
            val: 1,
            add: function() {
                this.val = this.val + 1;
            }
        }

        _ex()
            ( obj.val )` -> 1`
        .trigger( () => obj.add() )
            ( obj.val )` -> 2`

        _ex( () => obj.val )
            ()` -> 2`
        .trigger( () => obj.add() )
            ()` -> 3`
    },
    'vestigial `value` attribute that might be useful': () => {
    // It just collects the input values right now. But it could collect other aspects of the tests
        _ex()
            ( _ex().value )` -> []`;
        expect( _ex().value ).toEqual( [] )

        const valueString = _ex()
                (1)` -> 1`
                (2)` -> 2`
            .value

        _ex()
            ( valueString )` -> [ 1, 2 ]`;


    }
} );
