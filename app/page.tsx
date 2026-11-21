"use client";

import { useEffect, useMemo, useState } from "react";

type Candidate = { id: string; name: string; studentId: string; manifesto: string };
type Result = Candidate & { votes: number };
type State = {
  election: { title: string; className: string; status: "draft" | "active" | "ended" };
  candidates: Candidate[];
  results: Result[] | null;
  totalVotes: number;
};

const emptyState: State = {
  election: { title: "Class Representative Election", className: "Your Class / Department", status: "draft" },
  candidates: [], results: null, totalVotes: 0
};

export default function Home() {
  const [data, setData] = useState<State>(emptyState);
  const [studentId, setStudentId] = useState("");
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [manifesto, setManifesto] = useState("");
  const [voterText, setVoterText] = useState("");
  const [title, setTitle] = useState("");
  const [className, setClassName] = useState("");

  async function refresh() {
    const response = await fetch("/api/state", { cache: "no-store" });
    const next = await response.json() as State;
    setData(next);
    setTitle(next.election.title);
    setClassName(next.election.className);
  }

  useEffect(() => { void refresh(); }, []);

  const winner = useMemo(() => data.results?.[0], [data.results]);

  async function submitVote() {
    setError(""); setMessage("");
    if (!studentId.trim() || !selected) { setError("Enter your Student ID and select one candidate."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/vote", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, candidateId: selected })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Vote could not be submitted.");
      setMessage(result.message);
      setStudentId(""); setSelected("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setBusy(false); }
  }

  async function adminAction(action: string, extra: Record<string, unknown> = {}) {
    setError(""); setMessage(""); setBusy(true);
    try {
      const response = await fetch("/api/admin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, action, ...extra })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Admin action failed.");
      setMessage(result.message);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setBusy(false); }
  }

  async function addVoters() {
    const voters = voterText.split("\n").map((line) => {
      const [name, id] = line.split(",").map((part) => part.trim());
      return { name: name || "", studentId: id || "" };
    }).filter((v) => v.name && v.studentId);
    await adminAction("addVoters", { voters });
    setVoterText("");
  }

  const statusLabel = data.election.status === "active" ? "Voting Open" : data.election.status === "ended" ? "Election Ended" : "Not Started";
  const statusClass = data.election.status === "active" ? "bg-emerald-100 text-emerald-700" : data.election.status === "ended" ? "bg-slate-200 text-slate-700" : "bg-amber-100 text-amber-800";

  return (
    <main className="min-h-screen">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500 text-xl font-black">C</div>
            <div><p className="text-xl font-extrabold tracking-tight">ClassVote</p><p className="text-xs text-slate-400">CR Election System</p></div>
          </div>
          <button onClick={() => setAdminOpen(!adminOpen)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:bg-slate-800">
            {adminOpen ? "Close Admin" : "Admin Panel"}
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10">
        <div className="mb-8 rounded-3xl bg-gradient-to-br from-indigo-700 to-violet-600 p-7 text-white shadow-lg md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-indigo-200">Online class election</p>
              <h1 className="max-w-2xl text-3xl font-black leading-tight md:text-5xl">{data.election.title}</h1>
              <p className="mt-3 text-indigo-100">{data.election.className}</p>
            </div>
            <span className={`rounded-full px-4 py-2 text-sm font-bold ${statusClass}`}>{statusLabel}</span>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 md:max-w-lg">
            <div className="rounded-2xl bg-white/10 p-4"><p className="text-sm text-indigo-100">Candidates</p><p className="mt-1 text-3xl font-extrabold">{data.candidates.length}</p></div>
            <div className="rounded-2xl bg-white/10 p-4"><p className="text-sm text-indigo-100">Votes submitted</p><p className="mt-1 text-3xl font-extrabold">{data.totalVotes}</p></div>
          </div>
        </div>

        {message && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</div>}
        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        {adminOpen && (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5"><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Control center</p><h2 className="text-2xl font-extrabold">Admin dashboard</h2><p className="mt-1 text-sm text-slate-500">Enter the admin password : </p></div>
            <div className="mb-6 flex flex-col gap-2 sm:flex-row">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin password" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500" />
              <button onClick={() => adminAction("settings", { title, className })} disabled={busy || !password} className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white disabled:opacity-50">Save election details</button>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3 rounded-xl bg-slate-50 p-4">
                <h3 className="font-bold">Election details</h3>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Election title" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
                <input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Class / Department" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
              </div>
              <div className="space-y-3 rounded-xl bg-slate-50 p-4">
                <h3 className="font-bold">Add candidate</h3>
                <input value={candidateName} onChange={(e) => setCandidateName(e.target.value)} placeholder="Candidate full name" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
                <input value={candidateId} onChange={(e) => setCandidateId(e.target.value)} placeholder="Candidate Student ID" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
                <textarea value={manifesto} onChange={(e) => setManifesto(e.target.value)} placeholder="Short manifesto (optional)" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" rows={2} />
                <button onClick={async () => { await adminAction("addCandidate", { name: candidateName, studentId: candidateId, manifesto }); setCandidateName(""); setCandidateId(""); setManifesto(""); }} disabled={busy || !password} className="rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white disabled:opacity-50">Add candidate</button>
              </div>
              <div className="space-y-3 rounded-xl bg-slate-50 p-4 lg:col-span-2">
                <h3 className="font-bold">Register voters</h3>
                <p className="text-sm text-slate-500">One student per line, in this format: <b>Name, StudentID</b></p>
                <textarea value={voterText} onChange={(e) => setVoterText(e.target.value)} placeholder={"ROHAN, B250305054"} rows={5} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm" />
                <button onClick={addVoters} disabled={busy || !password} className="rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white disabled:opacity-50">Register students</button>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
              <button onClick={() => adminAction("start")} disabled={busy || !password || data.election.status !== "draft"} className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white disabled:opacity-40">Start voting</button>
              <button onClick={() => adminAction("end")} disabled={busy || !password || data.election.status !== "active"} className="rounded-xl bg-rose-600 px-5 py-3 font-bold text-white disabled:opacity-40">End election & publish results</button>
              <button onClick={() => { if (confirm("Reset election? This permanently clears all votes.")) void adminAction("reset"); }} disabled={busy || !password || data.election.status === "active"} className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 disabled:opacity-40">Reset votes</button>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">Admin password is checked on the server. Keep it private. Do not expose it in client-side code.</p>
          </section>
        )}

        {data.election.status === "ended" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">Official result</p>
            <h2 className="mt-1 text-3xl font-extrabold">Election Results</h2>
            {winner && <div className="mt-6 rounded-2xl bg-emerald-50 p-6"><p className="text-sm font-bold text-emerald-700">Winner</p><h3 className="mt-1 text-2xl font-extrabold text-emerald-950">{winner.name}</h3><p className="text-emerald-800">Student ID: {winner.studentId} · {winner.votes} vote(s)</p></div>}
            <div className="mt-6 space-y-4">
              {data.results?.map((candidate, index) => {
                const percent = data.totalVotes ? Math.round(candidate.votes / data.totalVotes * 100) : 0;
                return <div key={candidate.id}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="font-bold">{index + 1}. {candidate.name}</span><span className="font-semibold text-slate-600">{candidate.votes} votes ({percent}%)</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${percent}%` }} /></div></div>;
              })}
            </div>
            {data.results && data.results.length > 1 && data.results[0].votes === data.results[1].votes && <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">There is a tie. Follow your class election rules to resolve it.</p>}
          </section>
        ) : (
          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-widest text-indigo-600">Cast your vote</p><h2 className="text-2xl font-extrabold md:text-3xl">Choose your CR</h2></div><p className="text-sm text-slate-500">One student · One vote</p></div>
            {data.election.status !== "active" && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Voting has not started yet. Please wait for the election admin to open voting.</div>}
            {data.candidates.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No candidates have been added yet.</div> :
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.candidates.map((candidate) => <button key={candidate.id} onClick={() => setSelected(candidate.id)} disabled={data.election.status !== "active"} className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 ${selected === candidate.id ? "border-indigo-600 ring-2 ring-indigo-200" : "border-slate-200"}`}>
                  <div className="flex items-start justify-between"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-100 text-lg font-black text-indigo-700">{candidate.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}</div><span className={`grid h-6 w-6 place-items-center rounded-full border-2 ${selected === candidate.id ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"}`}>{selected === candidate.id ? "✓" : ""}</span></div>
                  <h3 className="mt-4 text-lg font-extrabold">{candidate.name}</h3><p className="mt-1 text-sm text-slate-500">Student ID: {candidate.studentId}</p><p className="mt-3 min-h-10 text-sm leading-relaxed text-slate-600">{candidate.manifesto || "Candidate for Class Representative."}</p>
                </button>)}
              </div>}
            <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h3 className="text-lg font-extrabold">Submit your vote</h3>
              <p className="mt-1 text-sm text-slate-500">Enter your registered Student ID. Your ID can only be used once.</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Your Student ID" disabled={data.election.status !== "active"} className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 disabled:bg-slate-100" />
                <button onClick={submitVote} disabled={busy || data.election.status !== "active" || !selected} className="rounded-xl bg-indigo-600 px-7 py-3 font-bold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">{busy ? "Submitting..." : "Confirm Vote"}</button>
              </div>
              <p className="mt-3 text-xs text-slate-400">Please check your selected candidate carefully. A submitted vote cannot be changed.</p>
            </div>
          </section>
        )}
        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">ClassVote · Built for fair and transparent class elections</footer>
      </section>
    </main>
  );
}
