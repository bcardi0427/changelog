import { exec } from 'child_process';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const OUTPUT_FILE = join(__dirname, '../public/changelog.json');

const execPromise = (command) =>
    new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                // If no commits yet, it usually errors. resolve with empty if specific error or reject.
                // For now reject to catch in main.
                reject({ error, stderr });
                return;
            }
            resolve(stdout);
        });
    });

function getCategory(message) {
    const lower = message.toLowerCase();
    if (lower.startsWith('feat') || lower.startsWith('new') || lower.includes('add')) return 'New';
    if (lower.startsWith('fix') || lower.startsWith('bug')) return 'Fix';
    if (lower.startsWith('perf') || lower.startsWith('imp') || lower.startsWith('refactor')) return 'Improved';
    return 'Other';
}

// Ensure the generateChangelog function calls the new logic
async function generateChangelog() {
    try {
        console.log('Fetching git history...');
        const stdout = await execPromise('git --no-pager log --pretty=format:"%H|%aI|%an|%s"');

        const lines = stdout.toString().split('\n').filter(line => line.trim() !== '');

        const commits = lines.map(line => {
            const parts = line.split('|');
            const hash = parts[0];
            const isoDate = parts[1];
            const dateOnly = isoDate.split('T')[0];
            const author = parts[2];
            const fullMessage = parts.slice(3).join('|');

            return {
                hash,
                date: dateOnly,
                timestamp: isoDate,
                author,
                message: fullMessage,
                category: getCategory(fullMessage)
            };
        });

        const groups = {};
        commits.forEach(commit => {
            if (!groups[commit.date]) {
                groups[commit.date] = {
                    date: commit.date,
                    commits: []
                };
            }
            groups[commit.date].commits.push(commit);
        });

        const changelog = Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Output as TypeScript
        const tsContent = `import type { ChangelogGroup } from './types';

export const changelogData: ChangelogGroup[] = ${JSON.stringify(changelog, null, 2)};
`;

        await writeFile(join(__dirname, '../src/generatedChangelog.ts'), tsContent);
        console.log(`Changelog generated at src/generatedChangelog.ts with ${commits.length} commits.`);

    } catch (err) {
        console.warn('Could not generate changelog from git (possibly no commits yet).');
        console.warn('Error details:', err);
    }
}

generateChangelog();
