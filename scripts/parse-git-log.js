const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'changelog.json');
const REPO_PATH = path.join(__dirname, '..');

// Ensure src directory exists
if (!fs.existsSync(path.join(__dirname, '..', 'src'))) {
    fs.mkdirSync(path.join(__dirname, '..', 'src'));
}

function getGitLog() {
    // Custom format: %H (hash) %ad (date) %an (author) %s (subject)
    // Separated by a unlikely delimiter like |||
    const format = "%H|||%ad|||%an|||%s";
    const cmd = `git log --date=short --format="${format}"`;

    try {
        const output = execSync(cmd, { cwd: REPO_PATH, encoding: 'utf-8' });
        return output.trim().split('\n');
    } catch (e) {
        console.error("Failed to run git log", e);
        return [];
    }
}

function parseCommits(lines) {
    return lines.map(line => {
        const [hash, date, author, message] = line.split('|||');
        return { hash, date, author, message };
    });
}

function categorizeCommit(message) {
    const lower = message.toLowerCase();
    if (lower.startsWith('feat') || lower.includes('feature')) return 'New';
    if (lower.startsWith('fix')) return 'Fix';
    if (lower.startsWith('perf') || lower.includes('improve')) return 'Improved';
    if (lower.startsWith('chore') || lower.startsWith('docs')) return 'dull'; // Filter out later if needed
    return 'Other';
}

function groupByDate(commits) {
    const groups = {};

    commits.forEach(commit => {
        if (!groups[commit.date]) {
            groups[commit.date] = [];
        }

        const category = categorizeCommit(commit.message);
        // Only include interesting categories for the changelog
        if (category !== 'dull') {
            groups[commit.date].push({
                ...commit,
                category
            });
        }
    });

    // Convert object to array sorted by date (newest first)
    return Object.keys(groups)
        .sort((a, b) => new Date(b) - new Date(a))
        .map(date => ({
            date,
            commits: groups[date]
        }));
}

function main() {
    console.log("Parsing git log...");
    const lines = getGitLog();
    const commits = parseCommits(lines);
    const changelog = groupByDate(commits);

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(changelog, null, 2));
    console.log(`Changelog generated at ${OUTPUT_FILE}`);
}

main();
