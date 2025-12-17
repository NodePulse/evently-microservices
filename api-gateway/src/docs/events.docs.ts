export const eventsDocs = {
  "/api/v1/events": {
    get: {
      tags: ["Events"],
      summary: "Get all events",
      description: "Retrieve a list of all events",
      parameters: [
        {
          in: "query",
          name: "page",
          schema: { type: "integer", default: 1 },
          description: "Page number for pagination",
        },
        {
          in: "query",
          name: "limit",
          schema: { type: "integer", default: 10 },
          description: "Number of events per page",
        },
        {
          in: "query",
          name: "search",
          schema: { type: "string" },
          description: "Search events by title",
        },
      ],
      responses: {
        "200": {
          description: "Events retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              example: {
                status: 200,
                message: "Events retrieved successfully",
                data: {
                  events: [
                    {
                      id: "507f1f77bcf86cd799439011",
                      title: "Tech Conference 2024",
                      description: "Annual technology conference",
                      date: "2024-06-15T09:00:00.000Z",
                      location: "San Francisco, CA",
                      capacity: 500,
                      price: 299.99,
                      organizerId: "123e4567-e89b-12d3-a456-426614174000",
                    },
                  ],
                  pagination: {
                    currentPage: 1,
                    totalPages: 5,
                    totalEvents: 48,
                  },
                },
              },
            },
          },
        },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
    post: {
      tags: ["Events"],
      summary: "Create a new event",
      description: "Create a new event (requires authentication)",
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: [
                "title",
                "description",
                "date",
                "location",
                "capacity",
                "price",
              ],
              properties: {
                title: {
                  type: "string",
                  description: "Event title",
                  example: "Tech Conference 2024",
                },
                description: {
                  type: "string",
                  description: "Event description",
                  example:
                    "Annual technology conference featuring industry leaders",
                },
                date: {
                  type: "string",
                  format: "date-time",
                  description: "Event date and time",
                  example: "2024-06-15T09:00:00.000Z",
                },
                location: {
                  type: "string",
                  description: "Event location",
                  example: "San Francisco, CA",
                },
                capacity: {
                  type: "integer",
                  description: "Maximum number of attendees",
                  example: 500,
                },
                price: {
                  type: "number",
                  description: "Ticket price",
                  example: 299.99,
                },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Event created successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              example: {
                status: 201,
                message: "Event created successfully",
                data: {
                  event: {
                    id: "507f1f77bcf86cd799439011",
                    title: "Tech Conference 2024",
                    description: "Annual technology conference",
                    date: "2024-06-15T09:00:00.000Z",
                    location: "San Francisco, CA",
                    capacity: 500,
                    price: 299.99,
                    organizerId: "123e4567-e89b-12d3-a456-426614174000",
                  },
                },
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
  },
  "/api/v1/events/{id}": {
    get: {
      tags: ["Events"],
      summary: "Get event by ID",
      description: "Retrieve a specific event by its ID",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
          description: "Event ID",
          example: "507f1f77bcf86cd799439011",
        },
      ],
      responses: {
        "200": {
          description: "Event retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              example: {
                status: 200,
                message: "Event retrieved successfully",
                data: {
                  event: {
                    id: "507f1f77bcf86cd799439011",
                    title: "Tech Conference 2024",
                    description: "Annual technology conference",
                    date: "2024-06-15T09:00:00.000Z",
                    location: "San Francisco, CA",
                    capacity: 500,
                    price: 299.99,
                    organizerId: "123e4567-e89b-12d3-a456-426614174000",
                  },
                },
              },
            },
          },
        },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
    put: {
      tags: ["Events"],
      summary: "Update event",
      description: "Update an existing event (requires authentication)",
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
          description: "Event ID",
          example: "507f1f77bcf86cd799439011",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  example: "Updated Tech Conference 2024",
                },
                description: { type: "string" },
                date: { type: "string", format: "date-time" },
                location: { type: "string" },
                capacity: { type: "integer" },
                price: { type: "number" },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Event updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              example: {
                status: 200,
                message: "Event updated successfully",
                data: {
                  event: {
                    id: "507f1f77bcf86cd799439011",
                    title: "Updated Tech Conference 2024",
                  },
                },
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
    delete: {
      tags: ["Events"],
      summary: "Delete event",
      description: "Delete an event (requires authentication)",
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
          description: "Event ID",
          example: "507f1f77bcf86cd799439011",
        },
      ],
      responses: {
        "200": {
          description: "Event deleted successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              example: {
                status: 200,
                message: "Event deleted successfully",
                data: null,
              },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
  },
};
