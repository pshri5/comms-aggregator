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
git clone https://github.com/pshri5/comms-aggregator-buncha.git
cd comms-aggregator-buncha
```
2. Start all services:
```
docker-compose up -d
```
3. Access the services:
   - Task Router API: http://localhost:3000
   - RabbitMQ Management UI: http://localhost:15672 (guest/guest)
   - Kibana Dashboard: http://localhost:5601

### Example API Usage

#### Send a message:
```
curl -X POST http://localhost:3000/api/messages   -H "Content-Type: application/json"   -d '{
    "channel": "email",
    "content": {
      "recipient": "user@example.com",
      "subject": "Hello World",
      "body": "This is a test message."
    }
  }'
```
#### Check message status:
```
curl http://localhost:3000/api/messages/MESSAGE_ID
```
You can then check logs in Kibana to trace the full journey of the message through the system.
