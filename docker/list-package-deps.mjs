import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "node_modules");
const queue = process.argv.slice(2);

if (queue.length === 0) {
  console.error("usage: list-package-deps.mjs <package> [package...]");
  process.exit(1);
}

const seen = new Set();

function pkgDir(name) {
  const direct = path.join(root, name);
  return fs.existsSync(direct) ? direct : null;
}

while (queue.length > 0) {
  const name = queue.shift();
  if (seen.has(name)) continue;

  const dir = pkgDir(name);
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
