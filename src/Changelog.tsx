import React from 'react';
import type { Commit, ChangelogGroup } from './types';
import './Changelog.css';
import { changelogData } from './generatedChangelog';

interface BadgeProps {
    category: Commit['category'];
}

const Badge: React.FC<BadgeProps> = ({ category }) => {
    const lower = category.toLowerCase();
    return <span className={`badge ${lower}`}>{category}</span>;
};

interface ChangelogEntryProps {
    date: string;
    commits: Commit[];
}

const ChangelogEntry: React.FC<ChangelogEntryProps> = ({ date, commits }) => {
    // Skip if no commits
    if (!commits || commits.length === 0) return null;

    // Find the best highlight (prefer "New" category)
    const highlight = commits.find(c => c?.category === 'New') || commits[0];

    if (!highlight) return null;

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="entry">
            <div className="date-column">
                <span>{formattedDate}</span>
            </div>
            <div className="content-column">
                <Badge category={highlight.category || 'Other'} />
                <h2 className="entry-title">{highlight.message}</h2>
                <div className="entry-description">
                    <ul className="commit-list">
                        {commits.map((commit, index) => {
                            if (!commit) return null;
                            return (
                                <li key={index} className="commit-item">
                                    <strong>{commit.category || 'Other'}:</strong> {commit.message || ''}
                                    {commit.timestamp && (
                                        <span className="commit-time">
                                            {new Date(commit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    );
};

interface ChangelogProps {
    data?: ChangelogGroup[];
}



const Changelog: React.FC<ChangelogProps> = ({ data }) => {
    // If data is passed as prop, use it directly, otherwise use generated data
    const finalData = data || changelogData;

    // Filter out groups with empty commits
    const validGroups = finalData.filter(
        group => group?.commits && Array.isArray(group.commits) && group.commits.length > 0
    );

    return (
        <div className="feed">
            {validGroups.map((group) => (
                <ChangelogEntry
                    key={group.date}
                    date={group.date}
                    commits={group.commits}
                />
            ))}
        </div>
    );
};





export default Changelog;
