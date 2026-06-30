import { getAccentTheme } from "./storageService";

const SIZE = 1080;
const PAD = 80;
const CONTENT_W = SIZE - PAD * 2;
const ACCENT_COLORS = { purple: "#7c5cfc", forest: "#3ba373" };
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = text.split(" ");
  let line = "";
  let linesDrawn = 0;

  for (const word of words) {
    if (linesDrawn >= maxLines) break;
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y + linesDrawn * lineHeight);
      linesDrawn++;
      line = word;
    } else {
      line = testLine;
    }
  }
  if (linesDrawn < maxLines && line) {
    ctx.fillText(line, x, y + linesDrawn * lineHeight);
  }
}

function roundFill(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
  ctx.fill();
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png",
    );
  });
}

function drawCard(ctx, verdict) {
  const { topicLabel, sideAPercentage, sideBPercentage, ruling } = verdict;
  const ACCENT = ACCENT_COLORS[getAccentTheme()] ?? ACCENT_COLORS.purple;

  // ── Background ──────────────────────────────────────────────────────────
  ctx.fillStyle = "#0e0e0f";
  ctx.fillRect(0, 0, SIZE, SIZE);

  // ── Wordmark ─────────────────────────────────────────────────────────────
  ctx.font = `700 54px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  const wordmark = "settle it";
  ctx.fillText(wordmark, PAD, 132);
  const wordmarkW = ctx.measureText(wordmark).width;
  ctx.fillStyle = ACCENT;
  ctx.fillText(".", PAD + wordmarkW, 132);

  // ── Topic label ──────────────────────────────────────────────────────────
  ctx.font = `500 28px ${FONT}`;
  ctx.fillStyle = "#52525b";
  ctx.fillText(topicLabel.toUpperCase(), PAD, 202);

  // ── Percentages ──────────────────────────────────────────────────────────
  const NUM_Y = 430;
  const NUM_SIZE = 180;
  const PCT_SIZE = 86;

  // Side A (you) — purple, left
  ctx.fillStyle = ACCENT;
  ctx.font = `700 ${NUM_SIZE}px ${FONT}`;
  const aStr = String(sideAPercentage);
  ctx.fillText(aStr, PAD, NUM_Y);
  const aNumW = ctx.measureText(aStr).width;
  ctx.font = `700 ${PCT_SIZE}px ${FONT}`;
  ctx.fillText("%", PAD + aNumW + 6, NUM_Y);

  // Side B (them) — grey, right (measure then draw left-aligned)
  const bStr = String(sideBPercentage);
  ctx.font = `700 ${NUM_SIZE}px ${FONT}`;
  const bNumW = ctx.measureText(bStr).width;
  ctx.font = `700 ${PCT_SIZE}px ${FONT}`;
  const pctW = ctx.measureText("%").width;
  const bX = SIZE - PAD - pctW - bNumW - 6;
  ctx.fillStyle = "#3f3f46";
  ctx.font = `700 ${NUM_SIZE}px ${FONT}`;
  ctx.fillText(bStr, bX, NUM_Y);
  ctx.font = `700 ${PCT_SIZE}px ${FONT}`;
  ctx.fillText("%", bX + bNumW + 6, NUM_Y);

  // ── "you" / "them" labels ─────────────────────────────────────────────
  const LABEL_Y = NUM_Y + 58;
  ctx.font = `500 32px ${FONT}`;
  ctx.fillStyle = "#71717a";
  ctx.textAlign = "left";
  ctx.fillText("you", PAD, LABEL_Y);
  ctx.textAlign = "right";
  ctx.fillText("them", SIZE - PAD, LABEL_Y);

  // ── Meter bar ─────────────────────────────────────────────────────────
  const METER_Y = LABEL_Y + 50;
  const METER_H = 12;
  const fillW = Math.max(METER_H, Math.round((sideAPercentage / 100) * CONTENT_W));

  ctx.fillStyle = "#27272a";
  roundFill(ctx, PAD, METER_Y, CONTENT_W, METER_H, METER_H / 2);

  ctx.fillStyle = ACCENT;
  roundFill(ctx, PAD, METER_Y, fillW, METER_H, METER_H / 2);

  // ── Ruling (first sentence, wrapped) ─────────────────────────────────
  const match = ruling.match(/^[^.!?]*[.!?]/);
  const firstSentence = match ? match[0] : ruling;

  const RULING_SIZE = 36;
  const RULING_LINE = RULING_SIZE * 1.55;
  const RULING_Y = METER_Y + METER_H + 70;

  ctx.font = `400 ${RULING_SIZE}px ${FONT}`;
  ctx.fillStyle = "#d4d4d8";
  ctx.textAlign = "left";
  wrapText(ctx, firstSentence, PAD, RULING_Y, CONTENT_W, RULING_LINE, 3);

  // ── Domain ───────────────────────────────────────────────────────────
  ctx.font = `400 26px ${FONT}`;
  ctx.fillStyle = "#3f3f46";
  ctx.textAlign = "left";
  ctx.fillText("settle-it-ten.vercel.app", PAD, SIZE - 64);
}

export async function shareVerdict(verdict) {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");

  drawCard(ctx, verdict);

  const blob = await canvasToBlob(canvas);
  const file = new File([blob], "verdict.png", { type: "image/png" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "Settle It Verdict",
      text: `${verdict.topicLabel} — ${verdict.sideAPercentage}% in my favour`,
    });
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "verdict.png";
    a.click();
    URL.revokeObjectURL(url);
  }
}
