# Bug Report

## Issues Found
- Loop condition error: using <= instead of <
- Type comparison: using == instead of ===
- Missing null/undefined checks
- XSS vulnerability in DOM manipulation

## Code Sample
```javascript
function calculateTotal(items) {
    let total = 0;
    for (i = 0; i <= items.length; i++) {  // BUG: should be i < items.length
        total += items[i].price * items[i].quantity;  // FIXME: No null check
    }
    return total;
}
```
