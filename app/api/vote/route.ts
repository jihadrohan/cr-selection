import { NextRequest, NextResponse } from "next/server";
import { updateDatabase } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { studentId?: string; candidateId?: string };
    const studentId = body.studentId?.trim().toUpperCase();
    const candidateId = body.candidateId;

    if (!studentId || !candidateId) {
      return NextResponse.json({ error: "Student ID and candidate are required." }, { status: 400 });
    }

    const result = await updateDatabase((db) => {
      if (db.election.status !== "active") {
        return { ok: false, error: "Voting is not currently open.", status: 403 };
      }
      const voter = db.voters.find((item) => item.studentId.toUpperCase() === studentId);
      if (!voter) {
        return { ok: false, error: "This Student ID is not registered for this election.", status: 403 };
      }
      if (db.votes.some((vote) => vote.voterId.toUpperCase() === studentId)) {
        return { ok: false, error: "A vote has already been submitted using this Student ID.", status: 409 };
      }
      if (!db.candidates.some((candidate) => candidate.id === candidateId)) {
        return { ok: false, error: "Please select a valid candidate.", status: 400 };
      }
      db.votes.push({ voterId: studentId, candidateId, createdAt: new Date().toISOString() });
      return { ok: true };
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ message: "Your vote has been recorded successfully." });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
