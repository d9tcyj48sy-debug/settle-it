const TIMEOUT_MS = 10_000;

export async function getVerdict(sideA, sideB) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch("/api/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sideA, sideB }),
      signal: controller.signal,
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      return {
        error: true,
        errorType: data.errorType ?? "unknown",
        message: data.message ?? "Something went wrong.",
      };
    }

    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      return {
        error: true,
        errorType: "api_unavailable",
        message: "The arbitrator took too long. Try again.",
      };
    }
    return {
      error: true,
      errorType: "unknown",
      message: "Could not reach the arbitrator. Check your connection.",
    };
  } finally {
    clearTimeout(timer);
  }
}
