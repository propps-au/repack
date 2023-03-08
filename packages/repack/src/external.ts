import { InputOptions, Plugin } from "rollup";

/**
 * Automatically marks all dependencies found in a `node_modules`
 * directory as external.
 */
export function external(options?: ExternalPluginOptions): Plugin {
  const ignore = options?.ignore ?? [];
  const ignoreExps = ignore.map((i) => new RegExp("node_modules/(.+?/)?" + i));

  return {
    name: "external",

    options(options): InputOptions {
      return {
        ...options,
        external: (source, importer, isResolved) => {
          if (!isResolved) return false;

          if (ignoreExps.some((i) => source.match(i))) return false;

          return source.includes("node_modules");
        },
      };
    },
  };
}

export type ExternalPluginOptions = {
  ignore?: string[];
};
