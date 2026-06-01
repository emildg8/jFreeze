import { describe, expect, it } from "vitest";
import { friendlyApiMessage } from "@/lib/api/user-messages";

describe("friendlyApiMessage", () => {
  it("переводит обрыв сети", () => {
    const msg = friendlyApiMessage(0);
    expect(msg).toContain("Нет связи");
    expect(msg).toContain("настройках");
  });

  it("сохраняет понятное сообщение сервера", () => {
    expect(friendlyApiMessage(400, "Неверный QR чека")).toBe("Неверный QR чека");
  });

  it("скрывает технический текст", () => {
    const msg = friendlyApiMessage(500, "Error: ECONNREFUSED");
    expect(msg).not.toContain("ECONNREFUSED");
  });
});
