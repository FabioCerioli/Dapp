const fs = require('fs');
const path = require('path');

const ELECTIONS_FILE = path.join(__dirname, '../backend/db/elections.json');
const DB_FILE = path.join(__dirname, '../backend/db/candidates.json');

function cleanElections() {
    try {
        if (fs.existsSync(ELECTIONS_FILE)) {
            fs.writeFileSync(ELECTIONS_FILE, JSON.stringify([], null, 2));
            console.log("Database Update: elections.json successfully truncated.");
        } else {
            console.log("System Warning: elections.json not found at " + ELECTIONS_FILE);
        }

        if (fs.existsSync(DB_FILE)) {
            const dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            dbData.candidates = [];
            dbData.requests = []; 
            fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2));
            console.log("Database Update: candidates.json records successfully reset.");
        }
    } catch (err) {
        console.error("Database Task Error: Resource cleanup failed. Details: ", err.message);
    }
}

cleanElections();