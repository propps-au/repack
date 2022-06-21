import { RollupGraphqlOptions } from "@rollup/plugin-graphql";
import { Plugin } from "rollup";

/**
 * Same as @rollup/plugin-graphql but will only be applied if
 * the `graphql` modules is installed
 */
export function graphql(options?: RollupGraphqlOptions): Plugin {
  try {
    require("graphql");
    const plugin = require("@rollup/plugin-graphql");
    return plugin(options);
  } catch {
    return {
      name: "graphql-disabled",
    };
  }
}
