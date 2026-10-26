import type { Project, Stats } from '../src/types';
export function toSubdomain(name: string): string;
export function guessType(repo: any, override?: any): Project['type'];
export function mergeProject(repo: any, config: any, extra?: Record<string, any>): Project;
export function filterRepos(repos: any[], config: any): any[];
export function computeStats(projects: Project[]): Stats;
export function summarizeReadme(readme: string | null | undefined): string;
