import { pack, preset } from "repack";

export default {
  input: ["src/index.js", "src/alternate.js"],
  plugins: [...preset()],
  output: [
    {
      dir: "dist/default",
      format: "cjs",
      sourcemap: true,
      plugins: [pack({ entry: "index.js" })],
    },
    {
      dir: "dist/alternate",
      format: "cjs",
      sourcemap: true,
      plugins: [pack({ entry: "alternate.js" })],
    },
  ],
};
