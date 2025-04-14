// models/user.model.ts

export interface User {
    sub: string;            // This is usually the user ID
    email: string;
    fullName?: string;      // If you're adding fullName as a claim in the backend
    role?: string;          // Optional: only if you send role in the token
    exp?: number;           // Token expiration (optional)
  }