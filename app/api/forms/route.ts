import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/form";

export async function GET() {
    await dbConnect();
    try {
        const forms = await Form.find({});
        return NextResponse.json(forms);
    } catch (error) {
        console.error("Error fetching forms:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
