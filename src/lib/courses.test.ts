import { describe, expect, it } from "vitest";
import { scorePercent } from "./courses";

describe("quiz pass rule (70% default)", () => {
  it("2 of 3 correct is 67%, below 70", () => {
    expect(scorePercent(2, 3)).toBe(67);
    expect(scorePercent(2, 3) >= 70).toBe(false);
  });
  it("3 of 3 correct passes", () => {
    expect(scorePercent(3, 3) >= 70).toBe(true);
  });
});
