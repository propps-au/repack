import findWorkspaceDir from "@pnpm/find-workspace-dir";
import findWorkspacePackages, { Project } from "@pnpm/find-workspace-packages";
import pkgDir from "pkg-dir";
import getPackageGraph, { PackageNode } from "pkgs-graph";

export type ResolvedWorkspace = {
  root: string;
  projects: Map<string, Project>;
  graph: Map<string, PackageNode<Project>>;
  project: Project;
};

export async function resolveWorkspace(
  cwd: string
): Promise<ResolvedWorkspace> {
  const root = await findWorkspaceDir(cwd);
  if (!root) {
    throw new Error("Could not locate pnpm workspace root");
  }

  const dir = await pkgDir(cwd);
  if (!dir) {
    throw new Error("Could not locate current package");
  }

  const projects = await findWorkspacePackages(root);

  const { graph, unmatched } = getPackageGraph(Array.from(projects.values()));

  if (unmatched.length) {
    console.error("Unresolved projects:");
    for (const item of unmatched) {
      console.error("  " + item.pkgName + "@" + item.range);
    }
    throw new Error("Unable to resolve workspaces");
  }

  const graphMap = new Map(Object.entries(graph));
  const projectMap = new Map(projects.map((project) => [project.dir, project]));

  const project = projectMap.get(dir);
  if (!project) {
    throw new Error("Could not locate current package");
  }

  return {
    root,
    projects: projectMap,
    graph: graphMap,
    project,
  };
}

export type { Project };
