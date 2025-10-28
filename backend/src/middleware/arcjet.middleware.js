import aj from "../lib/arcjet.js";
import { isSpoofedBot } from "@arcjet/inspect";

export const arcjetProtection = async (req, res, next) => {
  try {
    const descision = await aj.protect(req); 

    if (descision.isDenied()) {
      if (descision.reason.isRateLimit()) {
        return res.status(429).json({ message: "Rate limit exceeded. Please try later." });
      } else if (descision.reason.isBot()) {
        return res.status(403).json({ message: "Bot access denied." });
      } else {
        return res.status(403).json({ message: "Access denied by security policy." });
      }
    }

    // Check for spoofed bots
    if (descision.results.some(isSpoofedBot)) {
      return res.status(403).json({
        error: "Spoofed bot detected",
        message: "Malicious bot activity detected.",
      });
    }

    next();
  } catch (error) {
    console.error("Arcject Protection Error:", error);
    next();
  }
};
