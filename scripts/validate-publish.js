/* Grammar Sensei publish readiness validator */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const errors = [];
const warnings = [];

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function assertFile(file) {
  if (!exists(file)) fail(`Missing required file: ${file}`);
}

function pngSize(file) {
  const buffer = fs.readFileSync(path.join(root, file));
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") {
    fail(`${file} is not a valid PNG.`);
    return null;
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      if ([".git", "dist", "node_modules"].includes(entry.name)) continue;
      walk(rel, results);
    } else {
      results.push(rel);
    }
  }
  return results;
}

function scanSource() {
  const files = walk(".").filter((file) => /\.(js|html|css|json|md)$/i.test(file));
  const secretPatterns = [
    /sk-[A-Za-z0-9_-]{20,}/,
    /AIza[0-9A-Za-z_-]{20,}/,
    /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/,
    /xox[baprs]-[A-Za-z0-9-]{20,}/
  ];
  const remoteScriptPattern = /<script[^>]+src=["']https?:\/\//i;
  const dynamicCodePattern = /\b(eval|new Function)\s*\(/;

  for (const file of files) {
    const text = fs.readFileSync(path.join(root, file), "utf8");
    if (secretPatterns.some((pattern) => pattern.test(text))) {
      fail(`Possible secret found in ${file}`);
    }
    if (remoteScriptPattern.test(text)) {
      fail(`Remote script tag found in ${file}`);
    }
    if (dynamicCodePattern.test(text)) {
      fail(`Dynamic code execution found in ${file}`);
    }
  }
}

const manifest = readJson("manifest.json");

if (manifest.manifest_version !== 3) fail("manifest_version must be 3.");
if (!manifest.name || manifest.name.length > 45) fail("Manifest name missing or longer than 45 characters.");
if (!manifest.description || manifest.description.length > 132) fail("Manifest description missing or longer than 132 characters.");
if (!manifest.version) fail("Manifest version is missing.");
if (Number(manifest.minimum_chrome_version || 0) < 116) warn("minimum_chrome_version should be 116+ because chrome.sidePanel.open is used.");

for (const permission of ["activeTab", "contextMenus", "sidePanel", "storage"]) {
  if (!manifest.permissions?.includes(permission)) fail(`Missing required permission: ${permission}`);
}

const unexpectedPermissions = (manifest.permissions || []).filter((permission) => !["activeTab", "contextMenus", "sidePanel", "storage"].includes(permission));
if (unexpectedPermissions.length) fail(`Unexpected permissions: ${unexpectedPermissions.join(", ")}`);

if (manifest.host_permissions?.includes("<all_urls>")) {
  warn("Broad <all_urls> host permission is present; ensure store listing justifies content script features.");
}

assertFile(manifest.background?.service_worker || "");
assertFile(manifest.action?.default_popup || "");
assertFile(manifest.options_ui?.page || "");
assertFile(manifest.side_panel?.default_path || "");

for (const script of manifest.content_scripts?.[0]?.js || []) assertFile(script);
for (const css of manifest.content_scripts?.[0]?.css || []) assertFile(css);

const iconChecks = [
  ["icons/icon16.png", 16],
  ["icons/icon48.png", 48],
  ["icons/icon128.png", 128]
];

for (const [file, expected] of iconChecks) {
  assertFile(file);
  if (exists(file)) {
    const size = pngSize(file);
    if (size && (size.width !== expected || size.height !== expected)) {
      fail(`${file} should be ${expected}x${expected}, got ${size.width}x${size.height}.`);
    }
  }
}

[
  "onboarding.html",
  "onboarding.css",
  "onboarding.js",
  "docs/privacy-policy.md",
  "docs/store-listing.md",
  "docs/publish-checklist.md",
  "docs/cloud-ai-contract.md"
].forEach(assertFile);

scanSource();

if (warnings.length) {
  console.log("Warnings:");
  for (const item of warnings) console.log(`- ${item}`);
}

if (errors.length) {
  console.error("Publish validation failed:");
  for (const item of errors) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Publish validation passed.");

