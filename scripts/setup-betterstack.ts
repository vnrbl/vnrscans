import * as fs from 'fs';
import * as path from 'path';

const token = "gw8izWLXT6HKG8t1fhaZZs6F";
const statusPageId = "250980";
const projectId = "edvqhmvqbtujzcfqkrbe";

// Load environment variables from .env if available
let anonKey = "sb_publishable_jVdWorDtLlkVYzRh6EbEOA_lwnu59an";
try {
  const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
  const match = envContent.match(/SUPABASE_PUBLISHABLE_KEY=["']?([^"'\s]+)["']?/);
  if (match && match[1]) {
    anonKey = match[1];
    console.log("Loaded Supabase anon key from .env file.");
  }
} catch (err) {
  console.log("Could not read .env file, using default anon key.");
}

async function makeRequest(url: string, method: string, body?: any) {
  const res = await fetch(url, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 204) {
    return null;
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to request ${url}: ${res.status} ${text}`);
  }
  return res.json();
}

async function main() {
  console.log("Starting Better Stack automation...");

  // 1. Update logo (using high-res PNG logo)
  try {
    console.log("Updating logo URLs to PNG...");
    await makeRequest(`https://uptime.betterstack.com/api/v2/status-pages/${statusPageId}`, "PATCH", {
      logo_remote_url: "https://www.vnrscans.com/web-app-manifest-512x512.png",
      dark_logo_remote_url: "https://www.vnrscans.com/web-app-manifest-512x512.png"
    });
    console.log("✅ Logo updated successfully.");
  } catch (e: any) {
    console.error("❌ Failed to update logo:", e.message);
  }

  // Define monitors configuration
  const monitorsConfig = [
    {
      name: "Supabase Backend",
      url: `https://${projectId}.supabase.co/auth/v1/health`,
      headers: [
        { name: "apikey", value: anonKey }
      ]
    },
    {
      name: "Image Storage",
      url: `https://${projectId}.supabase.co/storage/v1/health`,
      headers: [
        { name: "apikey", value: anonKey },
        { name: "Authorization", value: `Bearer ${anonKey}` }
      ]
    }
  ];

  // Fetch existing monitors to prevent duplication
  console.log("Fetching existing monitors...");
  const existingMonitorsRes = await makeRequest("https://uptime.betterstack.com/api/v2/monitors", "GET");
  const existingMonitors = existingMonitorsRes.data || [];

  // Fetch existing status page resources
  console.log("Fetching existing status page resources...");
  const existingResourcesRes = await makeRequest(`https://uptime.betterstack.com/api/v2/status-pages/${statusPageId}/resources`, "GET");
  const existingResources = existingResourcesRes.data || [];

  for (const config of monitorsConfig) {
    try {
      // Find monitors with the matching name
      const matchingMonitors = existingMonitors.filter((m: any) => m.attributes.pronounceable_name === config.name);
      
      let monitorId: string;
      if (matchingMonitors.length > 0) {
        // Update the first one
        monitorId = matchingMonitors[0].id;
        console.log(`Updating existing monitor: ${config.name} (ID: ${monitorId})...`);
        await makeRequest(`https://uptime.betterstack.com/api/v2/monitors/${monitorId}`, "PATCH", {
          url: config.url,
          request_headers: config.headers,
          recovery_period: 0
        });
        console.log(`✅ Monitor ${config.name} updated successfully.`);

        // Clean up any remaining duplicate monitors
        if (matchingMonitors.length > 1) {
          console.log(`Cleaning up ${matchingMonitors.length - 1} duplicate monitors for ${config.name}...`);
          for (let i = 1; i < matchingMonitors.length; i++) {
            const dupId = matchingMonitors[i].id;
            try {
              await makeRequest(`https://uptime.betterstack.com/api/v2/monitors/${dupId}`, "DELETE");
              console.log(`🗑️ Deleted duplicate monitor ID: ${dupId}`);
            } catch (err: any) {
              console.error(`Failed to delete duplicate monitor ${dupId}:`, err.message);
            }
          }
        }
      } else {
        // Create new monitor
        console.log(`Creating monitor: ${config.name}...`);
        const monitorRes = await makeRequest("https://uptime.betterstack.com/api/v2/monitors", "POST", {
          url: config.url,
          monitor_type: "status",
          pronounceable_name: config.name,
          request_headers: config.headers,
          recovery_period: 0
        });
        monitorId = monitorRes.data.id;
        console.log(`✅ Monitor created with ID: ${monitorId}`);
      }

      // Check if this monitor is already linked on the status page
      const isLinked = existingResources.some((r: any) => 
        r.attributes.resource_id.toString() === monitorId.toString() && 
        r.attributes.resource_type === "Monitor"
      );

      if (isLinked) {
        console.log(`ℹ️ Monitor ${config.name} is already linked to the status page.`);
      } else {
        console.log(`Linking monitor ${config.name} to status page...`);
        const resourceRes = await makeRequest(`https://uptime.betterstack.com/api/v2/status-pages/${statusPageId}/resources`, "POST", {
          resource_id: parseInt(monitorId),
          resource_type: "Monitor",
          public_name: config.name,
          widget_type: "history"
        });
        console.log(`✅ Linked successfully (Resource ID: ${resourceRes.data.id}).`);
      }
    } catch (e: any) {
      console.error(`❌ Error with ${config.name}:`, e.message);
    }
  }

  console.log("All done!");
}

main();
