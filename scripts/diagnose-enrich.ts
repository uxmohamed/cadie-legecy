
import { createInternalHeaders } from "../src/lib/internal-auth";

async function run() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        console.log(`Target Base URL: ${baseUrl}`);

        const linkId = "dummy-link-id";
        const headers = await createInternalHeaders({ linkId, action: 'enrich-metadata' });
        
        console.log("Headers created:", headers);

        const url = `${baseUrl}/api/links/${linkId}/metadata`;
        console.log(`Fetching: ${url}`);

        const response = await fetch(url, {
            method: 'POST', // enrich-metadata endpoint uses POST? wait, let me check route.ts
            headers: headers as HeadersInit,
        });

        console.log(`Response Status: ${response.status}`);
        console.log(`Response Text: ${await response.text()}`);

    } catch (error) {
        console.error("DIAGNOSTIC ERROR:", error);
    }
}

run();
