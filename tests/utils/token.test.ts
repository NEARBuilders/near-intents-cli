import { describe, it, expect } from "vitest";
import { formatTable, parseArgs } from "@/utils/token";

describe("token utils", () => {
  describe("formatTable", () => {
    it("should format a simple table", () => {
      const headers = ["Name", "Age"];
      const rows = [
        ["Alice", "30"],
        ["Bob", "25"],
      ];

      const result = formatTable(headers, rows);
      const lines = result.split("\n");

      expect(lines.length).toBe(4); // header + separator + 2 rows
      expect(lines[0]).toContain("Name");
      expect(lines[0]).toContain("Age");
      expect(lines[1]).toContain("-");
      expect(lines[2]).toContain("Alice");
      expect(lines[3]).toContain("Bob");
    });

    it("should handle varying column widths", () => {
      const headers = ["A", "B"];
      const rows = [
        ["Short", "VeryLongValue"],
        ["X", "Y"],
      ];

      const result = formatTable(headers, rows);
      const lines = result.split("\n");

      // Each column should be padded to its max width
      expect(lines[2]).toContain("Short");
      expect(lines[2]).toContain("VeryLongValue");
    });

    it("should handle empty rows", () => {
      const headers = ["Col1", "Col2"];
      const rows: string[][] = [];

      const result = formatTable(headers, rows);
      const lines = result.split("\n");

      // header + separator + empty data row (from join of empty array)
      expect(lines[0]).toContain("Col1");
      expect(lines[1]).toContain("-");
    });

    it("should handle missing cell values", () => {
      const headers = ["A", "B", "C"];
      const rows = [["1", "2"]]; // missing third column

      const result = formatTable(headers, rows);
      expect(result).toContain("1");
      expect(result).toContain("2");
    });
  });

  describe("parseArgs", () => {
    it("should parse command without flags", () => {
      const result = parseArgs(["tokens"]);
      expect(result.command).toBe("tokens");
      expect(result.flags).toEqual({});
    });

    it("should parse flags with values", () => {
      const result = parseArgs(["swap", "--from", "USDC", "--to", "NEAR"]);
      expect(result.command).toBe("swap");
      expect(result.flags).toEqual({ from: "USDC", to: "NEAR" });
    });

    it("should parse boolean flags", () => {
      const result = parseArgs(["swap", "--dry-run"]);
      expect(result.command).toBe("swap");
      expect(result.flags["dry-run"]).toBe("true");
    });

    it("should handle mixed flags and values", () => {
      const result = parseArgs([
        "withdraw",
        "--token",
        "USDC",
        "--dry-run",
        "--amount",
        "100",
      ]);
      expect(result.command).toBe("withdraw");
      expect(result.flags).toEqual({
        token: "USDC",
        "dry-run": "true",
        amount: "100",
      });
    });

    it("should return empty command for empty args", () => {
      const result = parseArgs([]);
      expect(result.command).toBe("");
      expect(result.flags).toEqual({});
    });
  });
});
