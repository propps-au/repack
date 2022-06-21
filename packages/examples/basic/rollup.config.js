import { preset, pack } from "repack";

export default {
  input: "src/index.js",
  plugins: [...preset()],
  output: [
    {
      dir: "dist",
      format: "cjs",
      sourcemap: true,
      plugins: [pack("index.js")],
    },
  ],
};
