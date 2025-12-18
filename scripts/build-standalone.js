import { spawn } from 'child_process';
import { copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    let repo = null;
    let output = null;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--repo' && args[i + 1]) {
            repo = args[i + 1];
            i++;
        } else if (args[i] === '--output' && args[i + 1]) {
            output = args[i + 1];
            i++;
        }
    }

    return { repo, output };
}

// Prompt user for input
async function prompt(question) {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

// Run a command and return a promise
function runCommand(command, args, cwd) {
    return new Promise((resolve, reject) => {
        console.log(`\n> ${command} ${args.join(' ')}`);
        const child = spawn(command, args, {
            cwd,
            stdio: 'inherit',
            shell: process.platform === 'win32' ? 'cmd.exe' : true
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });

        child.on('error', reject);
    });
}

async function main() {
    console.log('='.repeat(50));
    console.log('  Standalone Changelog Generator');
    console.log('='.repeat(50));

    let { repo, output } = parseArgs();

    // Prompt for repo path if not provided
    if (!repo) {
        repo = await prompt('\nEnter the path to the git repository:\n> ');
    }

    // Validate repo path
    const gitPath = join(repo, '.git');
    if (!existsSync(gitPath)) {
        console.error(`\nError: No .git folder found at "${repo}"`);
        console.error('Please provide a valid git repository path.');
        process.exit(1);
    }

    // Prompt for output path if not provided
    if (!output) {
        output = await prompt('\nEnter the output path for the HTML file (e.g., C:\\output\\changelog.html):\n> ');
    }

    // Ensure output ends with .html
    if (!output.toLowerCase().endsWith('.html')) {
        output = output + '.html';
    }

    console.log('\n--- Configuration ---');
    console.log(`Repository: ${repo}`);
    console.log(`Output:     ${output}`);
    console.log('---------------------\n');

    try {
        // Step 1: Generate changelog from the specified repo
        console.log('Step 1/3: Generating changelog data...');
        // Use quotes around the repo path to handle spaces
        await runCommand('node', ['scripts/generate-changelog.js', '--repo', `"${repo}"`], PROJECT_ROOT);

        // Step 2: Build the project (without re-running gen-changelog since we just did it)
        console.log('\nStep 2/3: Building standalone HTML...');
        await runCommand('npx', ['tsc', '-b'], PROJECT_ROOT);
        await runCommand('npx', ['vite', 'build'], PROJECT_ROOT);

        // Step 3: Copy the output file (use copy instead of rename for cross-drive support)
        console.log('\nStep 3/3: Copying output file...');
        const builtFile = join(PROJECT_ROOT, 'dist', 'index.html');

        // Ensure output directory exists
        const outputDir = dirname(output);
        if (outputDir && !existsSync(outputDir)) {
            await mkdir(outputDir, { recursive: true });
        }

        // Use copyFile for cross-drive compatibility
        await copyFile(builtFile, output);

        console.log('\n' + '='.repeat(50));
        console.log('  SUCCESS!');
        console.log('='.repeat(50));
        console.log(`\nChangelog generated at:\n  ${output}`);
        console.log('\nYou can open this file in any browser.');

    } catch (err) {
        console.error('\nBuild failed:', err.message);
        process.exit(1);
    }
}

main();
