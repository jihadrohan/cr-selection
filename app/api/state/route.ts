import { NextResponse } from "next/server";
import { readDatabase } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = await readDatabase();
  const resultsVisible = db.election.status === "ended";
  const counts = db.candidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
    studentId: candidate.studentId,
    manifesto: candidate.manifesto,
    votes: db.votes.filter((vote) => vote.candidateId === candidate.id).length
  }));
  return NextResponse.json({
    election: db.election,
    candidates: db.candidates,
    results: resultsVisible ? counts.sort((a, b) => b.votes - a.votes) : null,
    totalVotes: db.votes.length
  });
}
