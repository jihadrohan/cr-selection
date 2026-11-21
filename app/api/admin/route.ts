import { NextRequest, NextResponse } from "next/server";
import { isAdmin, updateDatabase } from "@/lib/store";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      password?: string; action?: string; name?: string; studentId?: string;
      manifesto?: string; title?: string; className?: string; voters?: { name: string; studentId: string }[];
    };

    if (!isAdmin(body.password ?? null)) {
      return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
    }

    const result = await updateDatabase((db) => {
      switch (body.action) {
        case "settings": {
          if (db.election.status === "active") throw new Error("End the current election before changing its details.");
          db.election.title = body.title?.trim() || "Class Representative Election";
          db.election.className = body.className?.trim() || "Your Class / Department";
          return "Election details saved.";
        }
        case "addCandidate": {
          if (db.election.status !== "draft") throw new Error("Candidates can only be changed before voting starts.");
          const name = body.name?.trim();
          const studentId = body.studentId?.trim().toUpperCase();
          if (!name || !studentId) throw new Error("Candidate name and Student ID are required.");
          if (db.candidates.some((c) => c.studentId.toUpperCase() === studentId)) throw new Error("This candidate Student ID already exists.");
          db.candidates.push({ id: randomUUID(), name, studentId, manifesto: body.manifesto?.trim() || "", createdAt: new Date().toISOString() });
          return "Candidate added.";
        }
        case "addVoters": {
          if (db.election.status !== "draft") throw new Error("Student list can only be changed before voting starts.");
          const entries = (body.voters ?? []).map((v) => ({ name: v.name.trim(), studentId: v.studentId.trim().toUpperCase() })).filter((v) => v.name && v.studentId);
          let added = 0;
          for (const voter of entries) {
            if (!db.voters.some((v) => v.studentId === voter.studentId)) {
              db.voters.push(voter);
              added++;
            }
          }
          return `${added} student(s) registered.`;
        }
        case "start": {
          if (db.election.status !== "draft") throw new Error("Election is not in draft status.");
          if (db.candidates.length < 2) throw new Error("Add at least two candidates before starting.");
          if (db.voters.length < 1) throw new Error("Register students before starting the election.");
          db.election.status = "active";
          db.election.createdAt = new Date().toISOString();
          return "Voting is now open.";
        }
        case "end": {
          if (db.election.status !== "active") throw new Error("There is no active election to end.");
          db.election.status = "ended";
          return "Election ended. Results are now public.";
        }
        case "reset": {
          db.election.status = "draft";
          db.election.createdAt = null;
          db.votes = [];
          return "Election reset. All votes were cleared.";
        }
        default:
          throw new Error("Unknown admin action.");
      }
    });

    return NextResponse.json({ message: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
