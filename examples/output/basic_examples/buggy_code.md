```javascript
function calculateTotal(items) {
    let total = 0;
    // TODO: Fix this calculation
    for (i = 0; i <= items.length; i++) {  // BUG: should be i < items.length
        total += items[i].price * items[i].quantity;  // FIXME: No null check
    }
    return total;  // XXX: Should apply tax here
}

// HACK: Temporary fix for authentication
function authenticate(user, pass) {
    // DEPRECATED: This method will be removed in v2.0
    if (user == "admin" && pass == "admin") {  // BUG: Hardcoded credentials
        return true;
    }
    // TODO: Implement proper authentication
}
```
