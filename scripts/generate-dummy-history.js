const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const history = [
    { message: "feat: initial commit", daysAgo: 10 },
    { message: "feat: add user login", daysAgo: 9 },
    { message: "fix: login page layout", daysAgo: 8 },
    { message: "feat: add dashboard", daysAgo: 7 },
    { message: "perf: optimize image loading", daysAgo: 6 },
    { message: "feat: add dark mode", daysAgo: 5 },
    { message: "fix: darker background in dark mode", daysAgo: 4 },
    { message: "feat: add user profile settings", daysAgo: 3 },
    { message: "fix: typo in profile page", daysAgo: 2 },
    { message: "chore: update documentation", daysAgo: 1 },
    { message: "feat: add changelog page", daysAgo: 0 },
];

function run(command) {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (e) {
        console.error(`Failed to execute: ${command}`);
        process.exit(1);
    }
}

// Create a dummy file to modify
const dummyFile = path.join(__dirname, '..', 'DUMMY.md');

console.log("Generating dummy git history...");

history.reverse().forEach((commit, index) => {
    // Modify file to ensure something to commit
    fs.appendFileSync(dummyFile, `\nChange ${index}: ${commit.message}`);
    
    // Calculate date
    const date = new Date();
    date.setDate(date.getDate() - commit.daysAgo);
    const dateString = date.toISOString();

    // Commit with specific date
    console.log(`Committing: ${commit.message} at ${dateString}`);
    
    // Set GIT_AUTHOR_DATE and GIT_COMMITTER_DATE
    const env = { ...process.env, GIT_AUTHOR_DATE: dateString, GIT_COMMITTER_DATE: dateString };
    
    try {
        execSync('git add .', { stdio: 'inherit' });
        execSync(`git commit -m "${commit.message}"`, { env, stdio: 'inherit' });
    } catch(e) {
        // If nothing to commit (e.g. initial run might differ), just ignore or log
        console.log("Nothing to commit or error.");
    }
});

console.log("Done!");
