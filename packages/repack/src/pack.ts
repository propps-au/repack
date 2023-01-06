import fs from "fs-extra";
import path from "path";
import { clone } from "ramda";
import { OutputChunk, Plugin } from "rollup";
import { Project, ResolvedWorkspace, resolveWorkspace } from "./pnpm-workspace";

/**
 * Plugin for repackaging an output bundle.
 *
 * Outputs the rollup bundled files, plus a package.json that has
 * monorepo dependencies inlined and a copy of the monorepo's root
 * .npmrc.
 */
export function pack(options: { entry: string; monorepo?: boolean }): Plugin {
  const monorepo = options.monorepo ?? true;
  const entry = options.entry?.replace(/\.tsx?$/, ".js");

  if (monorepo) {
    return createMonorepoPackDepsPlugin(entry);
  } else {
    return createPackPlugin(entry);
  }
}

function createPackPlugin(entry?: string): Plugin {
  return {
    name: "pack",

    async generateBundle(options, bundle, isWrite) {
      let npmrc: string | null = null;
      try {
        npmrc = (
          await fs.readFile(path.join(process.cwd(), ".npmrc"))
        ).toString();
      } catch (err) {}

      const entries = Object.values(bundle).filter(
        (output): output is OutputChunk =>
          output.type === "chunk" && output.isEntry
      );

      if (!entries.find((item) => item.fileName === entry)) {
        throw new Error(`Entry file ${entry} not found in bundle`);
      }

      const manifest = JSON.parse(
        (
          await fs.readFile(path.resolve(process.cwd(), "package.json"))
        ).toString()
      );

      const newManifest: Project["manifest"] = {
        main: entry,
        scripts: entry ? { start: "node ." } : undefined,
        engines: clone(manifest.engines!),
        dependencies: clone(manifest.dependencies),
      };

      this.emitFile({
        type: "asset",
        fileName: "package.json",
        source: JSON.stringify(newManifest, null, 2),
      });
      if (npmrc) {
        this.emitFile({
          type: "asset",
          fileName: ".npmrc",
          source: npmrc,
        });
      }
    },
  };
}

function createMonorepoPackDepsPlugin(entry?: string): Plugin {
  return {
    name: "monorepo-pack-deps",

    async generateBundle(options, bundle, isWrite) {
      const workspace = await resolveWorkspace(process.cwd());

      let npmrc: string | null = null;
      try {
        npmrc = (
          await fs.readFile(path.join(workspace.root, ".npmrc"))
        ).toString();
      } catch (err) {}

      const entries = Object.values(bundle).filter(
        (output): output is OutputChunk =>
          output.type === "chunk" && output.isEntry
      );

      if (!entries.find((item) => item.fileName === entry)) {
        throw new Error(`Entry file ${entry} not found in bundle`);
      }

      const newManifest: Project["manifest"] = {
        main: entry,
        scripts: entry ? { start: "node ." } : undefined,
        engines: clone(workspace.project.manifest.engines!),
        dependencies: clone(workspace.project.manifest.dependencies),
      };

      packMonorepoDeps(workspace, [workspace.project], newManifest);

      this.emitFile({
        type: "asset",
        fileName: "package.json",
        source: JSON.stringify(newManifest, null, 2),
      });
      this.emitFile({
        type: "asset",
        fileName: "pnpm-workspace.yaml",
        source: "",
      });
      if (npmrc) {
        this.emitFile({
          type: "asset",
          fileName: ".npmrc",
          source: npmrc,
        });
      }
    },
  };
}

export function packMonorepoDeps(
  workspace: ResolvedWorkspace,
  path: Project[],
  manifest: Project["manifest"]
) {
  const current = path[path.length - 1]!;

  const localDependencies = workspace.graph
    .get(current.dir)!
    .dependencies.map((dir) => workspace.projects.get(dir)!);

  for (const [pkg, specifier] of Object.entries(
    current.manifest.dependencies ?? {}
  )) {
    const depProject = localDependencies.find(
      (dep) => dep.manifest.name === pkg
    );

    if (depProject) {
      // The package is local to the monorepo
      // Remove the package as it cannot be installed remotely and will
      // be bundled into the source
      if (path.length === 1) {
        delete manifest.dependencies![pkg];
      }

      // Ensure any remote dependencies of the package are added
      packMonorepoDeps(workspace, [...path, depProject], manifest);
    } else if (!manifest.dependencies![pkg]) {
      // This package is remote
      // Ensure it is added to the manifest so it is installed for runtime
      manifest.dependencies![pkg] = specifier;
    }
  }
}
