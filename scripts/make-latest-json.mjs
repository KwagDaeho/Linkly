#!/usr/bin/env node
/**
 * Updater manifest for the GitHub release (`latest.json`).
 * Run after `npm run tauri:build` with TAURI_SIGNING_PRIVATE_KEY (key path) set, which emits
 * `Linkly.app.tar.gz` + `.sig`. Upload both the tarball and latest.json to the release.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const bundleDir = join(root, "src-tauri/target/release/bundle/macos");
const sigPath = join(bundleDir, "Linkly.app.tar.gz.sig");
if (!existsSync(sigPath)) {
  console.error(`Missing ${sigPath}. Build with the updater signing key first.`);
  process.exit(1);
}
// macOS keeps Accessibility / Input Monitoring grants only while the designated
// requirement stays the same: never publish an update signed with another certificate.
const SIGNING_LEAF = 'certificate leaf = H"0f4a79fc5d34329c693a06e0a760df5a743fac1a"';
const requirement = execFileSync(
  "codesign",
  ["-d", "-r-", join(bundleDir, "Linkly.app")],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);
if (!requirement.includes('identifier "com.kwagdaeho.linkly"') || !requirement.includes(SIGNING_LEAF)) {
  console.error(
    "Linkly.app is not signed with the \"Linkly Code Signing\" certificate — users would lose permissions.",
  );
  process.exit(1);
}

const notes = process.argv[2] ?? `Linkly ${version}`;
const manifest = {
  version,
  notes,
  pub_date: new Date().toISOString(),
  platforms: {
    "darwin-aarch64": {
      signature: readFileSync(sigPath, "utf8").trim(),
      url: `https://github.com/KwagDaeho/Linkly/releases/download/v${version}/Linkly.app.tar.gz`,
    },
  },
};
const out = join(bundleDir, "latest.json");
writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Created ${out}`);
