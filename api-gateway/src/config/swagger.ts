import swaggerJSDoc from "swagger-jsdoc";
import { SwaggerBuilder } from "../utils/swaggerBuilder";
import { addUserAuthRoutes } from "../docs/user-auth.docs";
// import { userAuthDocs } from "../docs/user-auth.docs";
import { userProfileDocs } from "../docs/user-profile.docs";
import { eventsDocs } from "../docs/events.docs";

// Initialize Swagger Builder
const builder = new SwaggerBuilder();

builder
  .setInfo(
    "Evently API Gateway",
    "1.0.0",
    "API Gateway for Evently Microservices - Centralized API documentation for all services"
  )
  .addServers([
    {
      url: "http://localhost:8000",
      description: "Development server",
    },
    {
      url: "https://api.evently.com",
      description: "Production server",
    },
  ])
  .addTags([
    {
      name: "Health",
      description: "Health check endpoints",
    },
    {
      name: "User - Authentication",
      description: "User authentication and authorization operations",
    },
    {
      name: "User - Profile",
      description: "User profile management operations",
    },
    {
      name: "Events",
      description: "Event management operations",
    },
    {
      name: "Tickets",
      description: "Ticket booking and management operations",
    },
    {
      name: "Payments",
      description: "Payment processing operations",
    },
  ]);

// Add reusable schemas
builder
  .addSchema("User", {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      email: { type: "string", format: "email" },
      name: { type: "string" },
      isVerified: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  })
  .addSchema("Event", {
    type: "object",
    properties: {
      id: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      date: { type: "string", format: "date-time" },
      location: { type: "string" },
      capacity: { type: "integer" },
      price: { type: "number" },
      organizerId: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  });

// Add standard error responses to components
builder.addStandardSchemas("/health", "GET");

// Add Health Check route
builder.addRoute("/health", "GET", {
  summary: "Health check",
  description: "Check if the API Gateway is running",
  tags: ["Health"],
  successDataSchema: {
    type: "object",
    properties: {
      message: { type: "string", example: "healthy" },
      timestamp: { type: "string", format: "date-time" },
    },
  },
  successExample: {
    status: 200,
    message: "API Gateway is running",
    data: {
      message: "healthy",
      timestamp: "2025-12-16T07:19:20.000Z",
    },
    meta: {
      requestId: "123e4567-e89b-12d3-a456-426614174000",
      timestamp: "2025-12-16T07:19:20.000Z",
      processingTime: "2.5ms",
    },
    request: {
      path: "/health",
      method: "GET",
    },
  },
  errorCodes: [],
});

// Add authentication routes from separate file
addUserAuthRoutes(builder);

// Build the base spec
const baseSpec = builder.build();

// Merge with route documentation from separate files
const swaggerDefinition = {
  ...baseSpec,
  paths: {
    ...baseSpec.paths,
    // ...userAuthDocs,
    ...userProfileDocs,
    ...eventsDocs,
  },
};

const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  apis: [], // We're using manual definitions instead of JSDoc comments
};

export const swaggerSpec = swaggerJSDoc(options);
