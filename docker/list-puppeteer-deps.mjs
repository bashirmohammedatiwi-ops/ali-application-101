import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "node_modules");
const seen = new Set();
const queue = ["puppeteer-core"];

function pkgDir(name) {
  if (name.startsWith("@")) {
    const p = path.join(root, name);
    return fs.existsSync(p) ? p : null;
  }
  const direct = path.join(root, name);
  if (fs.existsSync(direct)) return direct;
  return null;
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
