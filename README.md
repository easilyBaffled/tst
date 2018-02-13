# TsT/LazyJ/Terse-Test/Terst/Test Augmentation Library

This is a light weight library that is meant to augment your current test library, regardless of which one you use.
This does not impose any requirements on your tests. You can always return to the original library with in a test.

```javascript
"all test are welcome": () => {
    _addr( 1, 1 )` -> 2 `;    
    _addr( 1, 1 ).toEqual(2);
    expect( addr( 1, 1 ) ).toEqual( 2 );
}
"even errors": () => {
    _err()` toThrow `;
    _err().toThrow();
    expect( err() ).toThrow();
}

```

This library offers you a number of options. Here is how you use them.
Here is a step by step move from Jest to Jest augmented with LazyJ
### First the original test
```javascript
// Let's test this function
const addr = ( a, b ) => a + b;

// Assertion below
describe("addr", function() {
    it("should add two numbers", () => {
        expect(addr(1, 2)).toEqual(3);
        expect(addr(1, -2)).toEqual(-1);
    });
});
```
### Remove a bit of the usual repetition
```javascript
import { testGroup } from 'lazyJ';

testGroup(addr, {
    "should add two numbers": () => {
        expect(addr(1, 2)).toEqual(3);
        expect(addr(1, -2)).toEqual(-1);
    }
});
```
Notice that you can pass a function into test group as the 'description' and it will pull the function's name. 
In fact it is advised that you do, because then we can

### Prewrap with expect

```javascript
testGroup(addr, _addr => ({
    "should add two numbers": () => { 
        _addr(1, 2).toEqual(3);
        _addr(1, -2).toEqual(-1);
    }
}));

```

### And now for an even shorter shorthand
```javascript
testGroup(addr, _addr => ({
    "should add two numbers": () => { 
        _addr(1, 2)` toEqual 3`;
        _addr(1, -2)` toEqual ${ 1 - 2 } `;
    }
}));
```

```javascript
testGroup(addr, _addr => ({
    "should add two numbers": () => { 
        _addr(1, 2)` -> 3`;
        _addr(1, -2)` -> ${ 1 - 2 } `;
        
        _addr(1, 2)` === 3`;
        _addr(1, -2)` === ${ 1 - 2 } `;
        
        _addr(1, 2)` !== 4`;
        _addr(1, -2)` !== ${ 1 } `;
        
        _addr(1, 2)` !-> 4`;
        _addr(1, -2)` !-> ${ 1 } `;
        expect( 'this still works' ).toBeTruthy( true );
    }
}));
```

## API
testGroup( string|function, object| function => object )

```javascript
'=='    -> 'toBe'
'==='   -> 'toEqual'
'!='    -> 'not.toBe'
'!=='   -> 'not.toEqual'
'->'    -> isPrimitive( value ) ? 'toBe' : 'toEqual'
'!-'    -> isPrimitive( value ) ? 'not.toBe' : 'not.toEqual'
```

##Before and After hooks are still there

**Note:** This currently has only tested with Jest. 
