const COLORS = {
	reset: "\x1b[0m",

	dim: "\x1b[2m",
	bright: "\x1b[1m",
	italic: "\x1b[3m",
	underline: "\x1b[4m",
	inverse: "\x1b[7m",
	strikethrough: "\x1b[9m",

	black: "\x1b[30m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
	white: "\x1b[37m",

	bgBlack: "\x1b[40m",
	bgRed: "\x1b[41m",
	bgGreen: "\x1b[42m",
	bgYellow: "\x1b[43m",
	bgBlue: "\x1b[44m",
	bgMagenta: "\x1b[45m",
	bgCyan: "\x1b[46m",
	bgWhite: "\x1b[47m",
};

type ColorKey = keyof typeof COLORS;

function colorize(text: string, color: ColorKey | ColorKey[]): string {
	if (!Array.isArray(color)) {
		return `${COLORS[color]}${text}${COLORS.reset}`;
	}
	const colorCodes = color.map((c) => COLORS[c]).join("");
	return `${colorCodes}${text}${COLORS.reset}`;
}

function bold(text: string): string {
	return colorize(text, "bright");
}

function dim(text: string): string {
	return colorize(text, "dim");
}

function red(text: string): string {
	return colorize(text, "red");
}

function green(text: string): string {
	return colorize(text, "green");
}

function yellow(text: string): string {
	return colorize(text, "yellow");
}

function blue(text: string): string {
	return colorize(text, "blue");
}

function cyan(text: string): string {
	return colorize(text, "cyan");
}

function magenta(text: string): string {
	return colorize(text, "magenta");
}

function white(text: string): string {
	return colorize(text, "white");
}

function stripColors(text: string): string {
	const escapeChar = String.fromCharCode(27);
	const pattern = `${escapeChar}\\[[0-9;]*m`;
	return text.replace(new RegExp(pattern, "g"), "");
}

function separator(char: string = "─", width: number = 50): string {
	return char.repeat(width);
}

function ruler(
	label?: string,
	labelColor: ColorKey = "cyan",
	char: string = "─",
): string {
	const width = 80;
	const visibleWidth = stripColors(
		colorize(` ${label || ""} `, labelColor),
	).length;
	if (label && visibleWidth > 0) {
		const halfLeft = Math.floor((width - visibleWidth) / 2);
		const halfRight = width - halfLeft - visibleWidth;
		return (
			char.repeat(halfLeft) +
			colorize(` ${label} `, labelColor) +
			char.repeat(halfRight)
		);
	}
	return char.repeat(width);
}

function block(
	title: string,
	content: string,
	titleColor: ColorKey = "cyan",
): string {
	const lines = [
		`┌─ ${colorize(title, titleColor)} ${"─".repeat(76 - title.length)}`,
	];

	content.split("\n").forEach((line) => {
		lines.push(`│ ${line}`);
	});

	lines.push(`└${"─".repeat(78)}`);
	return lines.join("\n");
}

function listItem(
	marker: string = "•",
	text: string,
	markerColor: ColorKey = "cyan",
): string {
	return `${colorize(marker, markerColor)} ${text}`;
}

function success(text: string): string {
	return `${green("✓")} ${text}`;
}

function error(text: string): string {
	return `${red("✗")} ${text}`;
}

function warning(text: string): string {
	return `${yellow("⚠")} ${text}`;
}

function info(text: string): string {
	return `${cyan("ℹ")} ${text}`;
}

function keyValuePair(
	key: string,
	value: string,
	keyColor: ColorKey = "cyan",
	valueColor: ColorKey = "white",
): string {
	return `  ${colorize(`${key}:`, keyColor)} ${colorize(value, valueColor)}`;
}

function commandLine(command: string): string {
	return gray(`$ ${yellow(command)}`);
}

function gray(text: string): string {
	return dim(text);
}

function quote(text: string): string {
	return dim(text);
}

export const styles = {
	bold,
	dim,
	red,
	green,
	yellow,
	blue,
	cyan,
	magenta,
	white,
	gray,
	stripColors,
	separator,
	ruler,
	block,
	listItem,
	success,
	error,
	warning,
	info,
	keyValuePair,
	commandLine,
	quote,
	colorize,
};
export default styles;
