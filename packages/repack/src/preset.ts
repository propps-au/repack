import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import { Plugin } from "rollup";
import esbuild from "rollup-plugin-esbuild";
import { external, ExternalPluginOptions } from "./external";
import { graphql } from "./graphql";

/**
 * Repack rollup preset
 *
 * Includes:
 * - external plugin (automatically externalises any node_modules dependencies)
 * - @rollup/plugin-commonjs
 * - @rollup/plugin-node-resolve
 * - @rollup/plugin-json
 * - rollup-plugin-esbuild
 * - rollup-plugin-graphql (if graphql is installed)
 */
export function preset(options?: PresetOptions): Plugin[] {
  return [
    external(options?.external),
    commonjs(),
    resolve({
      extensions: [".js", ".jsx", ".ts", ".tsx", ".json", ".graphql"],
    }),
    json(),
    graphql(),
    esbuild({
      include: /\.[jt]sx?$/,
      exclude: /node_modules/,
      target: "node16",
    }),
  ];
}

type PresetOptions = {
  external?: ExternalPluginOptions;
};
