/**
 * Example JavaScript file with common bugs for testing find bugs two params feature
 */

// Bug 1: Null pointer dereference potential
function getUserName(user) {
  // Missing null check
  return user.name.toUpperCase();
}

// Bug 2: Array index out of bounds potential
function getThirdElement(arr) {
  // No bounds checking
  return arr[2];
}

// Bug 3: Division by zero potential
function calculateAverage(numbers) {
  const sum = numbers.reduce((a, b) => a + b, 0);
  // No check for empty array
  return sum / numbers.length;
}

// Bug 4: Infinite loop potential
function findItem(list, target) {
  let i = 0;
  // Missing increment in some cases
  while (i < list.length) {
    if (list[i] === target) {
      return i;
    }
    // Forgot to increment i when item not found
  }
  return -1;
}

// Bug 5: Memory leak potential with event listeners
class Widget {
  constructor() {
    this.data = new Array(1000000).fill('data');
    // Event listener not removed on destroy
    document.addEventListener('click', this.handleClick.bind(this));
  }

  handleClick() {
    console.log('clicked');
  }

  // No destroy method to remove event listener
}

// Bug 6: Race condition in async code
let sharedCounter = 0;

async function incrementCounter() {
  const temp = sharedCounter;
  await new Promise(resolve => setTimeout(resolve, 10));
  sharedCounter = temp + 1; // Race condition
}

// Bug 7: Type coercion issues
function compareValues(a, b) {
  // Using == instead of ===
  return a == b;
}

// Bug 8: Unhandled promise rejection
async function fetchData(url) {
  // No try-catch block
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// Bug 9: Resource not closed
function readFile(filename) {
  const file = openFile(filename); // Hypothetical file opening
  const content = file.read();
  // Missing file.close()
  return content;
}

// Bug 10: SQL injection vulnerability
function getUserByName(name) {
  // Direct string concatenation in query
  const query = `SELECT * FROM users WHERE name = '${name}'`;
  return database.execute(query);
}