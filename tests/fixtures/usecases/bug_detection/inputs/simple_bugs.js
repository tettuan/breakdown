// Simple bugs for testing bug detection workflow
function calculateTotal(items) {
  var total = 0; // Bug: should use let/const instead of var
  for (i = 0; i < items.length; i++) { // Bug: missing declaration for 'i'
    total += items[i].price;
  }
  return total; // Bug: no validation for items or price
}

function getUserData(userId) {
  // Bug: no input validation
  return fetch("/api/users/" + userId) // Bug: should use template literals
    .then((response) => response.json())
    .catch((error) => {
      console.log(error); // Bug: should use proper error handling
    });
}

// Bug: unused variable
const _unusedVariable = "this is never used";

// Bug: comparison with == instead of ===
function isEqual(a, b) {
  return a == b;
}

module.exports = { calculateTotal, getUserData, isEqual };
