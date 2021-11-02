//deno install --allow-run --root . -f deno-helper/src/scripts/build.ts

// create subprocess
const process = Deno.run({
	cmd: [
		"deno",
		"run",
		"--watch",
		"--allow-read",
		"--allow-env",
		"--allow-net",
		"main.ts",
	],
});

await process.status();