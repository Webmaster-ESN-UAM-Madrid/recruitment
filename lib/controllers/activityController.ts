import dbConnect from "@/lib/mongodb";
import Activity, { IActivity } from "@/lib/models/activity";
import Config from "@/lib/models/config";

export async function getCurrentRecruitmentId(): Promise<string | null> {
  const cfg = await Config.findById("globalConfig").select("currentRecruitment");
  return cfg?.currentRecruitment ?? null;
}

export async function getActivities(): Promise<IActivity[]> {
  await dbConnect();
  const recruitmentId = await getCurrentRecruitmentId();
  if (!recruitmentId) return [];
  return Activity.find({ recruitmentId }).sort({ date: 1, createdAt: -1 });
}

export async function getActivityBySlug(slug: string): Promise<IActivity | null> {
  await dbConnect();
  const recruitmentId = await getCurrentRecruitmentId();
  if (!recruitmentId) return null;
  return Activity.findOne({ slug, recruitmentId });
}

export async function getActivityById(id: string): Promise<IActivity | null> {
  await dbConnect();
  if (!id.match(/^[0-9a-fA-F]{24}$/)) return null;
  const recruitmentId = await getCurrentRecruitmentId();
  if (!recruitmentId) return null;
  return Activity.findOne({ _id: id, recruitmentId });
}

export async function createActivity(data: Partial<IActivity>): Promise<IActivity> {
  await dbConnect();
  const recruitmentId = await getCurrentRecruitmentId();
  if (!recruitmentId) throw new Error("No active recruitment found");
  
  const activity = new Activity({
    ...data,
    recruitmentId
  });
  return activity.save();
}

export async function updateActivity(slug: string, data: Partial<IActivity>): Promise<IActivity | null> {
  await dbConnect();
  const recruitmentId = await getCurrentRecruitmentId();
  if (!recruitmentId) return null;
  
  return Activity.findOneAndUpdate(
    { slug, recruitmentId },
    { $set: data },
    { new: true }
  );
}

export async function updateActivityById(id: string, data: Partial<IActivity>): Promise<IActivity | null> {
  await dbConnect();
  if (!id.match(/^[0-9a-fA-F]{24}$/)) return null;
  const recruitmentId = await getCurrentRecruitmentId();
  if (!recruitmentId) return null;
  
  return Activity.findOneAndUpdate(
    { _id: id, recruitmentId },
    { $set: data },
    { new: true }
  );
}

export async function deleteActivity(slug: string): Promise<boolean> {
  await dbConnect();
  const recruitmentId = await getCurrentRecruitmentId();
  if (!recruitmentId) return false;
  
  const result = await Activity.deleteOne({ slug, recruitmentId });
  return result.deletedCount > 0;
}

export async function deleteActivityById(id: string): Promise<boolean> {
  await dbConnect();
  if (!id.match(/^[0-9a-fA-F]{24}$/)) return false;
  const recruitmentId = await getCurrentRecruitmentId();
  if (!recruitmentId) return false;
  
  const result = await Activity.deleteOne({ _id: id, recruitmentId });
  return result.deletedCount > 0;
}
