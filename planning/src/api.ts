import { GitHubPlanningApi } from './github-api';
import { MockPlanningApi } from './mock-api';
import type { AppConfig, PlanningApi } from './types';

export function createPlanningApi(config: AppConfig): PlanningApi {
  if (config.demoMode || !config.token || !config.owner || !config.repo) {
    return new MockPlanningApi();
  }
  return new GitHubPlanningApi(
    config.owner,
    config.repo,
    config.token,
    config.assetsOwner,
    config.assetsRepo,
  );
}
