import { promises as fs } from "node:fs";
import path from "node:path";
import type { Database } from "@/lib/types";

const dataPath = path.join(process.cwd(), "data", "db.json");
let writeQueue: Promise<unknown> = Promise.resolve();

const initialData: Database = {
  election: {
    title: "Class Representative Election",
    className: "Your Class / Department",
    status: "draft",
    createdAt: null
  },
  candidates: [],
  voters: [],
  votes: []
};

async function ensureFile() {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  try {
    await fs.access(dataPath);
  } catch {
    await fs.writeFile(dataPath, JSON.stringify(initialData, null, 2), "utf8");
  }
}

export async function readDatabase(): Promise<Database> {
  await ensureFile();
  const raw = await fs.readFile(dataPath, "utf8");
  return JSON.parse(raw) as Database;
}

export async function updateDatabase<T>(
  updater: (db: Database) => T | Promise<T>
): Promise<T> {
  const operation = writeQueue.then(async () => {
    const db = await readDatabase();
    const result = await updater(db);
    const tempPath = `${dataPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(db, null, 2), "utf8");
    await fs.rename(tempPath, dataPath);
    return result;
  });
  writeQueue = operation.catch(() => undefined);
  return operation;
}

export function isAdmin(password: string | null): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected && password && password === expected);
}
