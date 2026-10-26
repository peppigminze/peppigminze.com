export type ProjectType = 'game' | 'app' | 'tool';
export type Status = 'live' | 'building' | 'archived';
export type Lang = 'de' | 'en';

export interface Project {
  name: string;
  title: string;
  description: { de: string; en: string };
  type: ProjectType;
  url: string | null;
  repoUrl: string;
  language: string | null;
  languages: Record<string, number>;
  topics: string[];
  stars: number;
  forks: number;
  updatedAt: string | null;
  createdAt: string | null;
  archived: boolean;
  status: Status;
  featured: boolean;
  order: number;
  preview: string | null;
  readme: string | null;
  commits: number | null;
}

export interface Stats {
  repos: number;
  commits: number;
  stars: number;
  languages: number;
}

export interface RepoData {
  generatedAt: string;
  source: 'build' | 'seed' | 'api';
  user: string;
  stats: Stats;
  projects: Project[];
}
