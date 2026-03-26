const fs = require('fs');
const path = require('path');

const IMG_DIR = path.join(__dirname, '../backend/img');

function cleanImages() {
    try {
        if (!fs.existsSync(IMG_DIR)) {
            console.log("System Alert: Target directory not found at " + IMG_DIR);
            return;
        }

        const files = fs.readdirSync(IMG_DIR);
        let count = 0;

        files.forEach(file => {
            if (file !== ".gitkeep" && file !== ".gitignore") {
                fs.unlinkSync(path.join(IMG_DIR, file));
                count++;
            }
        });

        console.log(`Cleanup Task: Maintenance completed. ${count} files removed from backend/img.`);
    } catch (err) {
        console.error("Cleanup Task Error: Execution failed. Details: ", err.message);
    }
}

cleanImages();