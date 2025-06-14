// Test JavaScript file for find bugs command testing

function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i <= items.length; i++) { // Bug: should be i < items.length
    total += items[i].price;
  }
  return total;
}

function processUser(user) {
  if (user.name && user.email) {
    // Missing null check for user object
    return {
      name: user.name.toUpperCase(),
      email: user.email.toLowerCase(),
    };
  }
}

module.exports = { calculateTotal, processUser };
