import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const root = path.join(process.cwd(), "node_modules");
const queue = process.argv.slice(2);

if (queue.length === 0) {
  console.error("usage: list-package-deps.mjs <package> [package...]");
  process.exit(1);
}

const seen = new Set();

function resolveDir(name) {
  const result = spawnSync("node", ["docker/resolve-package-dir.mjs", name], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (result.status === 0) {
    const dir = result.stdout.trim();
    if (dir && fs.existsSync(dir)) return dir;
  }
  const direct = path.join(root, name);
  return fs.existsSync(direct) ? direct : null;
}

while (queue.length > 0) {
  const name = queue.shift();
  if (seen.has(name)) continue;

  const dir = resolveDir(name);
  if (!dir) continue;

  seen.add(name);
  const pkgPath = path.join(dir, "package.json");
  if (!fs.existsSync(pkgPath)) continue;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const deps = pkg.dependencies && typeof pkg.dependencies === "object" ? pkg.dependencies : {};
  for (const dep of Object.keys(deps)) {
    queue.push(dep);
  }
}

process.stdout.write([...seen].sort().join("\n"));
