const ethers = require("ethers");
const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "../frontend/.env");


if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
} else {
    console.error("Configuration Error: .env file not found at " + envPath);
    process.exit(1);
}

const CONTRACT_ADDRESS = process.env.VITE_CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = "http://127.0.0.1:8545";


const abiPath = path.join(__dirname, "../frontend/src/abi/Voting.json");
const contractABI = JSON.parse(fs.readFileSync(abiPath, "utf8"));

async function seed() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, wallet);

    console.log("System: Starting diversified election data seeding...");

    const now = Math.floor(Date.now() / 1000);
    const day = 86400;

    const testElections = [
        { title: "Municipal Elections 2024", desc: "Currently active.", code: "COM24", candidates: ["Mario Rossi", "Luigi Bianchi"], start: now - day, end: now + day, type: "active" },
        { title: "Future Vote 2026", desc: "Scheduled to start in 2 days.", code: "FUT26", candidates: ["Alice", "Bob"], start: now + (day * 2), end: now + (day * 4), type: "upcoming" },
        { title: "May Referendum", desc: "Planned for next month.", code: "REF-MAY", candidates: ["Yes", "No"], start: now + (day * 30), end: now + (day * 31), type: "upcoming" },
        { title: "Video Game Awards 2023", desc: "Concluded.", code: "GOTY23", candidates: ["Zelda", "Baldur's Gate"], start: now - (day * 10), end: now - (day * 5), type: "ended" },
        { title: "Barista Championship 2023", desc: "Results archived.", code: "COFFEE23", candidates: ["Bar Stella", "Caffè Roma"], start: now - (day * 2), end: now - day, type: "ended" },
        { title: "Cancelled Election A", desc: "Terminated by administrator.", code: "CANC-A", candidates: ["Test 1", "Test 2"], start: now + day, end: now + (day * 2), type: "cancel" },
        { title: "Cancelled Election B", desc: "Removed due to contestation.", code: "CANC-B", candidates: ["Test 3", "Test 4"], start: now + day, end: now + (day * 2), type: "cancel" }
    ];

    let currentNonce = await provider.getTransactionCount(wallet.address);

    for (const data of testElections) {
        try {
            console.log(`\nProcessing: ${data.title} [Type: ${data.type}]`);

            const tx = await contract.createElection(
                data.code, 
                data.title, 
                data.candidates, 
                false, 
                true,
                { nonce: currentNonce++ } 
            );
            const receipt = await tx.wait();

            const log = receipt.logs.map(l => {
                try { return contract.interface.parseLog(l); } catch (e) { return null; }
            }).find(event => event && event.name === "ElectionCreated");

            const lastId = log ? log.args[0] : 0;

            if (data.type === "cancel") {
                console.log(`Status Update: Revoking election ID ${lastId} on-chain...`);
                const txCancel = await contract.deleteElection(lastId, { nonce: currentNonce++ });
                await txCancel.wait();
            }

            console.log(`Syncing ID ${lastId} with centralized backend API...`);
            const backendPayload = {
                id: lastId.toString(),
                title: data.title,
                description: data.desc,
                image: null,
                candidates: data.candidates.map((name, i) => ({
                    id: i,
                    name: name,
                    image: "",
                    party: "Test List",
                    description: "Automated test candidate"
                })),
                startTime: data.start,
                endTime: data.end,
                code: data.code
            };

            const response = await fetch("http://localhost:3000/api/elections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(backendPayload)
            });

            if (response.ok) {
                console.log(`Operation Status: Success`);
            } else {
                console.warn(`Operation Status: API synchronization issue. HTTP Code: ${response.status}`);
            }

        } catch (err) {
            console.error(`Operation Status: Failed for ${data.title}. Error: ${err.message}`);
        }
    }
    console.log("\nProcess Finalized: Seed operation completed successfully.");
}

seed();