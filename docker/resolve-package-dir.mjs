import { createRequire } from "module";
import fs from "fs";
import path from "path";

const name = process.argv[2];
if (!name) {
  console.error("usage: resolve-package-dir.mjs <package-name>");
  process.exit(1);
}

const appRoot = process.cwd();
const require = createRequire(path.join(appRoot, "package.json"));

function findPackageRoot(startDir, packageName) {
  let dir = startDir;
  while (dir && dir !== path.dirname(dir)) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        if (pkg.name === packageName) return dir;
      } catch {
        // ignore
      }
    }
    dir = path.dirname(dir);
  }
  return null;
}

const direct = path.join(appRoot, "node_modules", name);
if (fs.existsSync(direct)) {
  process.stdout.write(direct);
  process.exit(0);
}

try {
  const entry = require.resolve(name);
  const root = findPackageRoot(path.dirname(entry), name);
  if (root) {
    process.stdout.write(root);
    process.exit(0);
  }
} catch {
  // fall through
}

process.exit(1);
