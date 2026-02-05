export function parseArgs(args: string[]): {
	command: string;
	flags: Record<string, string>;
	positional: string[];
} {
	const flags: Record<string, string> = {};
	const positional: string[] = [];
	let command = "";

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg.startsWith("--")) {
			const key = arg.slice(2);
			const value = args[i + 1];
			if (value && !value.startsWith("-")) {
				flags[key] = value;
				i++;
			} else {
				flags[key] = "true";
			}
		} else if (arg.startsWith("-")) {
			const key = arg.slice(1);
			flags[key] = "true";
		} else if (!command) {
			command = arg;
		} else {
			positional.push(arg);
		}
	}

	return { command, flags, positional };
}
