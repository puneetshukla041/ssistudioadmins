import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Member, IMember } from "@/models/Employee";
import dbConnect from "@/lib/dbConnect";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ Correctly type params as a Promise
) {
  await dbConnect();
  
  // Await the params promise before destructuring
  const { id } = await context.params; 
  
  // The rest of your code
  const { username, password, access } = await req.json();

  try {
    const existingMember = await Member.findOne({ username, _id: { $ne: id } });
    if (existingMember) {
      return NextResponse.json(
        { error: "Username already exists." },
        { status: 409 }
      );
    }

    const updateData: { username: string; password?: string; access?: object } = { username };
    if (password) {
      updateData.password = password;
    }
    if (access) {
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
        access: updatedMember.access,
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
  context: { params: Promise<{ id: string }> } // ✅ Also update the DELETE handler's signature
) {
  await dbConnect();
  const { id } = await context.params;

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
