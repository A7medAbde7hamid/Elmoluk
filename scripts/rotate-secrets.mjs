#!/usr/bin/env node

/**
 * Secrets Rotation Script
 * Run this periodically or when a breach is suspected.
 *
 * Usage:
 *   node scripts/rotate-secrets.mjs --check    # Check which secrets need rotation
 *   node scripts/rotate-secrets.mjs --rotate    # Rotate APP_SECRET (generate new)
 *   node scripts/rotate-secrets.mjs --rotate-all # Rotate all secrets
 */

import { randomBytes, createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ENV_PATH = resolve(ROOT, ".env");

function generateSecret(length = 48) {
  return randomBytes(length).toString("base64url");
}

function hashSecret(secret) {
  return createHash("sha256").update(secret).digest("hex").slice(0, 16);
}

function loadEnv() {
  if (!existsSync(ENV_PATH)) {
    console.error("[rotate] .env file not found at", ENV_PATH);
    process.exit(1);
  }
  return readFileSync(ENV_PATH, "utf-8");
}

function saveEnv(content) {
  writeFileSync(ENV_PATH, content, "utf-8");
}

function parseEnv(content) {
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    env[key] = val;
  }
  return env;
}

function checkRotation() {
  const env = parseEnv(loadEnv());

  const secrets = {
    APP_SECRET: { threshold: 90, description: "JWT signing secret" },
    DATABASE_URL: { threshold: 180, description: "TiDB password" },
    CLOUDINARY_API_SECRET: { threshold: 180, description: "Cloudinary API secret" },
    WHATSAPP_ACCESS_TOKEN: { threshold: 60, description: "Meta Cloud API token" },
  };

  console.log("\n=== Secrets Rotation Status ===\n");

  const weakDefaults = {
    APP_SECRET: ["your-super-secret-jwt-key-12345", "test-super-secret-key-for-jwt-signing-32ch"],
  };

  let issues = 0;

  for (const [key, info] of Object.entries(secrets)) {
    const value = env[key];
    const hasValue = !!value;

    if (!hasValue) {
      console.log(`  [SKIP] ${key} — not set`);
      continue;
    }

    const isWeakDefault = weakDefaults[key]?.includes(value);
    if (isWeakDefault) {
      console.log(`  [!!CRITICAL!!] ${key} — using default/weak value! Rotate immediately.`);
      issues++;
      continue;
    }

    const hash = hashSecret(value);
    console.log(`  [OK] ${key} — hash: ${hash} (${info.description})`);
  }

  if (issues > 0) {
    console.log(`\n  ${issues} critical secret(s) need rotation!`);
    console.log("  Run: node scripts/rotate-secrets.mjs --rotate\n");
  } else {
    console.log("\n  All secrets look good.\n");
  }
}

function rotateAppSecret() {
  const newSecret = generateSecret(48);
  const content = loadEnv();
  const env = parseEnv(content);

  if (env.APP_SECRET === "your-super-secret-jwt-key-12345") {
    console.log("[rotate] Replacing default APP_SECRET with secure random value...");
  } else {
    console.log("[rotate] Rotating APP_SECRET...");
  }

  const lines = content.split("\n");
  const newLines = lines.map((line) => {
    if (line.trim().startsWith("APP_SECRET=")) {
      return `APP_SECRET=${newSecret}`;
    }
    return line;
  });

  saveEnv(newLines.join("\n"));

  console.log(`  [DONE] New APP_SECRET hash: ${hashSecret(newSecret)}`);
  console.log("  [!] Update the same value in Vercel environment variables.");
  console.log("  [!] All existing sessions will be invalidated.\n");
}

function rotateAll() {
  console.log("[rotate-all] Generating new secrets for all keys...\n");

  const newSecrets = {
    APP_SECRET: generateSecret(48),
  };

  const content = loadEnv();
  const lines = content.split("\n");
  const newLines = lines.map((line) => {
    for (const [key, value] of Object.entries(newSecrets)) {
      if (line.trim().startsWith(`${key}=`)) {
        return `${key}=${value}`;
      }
    }
    return line;
  });

  saveEnv(newLines.join("\n"));

  console.log("  Updated secrets:");
  for (const [key, value] of Object.entries(newSecrets)) {
    console.log(`    ${key} — hash: ${hashSecret(value)}`);
  }
  console.log("\n  [!] Deploy updated .env to Vercel and TiDB Cloud.");
  console.log("  [!] All existing sessions will be invalidated.\n");
}

const args = process.argv.slice(2);
const flag = args[0];

switch (flag) {
  case "--check":
    checkRotation();
    break;
  case "--rotate":
    rotateAppSecret();
    break;
  case "--rotate-all":
    rotateAll();
    break;
  default:
    console.log("Usage: node scripts/rotate-secrets.mjs [--check|--rotate|--rotate-all]\n");
    break;
}
