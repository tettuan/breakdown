function buggyCode() {
  let user = null;
  console.log(user.name); // BUG: null reference
  let items = [1, 2, 3];
  return items[10]; // BUG: array out of bounds
}
