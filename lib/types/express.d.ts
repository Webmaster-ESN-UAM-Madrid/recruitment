import { Document } from "mongoose";
import { IUser } from "../models/user"; // Assuming IUser is the interface for your User model

declare global {
  namespace Express {
    interface User extends IUser, Document {
      // Add any additional properties from your User model that you want to access on req.user
      // For example, if your User model has a 'role' field:
      role?: string;
    }
  }
}
