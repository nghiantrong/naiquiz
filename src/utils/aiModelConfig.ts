const PREFERRED_MODEL = import.meta.env.VITE_GEMINI_MODEL as string | undefined;

/**
 * Lấy danh sách các model miễn phí của Gemini để thử nghiệm theo thứ tự (fallback)
 * Nếu người dùng truyền vào VITE_GEMINI_MODEL, nó sẽ được đẩy lên ưu tiên số 1
 */
export function getFallbackModels(): string[] {
    const list = [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-3.0-flash",
        "gemini-3.1-flash-lite"
    ];

    if (PREFERRED_MODEL && !list.includes(PREFERRED_MODEL)) {
        list.unshift(PREFERRED_MODEL);
    } else if (PREFERRED_MODEL) {
        // Move it to the front
        const idx = list.indexOf(PREFERRED_MODEL);
        list.splice(idx, 1);
        list.unshift(PREFERRED_MODEL);
    }

    return list;
}
