function calculateTotal(items) {
    let total = 0;
    // TODO: Fix this calculation
    for (i = 0; i <= items.length; i++) {  // BUG: should be i < items.length
        total += items[i].price * items[i].quantity;  // FIXME: No null check
    }
    return total;
}

function processUser(user) {
    if (user == null) {  // BUG: should use === for strict comparison
        return;
    }
    // BUG: No validation for user.email
    const emailDomain = user.email.split('@')[1];
    document.innerHTML = `Welcome ${user.name}!`;  // BUG: XSS vulnerability
}
