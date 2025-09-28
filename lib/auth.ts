import type { AuthOptions, User as NextAuthUser, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import { config } from "@/lib/config";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/user";
import Config from "@/lib/models/config";
import Candidate from "@/lib/models/candidate";

const ESN_DOMAIN = "@esnuam.org";

const normalizeEmail = (email?: string | null) => email?.trim().toLowerCase() ?? "";

const getCurrentRecruitmentId = async (): Promise<string | null> => {
  const cfg = await Config.findById("globalConfig").select("currentRecruitment");
  return cfg?.currentRecruitment ?? null;
};

const findActiveCandidateForEmail = async (email: string) => {
  const currentRecruitment = await getCurrentRecruitmentId();
  if (!currentRecruitment) {
    return null;
  }

  return Candidate.findOne({
    recruitmentId: currentRecruitment,
    active: true,
    $or: [{ email }, { alternateEmails: email }]
  }).select("email active recruitmentId");
};

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: config.google.clientID!,
      clientSecret: config.google.clientSecret!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
          // hd: "esnuam.org"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user }: { user: NextAuthUser }) {
      await dbConnect();
      try {
        const incomingEmail = normalizeEmail(user.email);
        if (!incomingEmail) {
          return false;
        }

        const isEsnEmail = incomingEmail.endsWith(ESN_DOMAIN);

        let isNewbie = false;
        let canonicalEmail = incomingEmail;

        if (!isEsnEmail) {
          const candidate = await findActiveCandidateForEmail(incomingEmail);
          if (!candidate) {
            return false; // Only active newbies from current recruitment can sign in with non-ESN emails
          }
          isNewbie = true;
          canonicalEmail = normalizeEmail(candidate.email);
        }

        // Attempt to locate an existing user by canonical email first
        let existingUser = await User.findOne({ email: canonicalEmail });

        // Fallback to the original incoming email to merge legacy accounts
        if (!existingUser && canonicalEmail !== incomingEmail) {
          existingUser = await User.findOne({ email: incomingEmail });
        }

        if (existingUser) {
          existingUser.email = canonicalEmail;
          if (user.name && existingUser.name !== user.name) {
            existingUser.name = user.name;
          }
          if (typeof user.image === "string" && existingUser.image !== user.image) {
            existingUser.image = user.image;
          }
          existingUser.newbie = isNewbie;
          await existingUser.save();
        } else {
          await User.create({
            email: canonicalEmail,
            name: user.name || "Unknown Name",
            image: user.image || "",
            newbie: isNewbie
          });
        }

        // Ensure downstream callbacks work with the canonical email
        user.email = canonicalEmail;
      } catch (error) {
        console.error("Error saving user to DB:", error);
        return false;
      }
      return true;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token.email) {
        await dbConnect();
        const normalizedEmail = normalizeEmail(token.email);
        const user = await User.findOne({ email: normalizedEmail });

        if (user) {
          // Re-evaluate newbie status each session
          let isNewbie = false;
          if (!normalizedEmail.endsWith(ESN_DOMAIN)) {
            const candidate = await findActiveCandidateForEmail(normalizedEmail);
            isNewbie = Boolean(candidate);
          }

          if (user.newbie !== isNewbie) {
            user.newbie = isNewbie;
            await user.save();
          }

          session.user.id = user._id.toString();
          session.user.newbie = isNewbie;
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
