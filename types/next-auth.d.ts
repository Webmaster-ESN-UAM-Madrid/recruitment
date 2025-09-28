import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      newbie?: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
  }
}
