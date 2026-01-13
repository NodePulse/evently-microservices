import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || "development",
  gatewaySecret: process.env.GATEWAY_SECRET || "secure-gateway-secret",
  services: {
    user: {
      url: process.env.USER_SERVICE_URL || "http://127.0.0.1:8001",
      routes: ["/api/v1/user/auth", "/api/v1/user/profile"],
    },
    event: {
      url: process.env.EVENT_SERVICE_URL || "http://127.0.0.1:8002",
      routes: ["/api/v1/events"],
    },
    notification: {
      url: process.env.NOTIFICATION_SERVICE_URL || "http://127.0.0.1:8003",
      routes: ["/api/v1/notifications"],
    },
    ticket: {
      url: process.env.TICKET_SERVICE_URL || "http://127.0.0.1:8004",
      routes: ["/api/v1/ticket/tickets"],
    },
    payment: {
      url: process.env.PAYMENT_SERVICE_URL || "http://127.0.0.1:8005",
      routes: ["/api/v1/payment/payments"],
    },
  },
};
