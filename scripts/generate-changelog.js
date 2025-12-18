import { exec } from 'child_process';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Parse --repo argument
function getRepoPath() {
    const args = process.argv.slice(2);
    const repoIndex = args.indexOf('--repo');
    if (repoIndex !== -1 && args[repoIndex + 1]) {
        // Remove surrounding quotes if present
        let path = args[repoIndex + 1];
        if ((path.startsWith('"') && path.endsWith('"')) || (path.startsWith("'") && path.endsWith("'"))) {
            path = path.slice(1, -1);
        }
        return path;
    }
    // Default to current directory
    return process.cwd();
}

const REPO_PATH = getRepoPath();

const execPromise = (command) =>
    new Promise((resolve, reject) => {
        exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
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

async function generateChangelog() {
    try {
        console.log(`Fetching git history from: ${REPO_PATH}`);
        // Use -C flag with quoted path to handle spaces
        const command = `git -C "${REPO_PATH}" --no-pager log --pretty=format:"%H|%aI|%an|%s"`;
        const stdout = await execPromise(command);

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
