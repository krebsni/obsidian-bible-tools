import esbuild from "esbuild";

const isWatch = process.argv.includes("--watch");

const options = {
  entryPoints: ["src/main.ts"],
  outfile: "main.js",
  bundle: true,
  minify: false,
  sourcemap: isWatch ? "inline" : false,
  format: "cjs",
  target: "es2020",
  platform: "browser",
  external: ["obsidian"],
  logLevel: "info"
};

if (isWatch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("esbuild: watching for changes…");
} else {
  await esbuild.build(options);
  console.log("esbuild: build complete");
}