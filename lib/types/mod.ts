// Type definitions
export interface Project {
  id: string;
  title: string;
  description: string;
  // TODO: Add more project fields
}

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  // TODO: Add more issue fields
}

export interface Task {
  id: string;
  issueId: string;
  title: string;
  description: string;
  // TODO: Add more task fields
} 