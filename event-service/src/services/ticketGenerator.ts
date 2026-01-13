import { createCanvas, loadImage, registerFont, Image } from "canvas";
import QRCode from "qrcode";
import { uploadToR2 } from "../config/r2.config";
import { Ticket } from "../db/schema";
import { createLogger, format, transports } from "winston";
import path from "path";

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

export const ticketGenerator = {
  /**
   * Generate a ticket image and upload it to R2
   */
  async generateAndUpload(
    ticket: Ticket,
    eventName: string,
    eventStartDate: string,
    eventEndDate: string,
    eventLocation: string,
    eventType: string,
    eventStartTime: string,
    eventEndTime: string,
    userName: string
  ): Promise<string> {
    try {
      // --- Premium Ticket Design (Vertical: 600x1000) ---
      const width = 600;
      const height = 1000;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // 1. Background (Deep Purple/Blue Night Sky Gradient)
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#4c1e95"); // violet-900
      gradient.addColorStop(0.5, "#2e1065"); // purple-950
      gradient.addColorStop(1, "#0f0729"); // almost black
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Particle/Confetti Effects
      const particleCount = 100;
      const colors = ["#FFD700", "#FF007F", "#00FFFF", "#DA70D6", "#FFFFFF"];
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 4 + 1;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const opacity = Math.random() * 0.6 + 0.2;

        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 3. Ticket Card Container (Rounded Rect Overlay)
      const margin = 40;
      const cardWidth = width - margin * 2;
      const cardHeight = height - margin * 2;
      const radius = 20;

      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;

      // Draw Rounded Rect Path
      ctx.beginPath();
      ctx.moveTo(margin + radius, margin);
      ctx.lineTo(margin + cardWidth - radius, margin);
      ctx.quadraticCurveTo(
        margin + cardWidth,
        margin,
        margin + cardWidth,
        margin + radius
      );
      ctx.lineTo(margin + cardWidth, margin + cardHeight - radius);
      ctx.quadraticCurveTo(
        margin + cardWidth,
        margin + cardHeight,
        margin + cardWidth - radius,
        margin + cardHeight
      );
      ctx.lineTo(margin + radius, margin + cardHeight);
      ctx.quadraticCurveTo(
        margin,
        margin + cardHeight,
        margin,
        margin + cardHeight - radius
      );
      ctx.lineTo(margin, margin + radius);
      ctx.quadraticCurveTo(margin, margin, margin + radius, margin);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 4. Content Placement
      // 4. Content Placement
      const contentX = width / 2;
      let cursorY = margin + 100;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Event Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 42px Arial";
      const titleWords = eventName.split(" ");
      let line = "";
      const lines = [];
      const maxWidth = cardWidth - 80;

      for (let n = 0; n < titleWords.length; n++) {
        const testLine = line + titleWords[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          lines.push(line);
          line = titleWords[n] + " ";
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      lines.forEach((l) => {
        ctx.fillText(l.trim(), contentX, cursorY);
        cursorY += 50;
      });

      // Date & Time
      cursorY += 20;
      ctx.fillStyle = "#E0E7FF/0.5"; // Indigo-100
      ctx.font = "600 24px Arial";
      ctx.fillText(
        eventStartDate === eventEndDate
          ? `${new Date(eventStartDate).toDateString()}`
          : `${new Date(eventStartDate).toDateString()} - ${new Date(
              eventEndDate
            ).toDateString()}`,
        contentX,
        cursorY
      );
      cursorY += 50;

      // Time
      ctx.fillStyle = "#E0E7FF/0.5"; // Indigo-100
      ctx.font = "600 24px Arial";
      ctx.fillText(`${eventStartTime} - ${eventEndTime}`, contentX, cursorY);
      cursorY += 50;

      // Location
      if (eventType !== "online") {
        ctx.fillStyle = "#38bdf8"; // Sky-400
        ctx.font = "600 24px Arial";
        const locationWords = eventLocation.split(" ");
        let line = "";
        const lines = [];
        const maxWidth = cardWidth - 80;

        for (let n = 0; n < locationWords.length; n++) {
          const testLine = line + locationWords[n] + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            lines.push(line);
            line = locationWords[n] + " ";
          } else {
            line = testLine;
          }
        }
        lines.push(line);

        lines.forEach((l) => {
          ctx.fillText(l.trim(), contentX, cursorY);
          cursorY += 30;
        });
      }

      // Divider
      cursorY += 20;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.beginPath();
      ctx.moveTo(margin + 60, cursorY);
      ctx.lineTo(width - margin - 60, cursorY);
      ctx.stroke();
      cursorY += 50;

      // Attendee Label
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "18px Arial";
      ctx.fillText("ATTENDEE", contentX, cursorY);
      cursorY += 30;

      // User Name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px Arial";
      ctx.fillText(userName || "Guest", contentX, cursorY);
      cursorY += 60;

      // Ticket Code Label
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "18px Arial";
      ctx.fillText("TICKET CODE", contentX, cursorY);
      cursorY += 45;

      // Ticket Code Value (Shortened)
      const shortCode = ticket.ticketCode
        ? ticket.ticketCode.toUpperCase()
        : "UNKNOWN";
      ctx.fillStyle = "#FFD700"; // Gold
      ctx.font = "bold 48px Monospace";
      ctx.fillText(shortCode, contentX, cursorY);

      // --- Stub Area ---
      // Dotted Line
      const stubY = height - margin - 220;
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.beginPath();
      ctx.moveTo(margin, stubY);
      ctx.lineTo(width - margin, stubY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Half-circles for "tear" effect on sides
      ctx.fillStyle = "#0f0729"; // Match background roughly (or transparent if possible but canvas is simple)
      // Actually simpler: just draw small dark circles at the edges of the stub line
      // Left notch
      ctx.beginPath();
      ctx.arc(margin, stubY, 15, -Math.PI / 2, Math.PI / 2, false);
      ctx.fill();
      // Right notch
      ctx.beginPath();
      ctx.arc(width - margin, stubY, 15, Math.PI / 2, -Math.PI / 2, false);
      ctx.fill();

      // QR Code Area
      const qrCenterY = stubY + (height - margin - stubY) / 2;
      const qrSize = 140;
      const qrX = contentX - qrSize / 2;
      const qrY = qrCenterY - qrSize / 2 - 10;

      // Real QR Code Generation
      try {
        const qrData = JSON.stringify({
          ticketId: ticket.id,
          ticketCode: ticket.ticketCode,
          eventId: ticket.eventId,
          userId: ticket.userId,
          registrationId: ticket.registrationId,
          name: userName,
        });
        const qrBuffer = await QRCode.toBuffer(qrData, {
          errorCorrectionLevel: "H",
          margin: 1,
          width: qrSize,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });

        // Add white background for QR
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);

        const qrImage = await loadImage(qrBuffer);
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
      } catch (qrError) {
        logger.error("Failed to generate QR code", { qrError });
      }

      // Footer ID
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "12px Monospace";
      ctx.fillText(`ID: ${ticket.id}`, contentX, height - margin - 20);

      // Generate Buffer
      const buffer = canvas.toBuffer("image/png");

      // Upload to R2
      const filename = `ticket-${ticket.ticketCode}.png`;
      const publicUrl = await uploadToR2(buffer, filename, "image/png");

      logger.info("Ticket image generated and uploaded", {
        ticketId: ticket.id,
        publicUrl,
      });

      return publicUrl;
    } catch (error) {
      logger.error("Failed to generate ticket image", {
        error: error instanceof Error ? error.message : String(error),
        ticketId: ticket.id,
      });
      // Return empty string or throw depending on requirement.
      // Ideally, the process shouldn't fail the whole request just because image gen failed,
      // but the user wants the ability to download it.
      return "";
    }
  },
};
