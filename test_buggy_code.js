function buggyCode() {
  let x = null;
  return x.length; /* BUG: null reference */
}
