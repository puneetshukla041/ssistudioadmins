import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { Member, IMember } from "@/models/Employee";
import dbConnect from "@/lib/dbConnect";

// PUT (Update Member)
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  await dbConnect();
  const { id } = context.params;
  const { username, password, access } = await req.json(); // ✅ Added access

  try {
    const existingMember = await Member.findOne({ username, _id: { $ne: id } });
    if (existingMember) {
      return NextResponse.json(
        { error: "Username already exists." },
        { status: 409 }
      );
    }

    const updateData: { username: string; password?: string; access?: object } = { username }; // ✅ Added access to type
    if (password) {
      updateData.password = password; // ⚠️ Plaintext (for demo only)
    }
    if (access) { // ✅ Added access update
      updateData.access = access;
    }

    const updatedMember: IMember | null = await Member.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedMember) {
      return NextResponse.json(
        { message: "Member not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        _id: updatedMember._id!.toString(),
        username: updatedMember.username,
        password: updatedMember.password,
        access: updatedMember.access, // ✅ Return access
        createdAt: updatedMember.createdAt.toISOString(),
        updatedAt: updatedMember.updatedAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update member." },
      { status: 500 }
    );
  }
}

// DELETE (Remove Member)
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  await dbConnect();
  const { id } = context.params;

  try {
    const deletedMember: IMember | null = await Member.findByIdAndDelete(id);

    if (!deletedMember) {
      return NextResponse.json(
        { message: "Member not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Member deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting member:", error);
    return NextResponse.json(
      { message: error.message || "Failed to delete member." },
      { status: 500 }
    );
  }
}
