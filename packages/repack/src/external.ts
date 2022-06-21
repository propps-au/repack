import { InputOptions, Plugin } from "rollup";

/**
 * Automatically marks all dependencies found in a `node_modules`
 * directory as external.
 */
export function external(): Plugin {
  return {
    name: "external",

    options(options): InputOptions {
      return {
        ...options,
        external: (source, importer, isResolved) => {
          return isResolved && source.includes("node_modules");
        },
      };
    },
  };
}
