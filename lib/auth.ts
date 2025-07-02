import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { config } from "@/lib/config";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/user";

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: config.google.clientID!,
            clientSecret: config.google.clientSecret!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                    hd: "esnuam.org"
                }
            }
        })
    ],
    callbacks: {
        async signIn({ user }) {
            await dbConnect();
            if (user.email && user.email.endsWith("@esnuam.org")) {
                try {
                    // Find the user by email or create if not exists
                    // eslint-disable-next-line prefer-const
                    let existingUser = await User.findOne({ email: user.email });

                    if (existingUser) {
                        // Update existing user's name and image if they have changed
                        if (existingUser.name !== user.name || existingUser.image !== user.image) {
                            existingUser.name = user.name || existingUser.name;
                            existingUser.image = user.image || existingUser.image;
                            await existingUser.save();
                        }
                    } else {
                        // Create new user if not found
                        await User.create({
                            email: user.email,
                            name: user.name || "Unknown Name",
                            image: user.image || "",
                        });
                    }
                } catch (error) {
                    console.error("Error saving user to DB:", error);
                    return false; // Prevent sign-in if there's a DB error
                }
                return true;
            }
            else {
                return "/auth/error?error=InvalidDomain";
            }
        },
        async session({ session, token }) {
            if (session.user && token.email) {
                await dbConnect();
                const user = await User.findOne({ email: token.email });
                if (user) {
                    session.user.id = user._id.toString();
                }
            }
            return session;
        }
    },
    pages: {
        signIn: "/auth/signin",
        signOut: "/auth/signout",
        error: "/auth/error",
        verifyRequest: "/auth/verify-request",
        newUser: "/auth/new-user"
    }
};