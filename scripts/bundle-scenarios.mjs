// Собирает public/scenarios/*.json в src/generated/scenarios.ts — сценарии не зависят от сети
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
const dir = "public/scenarios";
const out = {};
for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  out[f.replace(/\.json$/, "")] = JSON.parse(readFileSync(join(dir, f), "utf8"));
}
mkdirSync("src/generated", { recursive: true });
writeFileSync(
  "src/generated/scenarios.ts",
  `// Сгенерировано scripts/bundle-scenarios.mjs — не редактировать вручную\nimport type { Scenario } from "@/lib/scenario";\nexport const SCENARIOS: Record<string, Scenario> = ${JSON.stringify(out, null, 2)};\n`
);
console.log(`сценарии вшиты: ${Object.keys(out).join(", ")}`);
