import { exec } from 'child_process';
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const CACHE_FILE = join(__dirname, '../.changelog-cache.json');

// Parse --repo argument
function getRepoPath() {
    const args = process.argv.slice(2);
    const repoIndex = args.indexOf('--repo');
    if (repoIndex !== -1 && args[repoIndex + 1]) {
        let path = args[repoIndex + 1];
        if ((path.startsWith('"') && path.endsWith('"')) || (path.startsWith("'") && path.endsWith("'"))) {
            path = path.slice(1, -1);
        }
        return path;
    }
    return process.cwd();
}

// Check if AI enhancement is enabled
function isAIEnabled() {
    const args = process.argv.slice(2);
    if (args.includes('--no-ai')) return false;
    return !!process.env.GEMINI_API_KEY;
}

const REPO_PATH = getRepoPath();
const AI_ENABLED = isAIEnabled();

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

// Load cache from file
async function loadCache() {
    try {
        if (existsSync(CACHE_FILE)) {
            const data = await readFile(CACHE_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.warn('Could not load cache, starting fresh.');
    }
    return {};
}

// Save cache to file
async function saveCache(cache) {
    await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// Enhance commit messages using Gemini AI
async function enhanceWithAI(commits, cache) {
    if (!AI_ENABLED) {
        console.log('AI enhancement disabled (no API key or --no-ai flag).');
        return commits;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Find commits that need enhancement
    const needsEnhancement = commits.filter(c => !cache[c.hash]);

    if (needsEnhancement.length === 0) {
        console.log('All commits already cached, skipping AI calls.');
        return commits.map(c => ({ ...c, enhancedMessage: cache[c.hash] || c.message }));
    }

    console.log(`Enhancing ${needsEnhancement.length} commit messages with AI...`);

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < needsEnhancement.length; i += batchSize) {
        const batch = needsEnhancement.slice(i, i + batchSize);

        const prompt = `You are a changelog writer for a software product. Transform these developer commit messages into user-friendly descriptions.

Rules:
- Be concise (1 sentence max per message)
- Focus on the user benefit, not the technical change
- Remove technical jargon (feat:, fix:, etc.)
- Use natural, friendly language
- Return ONLY a JSON array of strings in the same order as input

Input messages:
${JSON.stringify(batch.map(c => c.message))}

Output (JSON array of enhanced messages):`;

        try {
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            // Extract JSON from response
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const enhanced = JSON.parse(jsonMatch[0]);
                batch.forEach((commit, idx) => {
                    cache[commit.hash] = enhanced[idx] || commit.message;
                });
            }
        } catch (err) {
            console.warn(`AI enhancement failed for batch, using original messages: ${err.message}`);
            batch.forEach(commit => {
                cache[commit.hash] = commit.message;
            });
        }
    }

    // Save updated cache
    await saveCache(cache);

    // Return commits with enhanced messages
    return commits.map(c => ({ ...c, enhancedMessage: cache[c.hash] || c.message }));
}

async function generateChangelog() {
    try {
        console.log(`Fetching git history from: ${REPO_PATH}`);
        const command = `git -C "${REPO_PATH}" --no-pager log --pretty=format:"%H|%aI|%an|%s"`;
        const stdout = await execPromise(command);

        const lines = stdout.toString().split('\n').filter(line => line.trim() !== '');

        let commits = lines.map(line => {
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

        // Load cache and enhance with AI
        const cache = await loadCache();
        commits = await enhanceWithAI(commits, cache);

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
