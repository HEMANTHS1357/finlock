const http = require('http');

async function request(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    try {
        console.log("Starting FinLock Backend Demo Script...\n");

        console.log("1. GET /finlock/demo/reset");
        let res = await request('/finlock/demo/reset');
        console.log("  Response:", res.data);
        if (res.data.status !== "reset") throw new Error("Test 1 Failed: Status not reset");

        console.log("\n2. GET /finlock/user/state?user_id=rahul_demo_001");
        res = await request('/finlock/user/state?user_id=rahul_demo_001');
        console.log("  User exists:", !!res.data.user);
        if (!res.data.user || res.data.user.id !== "rahul_demo_001") throw new Error("Test 2 Failed: User not found");

        console.log("\n3. POST /finlock/dna/analyze");
        res = await request('/finlock/dna/analyze', 'POST', { user_id: "rahul_demo_001" });
        console.log("  DNA weekend_spike:", res.data.dna.weekend_spike);
        if (res.data.dna.weekend_spike !== true) throw new Error("Test 3 Failed: DNA weekend_spike is not true");

        console.log("\n4. POST /finlock/vault/lock");
        res = await request('/finlock/vault/lock', 'POST', { user_id: "rahul_demo_001", salary_amount: 52000 });
        console.log("  safe_to_spend:", res.data.safe_to_spend);
        if (!(res.data.safe_to_spend < 20000)) throw new Error("Test 4 Failed: safe_to_spend not less than 20000");

        console.log("\n5. POST /finlock/guard/check");
        // We use a date like "2026-05-03T19:30:00" which was a Sunday, matching weekend_spike logic.
        res = await request('/finlock/guard/check', 'POST', { 
            user_id: "rahul_demo_001", 
            spend_attempt: {amount: 850, category: "food", merchant: "Zomato", timestamp: "2026-05-03T19:30:00"} 
        });
        console.log("  Decision:", res.data.decision);
        console.log("  DNA Trigger:", res.data.dna_trigger);
        if (res.data.decision !== "block" || res.data.dna_trigger !== "weekend_spike") throw new Error("Test 5 Failed: Did not block or trigger weekend_spike");

        console.log("\n6. POST /finlock/twin/message");
        res = await request('/finlock/twin/message', 'POST', { 
            user_id: "rahul_demo_001", 
            persona: "bhai", 
            trigger_event: "guard_blocked", 
            context: {amount: 850, merchant: "Zomato", dna_trigger: "weekend_spike", suggested_action: "Cook food instead."} 
        });
        console.log("  Message:", res.data.message);
        console.log("  Tone:", res.data.tone);
        if (!res.data.message.toLowerCase().includes("bhai") || res.data.tone !== "roasting") throw new Error("Test 6 Failed: Missing 'bhai' or tone not roasting");

        console.log("\n7. POST /finlock/score/update");
        res = await request('/finlock/score/update', 'POST', { user_id: "rahul_demo_001", event_type: "pre_regret_triggered" });
        console.log("  Delta:", res.data.delta);
        console.log("  Band:", res.data.band);
        const acceptableBands = ["Exposed", "Vulnerable", "Critical"];
        if (res.data.delta !== -15 || !acceptableBands.includes(res.data.band)) throw new Error("Test 7 Failed: Delta not -15 or Band not lowered appropriately");

        console.log("\n✅ All 7 tests passed! Backend is fully ready.");
    } catch (e) {
        console.error("\n❌ Test Failed:");
        console.error(e.message);
    }
}

runTests();
