import { describe, expect, it } from "vitest";
import { evaluationLevel, initials, memberStatusLabel, priorityLabel, taskStatusLabel } from "../drizzle/schema";

describe("Media Hub evaluation rules", () => {
  it("maps scores to the documented evaluation levels", () => {
    expect(evaluationLevel(95)).toBe("متميز");
    expect(evaluationLevel(80)).toBe("نشط جدًا");
    expect(evaluationLevel(65)).toBe("جيد ويحتاج إلى تطوير مستمر");
    expect(evaluationLevel(45)).toBe("يحتاج إلى متابعة");
    expect(evaluationLevel(20)).toBe("يحتاج إلى مراجعة فردية");
  });

  it("keeps workflow labels consistent", () => {
    expect(taskStatusLabel("needs_revision")).toBe("تحتاج تعديل");
    expect(taskStatusLabel("completed")).toBe("مكتملة");
    expect(memberStatusLabel("unresponsive")).toBe("غير مستجيب");
    expect(priorityLabel("high")).toBe("عالية");
  });

  it("creates compact initials for member cards", () => {
    expect(initials("جورج سامح")).toBe("جس");
    expect(initials("كارين")).toBe("ك");
  });
});
