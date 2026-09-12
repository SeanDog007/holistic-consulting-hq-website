import { spawnSync } from "node:child_process";
import path from "node:path";

const url = process.env.DATABASE_URL ?? "";
const schema = url.startsWith("postgres") ? "prisma/schema.postgres.prisma" : "prisma/schema.prisma";
const prismaBin = path.join(process.cwd(), "node_modules", ".bin", "prisma");
const args = process.argv.slice(2);

const result = spawnSync(prismaBin, [...args, `--schema=${schema}`], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
