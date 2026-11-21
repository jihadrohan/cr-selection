export type Candidate = {
  id: string;
  name: string;
  studentId: string;
  manifesto: string;
  createdAt: string;
};

export type Voter = {
  studentId: string;
  name: string;
};

export type Vote = {
  voterId: string;
  candidateId: string;
  createdAt: string;
};

export type Database = {
  election: {
    title: string;
    className: string;
    status: "draft" | "active" | "ended";
    createdAt: string | null;
  };
  candidates: Candidate[];
  voters: Voter[];
  votes: Vote[];
};
