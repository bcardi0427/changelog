# Git Changelog Generator 🚀

A modern, high-performance changelog generator that transforms your git history into a beautiful, interactive, and portable single-file HTML document.

## 📋 [View This Project's Changelog](https://bcardi0427.github.io/changelog/changelog.html)

![Changelog UI Preview](public/preview.png)

## ✨ Key Features

-   **🤖 AI-Enhanced Descriptions**: Uses Google Gemini to transform developer commit messages into user-friendly descriptions.
-   **Native Git Integration**: Automatically extracts commits directly from any local `.git` repository.
-   **Single-File Portability**: Bundles HTML, CSS, and JavaScript into a **single `.html` file** that works anywhere without a server.
-   **Premium UI Design**: Built with React and Vanilla CSS for a sleek, dark-themed, and responsive experience.
-   **Intelligent Categorization**: Automatically categorizes commits based on prefixes (feat, fix, perf, etc.).
-   **Detailed Timestamps**: Displays relative dates and specific times for every change.
-   **Flexible CLI**: Run it interactively or with command-line arguments for automation.

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher recommended)
-   [Git](https://git-scm.com/) installed and accessible in your system path.
-   (Optional) [Gemini API Key](https://aistudio.google.com/app/apikey) for AI-enhanced descriptions

### Installation

1.  Clone this repository:
    ```bash
    git clone <repository-url>
    cd changelog
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  (Optional) Set up AI enhancement:
    ```bash
    # Copy the example environment file
    cp .env.example .env
    
    # Edit .env and add your Gemini API key
    GEMINI_API_KEY=your_api_key_here
    ```

## 📖 Usage

### Standalone Generator (Recommended)

To generate a changelog for any project on your computer:

```bash
npm run standalone
```

The script will guide you through:
1.  Entering the path to the git repository you want to analyze.
2.  Choosing where to save the final `.html` file.

#### Automated Generation

You can also bypass the prompts by providing arguments directly:

```bash
npm run standalone -- --repo "C:\path\to\your\project" --output "C:\path\to\changelog.html"
```

#### Disable AI Enhancement

If you don't want AI-enhanced descriptions (or don't have an API key):

```bash
npm run standalone -- --no-ai
```

### Local Development

If you want to modify the design or logic:

```bash
# Start development server with hot-reload
npm run dev
```

The dev server will automatically generate data from the *current* repository.

## 🛠️ How It Works

1.  **Data Extraction**: A Node.js script (`scripts/generate-changelog.js`) runs `git log` on the target repository.
2.  **AI Enhancement**: Commit messages are sent to Gemini AI to generate user-friendly descriptions (cached to avoid repeat calls).
3.  **Data Baking**: The extracted history is transformed into a TypeScript data file (`src/generatedChangelog.ts`).
4.  **Standalone Build**: Vite compiles the React application and uses `vite-plugin-singlefile` to inline all assets.
5.  **Deployment**: The script moves the final `index.html` to your desired output path.

## 🎨 Customizing

-   **Styles**: Modify `src/Changelog.css` to update colors, typography, and layout.
-   **Categories**: Update `scripts/generate-changelog.js` to change how commit messages are categorized.
-   **Components**: Edit `src/Changelog.tsx` to change the HTML structure or logic.
-   **AI Prompt**: Modify the prompt in `scripts/generate-changelog.js` to change how AI describes commits.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
