const fs = require("fs");
const path = require("path");

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  env[line.slice(0, i).trim()] = line
    .slice(i + 1)
    .trim()
    .replace(/^["']|["']$/g, "");
}

const key = env.ATTOM_API_KEY;
if (!key) {
  console.error("ATTOM_API_KEY missing");
  process.exit(1);
}

const BASE = "https://api.gateway.attomdata.com/propertyapi/v1.0.0";

async function hit(label, endpoint, params) {
  const q = new URLSearchParams(params).toString();
  const url = `${BASE}/${endpoint}?${q}`;
  const r = await fetch(url, {
    headers: { Accept: "application/json", apikey: key },
  });
  const j = await r.json();
  const props = j.property || [];
  console.log("\n===", label, "===");
  console.log("status", r.status, j.status?.msg, "count", props.length);
  if (props[0]) {
    console.log(JSON.stringify(props[0], null, 2).slice(0, 2500));
  }
}

(async () => {
  await hit("expandedprofile denver", "property/expandedprofile", {
    address1: "4529 Winona Court",
    address2: "Denver CO 80212",
  });
  await hit("expandedprofile sequoia", "property/expandedprofile", {
    address1: "468 SEQUOIA DR",
    address2: "SMYRNA, DE 19977",
  });
  await hit("address lookup", "property/address", {
    address1: "4529 Winona Court",
    address2: "Denver CO 80212",
  });
  await hit("snapshot zip", "property/snapshot", {
    postalcode: "80212",
    pagesize: "3",
  });
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
