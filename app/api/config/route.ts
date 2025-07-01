import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Config from "@/lib/models/config";
import User from "@/lib/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/utils/authUtils";

const defaultImage = "https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3383.jpg?semt=ais_items_boosted&w=500";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !checkAdminAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    await dbConnect();
    try {
        const globalConfig = await Config.findById("globalConfig");

        if (!globalConfig) {
            return NextResponse.json({ message: "Global config not found" }, { status: 404 });
        }

        const recruiterEmails = globalConfig.recruiters || [];
        const recruitersWithDetails = await Promise.all(
            recruiterEmails.map(async (email: string) => {
                const user = await User.findOne({ email });
                return {
                    _id: user?._id || email, // Use user ID if found, otherwise use email as a fallback ID
                    email: email,
                    name: user?.name || "Unknown Name",
                    image: user?.image || defaultImage // Default profile picture
                };
            })
        );

        return NextResponse.json({
            currentRecruitment: globalConfig.currentRecruitment,
            recruitmentPhase: globalConfig.recruitmentPhase,
            recruiters: recruitersWithDetails,
            committees: globalConfig.committees || []
        });
    } catch (error) {
        console.error("Error fetching global config:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
