# Communication Aggregator System

A microservice-based system that receives messages from multiple sources and routes them to the right communication channel (Email, SMS, WhatsApp).

## Architecture Overview

This system consists of three microservices:

1. **Task Router Service**: Receives message requests via REST API, validates them, applies routing logic, and forwards to appropriate delivery service.

2. **Delivery Service**: Simulates sending messages through different channels (Email, SMS, WhatsApp).

3. **Logging Service**: Captures logs from all services, processes them, and stores in Elasticsearch for visualization in Kibana.


## Communication Method

The system uses RabbitMQ for asynchronous communication between services for the following reasons:
- Decouples services from each other
- Provides reliable message delivery with acknowledgments
- Enables retry mechanisms for failed operations
- Manages backpressure when services are under heavy load
- Allows for easy scaling of individual services

## Services Description

### Task Router Service
- Accepts and validates incoming message requests
- Detects and prevents duplicate messages
- Routes messages to appropriate delivery channels
- Implements retry logic for failed deliveries

### Delivery Service
- Processes messages for specific channels
- Simulates message delivery
- Records delivery status

### Logging Service
- Centralizes logs from all services
- Stores logs in Elasticsearch
- Enables log analysis through Kibana

## Setup and Run Instructions

### Prerequisites
- Docker and Docker Compose

### Start the Services
1. Clone the repository:
```
git clone https://github.com/pshri5/comms-aggregator.git
cd comms-aggregator
```
2. Start all services:
```
docker-compose up -d
```
3. Access the services:
   - Task Router API: http://localhost:3000
   - RabbitMQ Management UI: http://localhost:15672 (guest/guest)
   - Kibana Dashboard: http://localhost:5601

## Postman Collection
```
{
  "info": {
    "name": "Communication Aggregator System",
    "description": "API collection for testing the Communication Aggregator microservices",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Task Router Service",
      "description": "Endpoints for the Task Router Service",
      "item": [
        {
          "name": "Health Check",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "http://localhost:3000/health",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3000",
              "path": ["health"]
            },
            "description": "Check if the Task Router Service is up and running"
          },
          "response": []
        },
        {
          "name": "Send Email Message",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"channel\": \"email\",\n  \"content\": {\n    \"recipient\": \"user@example.com\",\n    \"subject\": \"Hello World\",\n    \"body\": \"This is a test email message.\"\n  }\n}"
            },
            "url": {
              "raw": "http://localhost:3000/api/messages",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3000",
              "path": ["api", "messages"]
            },
            "description": "Send a message through the email channel"
          },
          "response": []
        },
        {
          "name": "Send SMS Message",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"channel\": \"sms\",\n  \"content\": {\n    \"recipient\": \"+1234567890\",\n    \"body\": \"This is a test SMS message.\"\n  }\n}"
            },
            "url": {
              "raw": "http://localhost:3000/api/messages",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3000",
              "path": ["api", "messages"]
            },
            "description": "Send a message through the SMS channel"
          },
          "response": []
        },
        {
          "name": "Send WhatsApp Message",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"channel\": \"whatsapp\",\n  \"content\": {\n    \"recipient\": \"+1234567890\",\n    \"body\": \"This is a test WhatsApp message.\"\n  }\n}"
            },
            "url": {
              "raw": "http://localhost:3000/api/messages",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3000",
              "path": ["api", "messages"]
            },
            "description": "Send a message through the WhatsApp channel"
          },
          "response": []
        },
        {
          "name": "Get Message Status",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "http://localhost:3000/api/messages/:id",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3000",
              "path": ["api", "messages", ":id"],
              "variable": [
                {
                  "key": "id",
                  "value": "{{messageId}}",
                  "description": "Message ID received from the send message request"
                }
              ]
            },
            "description": "Get the status of a specific message by ID"
          },
          "response": []
        },
        {
          "name": "Send Invalid Message (Validation Test)",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"channel\": \"email\",\n  \"content\": {\n    \"recipient\": \"user@example.com\",\n    \"body\": \"This is a test email without required subject.\"\n  }\n}"
            },
            "url": {
              "raw": "http://localhost:3000/api/messages",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3000",
              "path": ["api", "messages"]
            },
            "description": "Test validation by sending an invalid email message (missing subject)"
          },
          "response": []
        },
        {
          "name": "Send Duplicate Message (Duplicate Test)",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"channel\": \"email\",\n  \"content\": {\n    \"recipient\": \"user@example.com\",\n    \"subject\": \"Hello World\",\n    \"body\": \"This is a test email message.\"\n  }\n}"
            },
            "url": {
              "raw": "http://localhost:3000/api/messages",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3000",
              "path": ["api", "messages"]
            },
            "description": "Test duplicate detection by sending the same message twice within a short time period"
          },
          "response": []
        }
      ]
    },
    {
      "name": "Environment Tests",
      "description": "Tests for various components of the system",
      "item": [
        {
          "name": "RabbitMQ Management UI",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "http://localhost:15672/",
              "protocol": "http",
              "host": ["localhost"],
              "port": "15672",
              "path": [""]
            },
            "description": "Access the RabbitMQ Management UI (login with guest/guest)"
          },
          "response": []
        },
        {
          "name": "Kibana Dashboard",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "http://localhost:5601/",
              "protocol": "http",
              "host": ["localhost"],
              "port": "5601",
              "path": [""]
            },
            "description": "Access the Kibana dashboard for log visualization"
          },
          "response": []
        }
      ]
    }
  ],
  "event": [
    {
      "listen": "prerequest",
      "script": {
        "type": "text/javascript",
        "exec": [
          ""
        ]
      }
    },
    {
      "listen": "test",
      "script": {
        "type": "text/javascript",
        "exec": [
          "// Store messageId from responses for use in subsequent requests",
          "if (pm.response.code === 201 || pm.response.code === 200) {",
          "    try {",
          "        const responseJson = pm.response.json();",
          "        if (responseJson.messageId) {",
          "            pm.environment.set(\"messageId\", responseJson.messageId);",
          "            console.log(\"Stored messageId: \" + responseJson.messageId);",
          "        }",
          "    } catch (e) {",
          "        console.error(\"Failed to parse response: \" + e);",
          "    }",
          "}"
        ]
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000",
      "type": "string"
    },
    {
      "key": "messageId",
      "value": "",
      "type": "string"
    }
  ]
}

```
