// Types for changelog data
export interface Commit {
    hash: string;
    date: string;
    timestamp?: string;
    author: string;
    message: string;
    category: 'New' | 'Fix' | 'Improved' | 'Other';
}

export interface ChangelogGroup {
    date: string;
    commits: Commit[];
}

export type ChangelogData = ChangelogGroup[];
