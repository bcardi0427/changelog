console.log("Safe app loaded v1");

async function loadChangelog() {
    try {
        console.log("Fetching changelog...");
        const response = await fetch('changelog.json');
        const data = await response.json();
        console.log("Changelog data received:", data);
        renderChangelog(data);
    } catch (error) {
        console.error('Error loading changelog:', error);
        document.getElementById('changelog-feed').innerHTML = `<div class="loading">Failed to load changelog data.<br><br>Error: ${error.message}</div>`;
    }
}

function formatDate(dateString) {
    try {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (e) {
        return dateString;
    }
}

function getBadge(category) {
    if (!category) return '';
    const lower = category.toLowerCase();
    return `<span class="badge ${lower}">${category}</span>`;
}

function renderChangelog(groups) {
    const container = document.getElementById('changelog-feed');
    if (!container) {
        console.error("Container not found");
        return;
    }
    container.innerHTML = '';

    if (!Array.isArray(groups)) {
        console.error("Groups is not an array:", groups);
        return;
    }

    groups.forEach((group, index) => {
        console.log(`Processing group ${index}:`, group);

        // Safety checks for group
        if (!group) return;
        if (!group.commits || !Array.isArray(group.commits) || group.commits.length === 0) {
            console.log("Skipping empty group");
            return;
        }

        const date = formatDate(group.date);

        // Find best highlight
        let highlight = group.commits.find(c => c && c.category === 'New');
        if (!highlight) highlight = group.commits[0];

        // Extra safety: ensure highlight is valid object
        if (!highlight) {
            console.log("No valid highlight found");
            return;
        }

        const category = highlight.category || 'Other';
        const message = highlight.message || 'No description';

        const entryHtml = `
            <div class="entry">
                <div class="date-column">
                    <span>${date}</span>
                </div>
                <div class="content-column">
                    ${getBadge(category)}
                    <h2 class="entry-title">${message}</h2>
                    <div class="entry-description">
                        <ul class="commit-list">
                            ${group.commits.map(c => {
            if (!c) return '';
            const cat = c.category || 'Other';
            const msg = c.message || '';
            return `
                                <li class="commit-item">
                                    <strong>${cat}:</strong> ${msg}
                                </li>
                                `;
        }).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', entryHtml);
    });
}

document.addEventListener('DOMContentLoaded', loadChangelog);
