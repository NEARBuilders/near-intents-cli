import { styles } from "./styles";

type ColorKey = Parameters<typeof styles.colorize>[1];

export interface Column {
	key: string;
	header: string;
	color?: ColorKey;
	align?: "left" | "center" | "right";
	padChar?: string;
}

interface TableOptions {
	header?: boolean;
	borders?: boolean;
	padding?: number;
	headerColor?: ColorKey;
}

export function formatTable(
	columns: Column[],
	rows: Record<string, unknown>[],
	options: TableOptions = {},
): string {
	const {
		header = true,
		borders = true,
		padding = 1,
		headerColor = "cyan",
	} = options;

	const pad = " ".repeat(padding);

	const colWidths = columns.map((col) => {
		const headerWidth = col.header.length;
		const maxWidth = Math.max(
			headerWidth,
			...rows.map((row) => String(row[col.key] ?? "").length),
		);
		return maxWidth + padding * 2;
	});

	const formatCell = (text: unknown, col: Column, width: number): string => {
		const str = String(text ?? "");
		const padded = pad + str + pad;
		const diff = width - padded.length;

		if (col.align === "center") {
			const leftPad = " ".repeat(Math.floor(diff / 2));
			const rightPad = " ".repeat(diff - leftPad.length);
			return leftPad + padded + rightPad;
		}
		if (col.align === "right") {
			return " ".repeat(diff) + padded;
		}
		return padded + " ".repeat(diff);
	};

	const buildLine = (
		char: string,
		left: string = "├",
		mid: string = "┼",
		right: string = "┤",
	): string => {
		const parts = colWidths.map((w) => char.repeat(w - 2));
		return left + parts.join(mid) + right;
	};

	const lines: string[] = [];

	if (borders) {
		lines.push(buildLine("─", "┌", "┬", "┐"));
	}

	if (header) {
		const headerCells = columns.map((col, i) => {
			const cell = formatCell(col.header, col, colWidths[i]);
			return styles.colorize(cell, headerColor);
		});
		lines.push(`│${headerCells.join("│")}│`);

		if (borders) {
			lines.push(buildLine("─"));
		}
	}

	const rowLines = rows.map((row) => {
		const cells = columns.map((col, i) =>
			formatCell(row[col.key] ?? "", col, colWidths[i]),
		);
		return `│${cells.join("│")}│`;
	});
	lines.push(...rowLines);

	if (borders) {
		lines.push(buildLine("─", "└", "┴", "┘"));
	}

	return lines.join("\n");
}

export function formatSimpleTable(headers: string[], rows: string[][]): string {
	const colWidths = headers.map((h, i) =>
		Math.max(h.length, ...rows.map((r) => (r[i] || "").length)),
	);

	const separator = colWidths.map((w) => "─".repeat(w + 2)).join("+");
	const headerRow = headers
		.map((h, i) => ` ${h.padEnd(colWidths[i])} `)
		.join("|");
	const dataRows = rows.map((row) =>
		row
			.map((cell, i) => ` ${String(cell || "").padEnd(colWidths[i])} `)
			.join("|"),
	);

	return [headerRow, separator, ...dataRows].join("\n");
}

export function formatCompactList(
	items: string[],
	options: { prefix?: string; color?: ColorKey } = {},
): string {
	const { prefix = "•", color: c = "cyan" } = options;
	return items
		.map((item) => `${styles.colorize(prefix, c)} ${item}`)
		.join("\n");
}
