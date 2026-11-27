#!/usr/bin/env node
/**
 * Updater manifest for the GitHub release (`latest.json`).
 * Run after `npm run tauri:build` with TAURI_SIGNING_PRIVATE_KEY (key path) set, which emits
 * `Linkly.app.tar.gz` + `.sig`. Upload both the tarball and latest.json to the release.
 */
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
