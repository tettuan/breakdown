// Complex TypeScript bugs for advanced bug detection testing
interface User {
  id: number;
  name: string;
  email?: string;
}

class UserManager {
  private users: User[] = [];
  
  // Bug: method doesn't handle null/undefined properly
  addUser(user: User): void {
    this.users.push(user);  // Bug: no validation for duplicate IDs
  }
  
  // Bug: potential memory leak with async operations
  async fetchUserData(id: number): Promise<User | null> {
    const response = await fetch(`/api/users/${id}`);
    // Bug: no error handling for failed requests
    const userData = await response.json();
    return userData;  // Bug: no type validation
  }
  
  // Bug: race condition potential
  updateUser(id: number, updates: Partial<User>): User | undefined {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex >= 0) {
      // Bug: direct mutation without immutability
      Object.assign(this.users[userIndex], updates);
      return this.users[userIndex];
    }
    return undefined;
  }
  
  // Bug: O(n) complexity when it could be O(1)
  getUserById(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }
}

// Bug: improper error class extension
class CustomError extends Error {
  constructor(message: string) {
    super(message);
    // Bug: missing proper Error setup
  }
}

// Bug: async function without proper error handling
async function processUsers(userIds: number[]) {
  const results = [];
  for (const id of userIds) {
    const user = await new UserManager().fetchUserData(id);  // Bug: creating new instance in loop
    results.push(user);
  }
  return results;  // Bug: no type annotation
}

// Bug: any type usage
function processData(data: any): any {
  return data.someProperty?.value || "default";
}

export { UserManager, CustomError, processUsers, processData };