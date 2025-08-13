// app/api/members/route.ts
import { NextResponse } from 'next/server';

import { Member, IMember } from '@/models/Employee'; // Using Mongoose model
import dbConnect from '@/lib/dbConnect'; // Using Mongoose connection
// import bcrypt from 'bcryptjs'; // IMPORTANT: Install and use this for password hashing!

// Handle GET requests (e.g., fetching all members)
export async function GET() {
  await dbConnect(); // Connect via Mongoose

  try {
    const members: IMember[] = await Member.find({}); // Fetch with Mongoose, includes timestamps

    // Map members to a safer format, exposing timestamps but masking password
    const safeMembers = members.map(m => ({
      _id: m._id!.toString(), // Non-null assertion for _id
      username: m.username,
      password: '********', // Always mask passwords for the frontend
      createdAt: m.createdAt.toISOString(), // Convert Date to ISO string
      updatedAt: m.updatedAt.toISOString(), // Convert Date to ISO string
    }));

    return NextResponse.json(safeMembers, { status: 200 });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ message: 'Failed to fetch members.' }, { status: 500 });
  }
}

// Handle POST requests (e.g., adding a new member)
export async function POST(req: Request) {
  await dbConnect(); // Connect via Mongoose

  try {
    const { username, password } = await req.json();

    // Server-side duplicate username validation using Mongoose
    const existingMember = await Member.findOne({ username });
    if (existingMember) {
      return NextResponse.json({ error: 'Username already exists.' }, { status: 409 });
    }

    // ⚠️ IMPORTANT: Hash the password before saving to the database!
    // const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new member using Mongoose, timestamps automatically added
    const newMember: IMember = await Member.create({
      username,
      password: password, // REPLACE with hashedPassword in a real app!
    });

    // Return the created member with masked password and timestamps
    return NextResponse.json({
      _id: newMember._id!.toString(),
      username: newMember.username,
      password: '********',
      createdAt: newMember.createdAt.toISOString(),
      updatedAt: newMember.updatedAt.toISOString(),
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error adding member:', error);
    if (error.code === 11000) { // Mongoose/MongoDB duplicate key error code
      return NextResponse.json({ error: 'Username already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: error.message || 'Failed to add member.' }, { status: 500 });
  }
}