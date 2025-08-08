import dbConnect from "@/lib/mongodb";
import Config from "@/lib/models/config";
import User from "@/lib/models/user";
import Candidate from "@/lib/models/candidate";
import Interview from "@/lib/models/interview";

const defaultImage = "https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3383.jpg?semt=ais_items_boosted&w=500";

export const getGlobalConfig = async () => {
    await dbConnect();
    try {
        const globalConfig = await Config.findById("globalConfig");

        if (!globalConfig) {
            return { status: 404, message: "Global config not found" };
        }

        const recruiterEmails = globalConfig.recruiters || [];
        const recruitersWithDetails = await Promise.all(
            recruiterEmails.map(async (email: string) => {
                const user = await User.findOne({ email });
                return {
                    _id: user?._id || email,
                    email: email,
                    name: user?.name || "Unknown Name",
                    image: user?.image || defaultImage
                };
            })
        );

        return {
            status: 200,
            data: {
                currentRecruitment: globalConfig.currentRecruitment,
                recruitmentPhase: globalConfig.recruitmentPhase,
                recruiters: recruitersWithDetails,
                committees: globalConfig.committees || []
            }
        };
    } catch (error) {
        console.error("Error fetching global config:", error);
        return { status: 500, message: "Internal server error" };
    }
};

export const updateRecruitmentDetails = async (currentRecruitment: string, recruitmentPhase: string) => {
    await dbConnect();
    try {
        const globalConfig = await Config.findById("globalConfig");
        if (!globalConfig) {
            return { status: 404, message: "Global config not found" };
        }

        const oldRecruitmentPhase = globalConfig.recruitmentPhase;

        if (oldRecruitmentPhase !== recruitmentPhase) {
            // Special logic for entrevistas1 to entrevistas2 transition
            if (oldRecruitmentPhase === 'entrevistas1' && recruitmentPhase === 'entrevistas2') {
                const activeCandidates = await Candidate.find({ 
                    active: true, 
                    recruitmentPhase: oldRecruitmentPhase,
                    recruitmentId: globalConfig.currentRecruitment 
                });

                const interviews = await Interview.find({ 
                    recruitmentId: globalConfig.currentRecruitment 
                });

                const candidatesWithValidInterviews = new Set();
                
                interviews.forEach(interview => {
                    Object.keys(interview.opinions).forEach(candidateId => {
                        const opinion = interview.opinions[candidateId];
                        // Only exclude candidates who have been present or delayed
                        if (opinion.status === 'present' || opinion.status === 'delayed') {
                            candidatesWithValidInterviews.add(candidateId);
                        }
                    });
                });

                // Filter active candidates to include only those who:
                // 1. Have not been to any interview, OR
                // 2. Their interview status is absent, cancelled, or unset
                const candidatesForPendingEmails = activeCandidates.filter(candidate => {
                    return !candidatesWithValidInterviews.has(candidate._id.toString());
                });

                // Set emailSent to false and update phase only for the filtered candidates
                const candidateIds = candidatesForPendingEmails.map(c => c._id);
                if (candidateIds.length > 0) {
                    await Candidate.updateMany(
                        { _id: { $in: candidateIds } },
                        { $set: { emailSent: false, recruitmentPhase: recruitmentPhase } }
                    );
                }
                
                // Update phase for candidates who don't need pending emails (but keep emailSent as true)
                const candidatesWithoutPendingEmails = activeCandidates.filter(candidate => {
                    return candidatesWithValidInterviews.has(candidate._id.toString());
                });
                const candidateIdsWithoutPendingEmails = candidatesWithoutPendingEmails.map(c => c._id);
                if (candidateIdsWithoutPendingEmails.length > 0) {
                    await Candidate.updateMany(
                        { _id: { $in: candidateIdsWithoutPendingEmails } },
                        { $set: { recruitmentPhase: recruitmentPhase } }
                    );
                }
            } else {
                // Default behavior for other phase transitions
                await Candidate.updateMany(
                    { recruitmentPhase: oldRecruitmentPhase, recruitmentId: globalConfig.currentRecruitment },
                    { $set: { emailSent: false } }
                );
                
                await Candidate.updateMany(
                    { active: true, recruitmentId: globalConfig.currentRecruitment },
                    { $set: { recruitmentPhase: recruitmentPhase } }
                );
            }
        }

        globalConfig.currentRecruitment = currentRecruitment;
        globalConfig.recruitmentPhase = recruitmentPhase;
        await globalConfig.save();

        return { status: 200, message: "Config updated successfully" };
    } catch (error) {
        console.error("Error updating config details:", error);
        return { status: 500, message: "Internal server error" };
    }
};

export const addRecruiter = async (email: string) => {
    await dbConnect();
    try {
        const globalConfig = await Config.findById("globalConfig");
        if (!globalConfig) {
            return { status: 404, message: "Global config not found" };
        }

        const recruiters = globalConfig.recruiters || [];

        if (recruiters.includes(email)) {
            return { status: 409, message: "Email is already a recruiter" };
        }

        recruiters.push(email);
        globalConfig.recruiters = recruiters;
        await globalConfig.save();

        return { status: 200, message: "Recruiter added successfully" };
    } catch (error) {
        console.error("Error adding recruiter:", error);
        return { status: 500, message: "Internal server error" };
    }
};

export const removeRecruiter = async (email: string) => {
    await dbConnect();
    try {
        const globalConfig = await Config.findById("globalConfig");
        if (!globalConfig) {
            return { status: 404, message: "Global config not found" };
        }

        let recruiters = globalConfig.recruiters || [];

        const initialRecruitersCount = recruiters.length;
        recruiters = recruiters.filter((recruiter: string) => recruiter !== email);

        if (recruiters.length === initialRecruitersCount) {
            return { status: 404, message: "Email is not a recruiter" };
        }

        globalConfig.recruiters = recruiters;
        await globalConfig.save();

        return { status: 200, message: "Recruiter removed successfully" };
    } catch (error) {
        console.error("Error removing recruiter:", error);
        return { status: 500, message: "Internal server error" };
    }
};

export const getCurrentRecruitmentDetails = async () => {
    await dbConnect();
    try {
        const globalConfig = await Config.findById("globalConfig");

        if (!globalConfig) {
            return {
                currentRecruitment: "undefined",
                recruitmentPhase: "undefined"
            };
        }

        return {
            currentRecruitment: globalConfig.currentRecruitment,
            recruitmentPhase: globalConfig.recruitmentPhase
        };
    } catch (error) {
        console.error("Error fetching current recruitment details:", error);
        return {
            currentRecruitment: "error",
            recruitmentPhase: "error"
        };
    }
};