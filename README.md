# ClinicOS

**AI-powered operating system for clinics**

ClinicOS is a software platform designed to centralize clinic operations and integrate artificial intelligence directly into daily workflows.

The project combines a modular backend, a web application, multi-tenant data architecture and AI-powered services to support areas such as patient management, scheduling, conversations, operational tasks, CRM, financial monitoring and clinical assistance.

The goal is not to build another chatbot, but to create an operational layer where AI can interact with structured business data and assist real workflows.

> **Status:** Active development / MVP → V1

---

## What ClinicOS Does

ClinicOS brings multiple operational workflows into a single platform:

* **Patient Management** — centralized patient information and longitudinal history.
* **Scheduling** — appointment creation, management and operational follow-up.
* **Task Center** — operational tasks with priorities, statuses and deadlines.
* **Inbox & Conversations** — centralized communication and message processing.
* **AI Copilot** — AI-assisted workflows built around structured application data.
* **Clinical Assistance** — audio transcription and AI-assisted consultation workflows.
* **CRM** — lead classification and follow-up automation.
* **Financial Overview** — revenue and lost-revenue analysis based on scheduling data.
* **Multi-tenancy** — isolated data and operational contexts for different clinics.

---

## AI Layer

Artificial intelligence is part of the application architecture rather than an isolated feature.

The backend contains dedicated abstractions for AI providers and an orchestration layer responsible for coordinating AI-powered workflows.

Current implementations include:

* OpenAI API integration
* LLM-based application workflows
* Audio transcription with OpenAI Whisper
* AI-generated insights and suggestions
* Semantic and episodic memory structures
* AI tools exposed through the application layer
* Guardrails for medical-related AI workflows

The project is designed around provider abstractions, allowing AI integrations to evolve without coupling the entire application to a single implementation.

---

## Architecture

The backend follows a modular architecture inspired by **Clean Architecture and Domain-Driven Design**, with clear separation between application, domain-facing interfaces and infrastructure concerns.

```text
clinic-os/
│
├── api/
│   ├── prisma/
│   │   └── migrations/
│   │
│   └── src/
│       ├── application/
│       │   ├── interfaces/
│       │   ├── services/
│       │   ├── useCases/
│       │   └── workers/
│       │
│       ├── infrastructure/
│       │   ├── billing/
│       │   ├── llm/
│       │   ├── persistence/
│       │   └── socket/
│       │
│       ├── interfaces/
│       │   ├── http/
│       │   └── cron/
│       │
│       └── modules/
│           ├── ai/
│           ├── conversations/
│           └── memory/
│
├── web/
│   └── src/
│       ├── features/
│       ├── hooks/
│       ├── pages/
│       ├── services/
│       └── store/
│
└── docs/
```

The backend uses dependency injection, application services, use cases, background workers and provider abstractions to keep business logic separated from infrastructure implementations.

---

## Technology Stack

### Backend

* **TypeScript**
* **Node.js**
* **Express**
* **Prisma**
* **PostgreSQL**
* **Redis**
* **BullMQ**
* **Socket.IO**
* **JWT**
* **Stripe**

### Artificial Intelligence

* **OpenAI API**
* **LLMs**
* **OpenAI Whisper**
* AI orchestration layer
* Semantic and episodic memory

### Frontend

* **React**
* **TypeScript**
* **Vite**
* **React Router**
* **TanStack Query**
* **Zustand**
* **Tailwind CSS**
* **Recharts**
* **Socket.IO Client**

### Engineering

* Jest
* Supertest
* Playwright
* Docker
* Git

---

## Core Architecture

### AI Orchestration

AI-related behavior is isolated in a dedicated module responsible for coordinating models, tools and application context.

```text
Application
    │
    ▼
AI Orchestrator
    │
    ├── LLM Provider
    ├── AI Tools
    ├── Semantic Memory
    └── Application Context
```

This approach makes it possible to evolve AI capabilities without distributing model-specific logic throughout the application.

### Background Processing

Long-running and asynchronous operations are handled through workers and queues using Redis and BullMQ.

```text
HTTP Request
     │
     ▼
Application Service
     │
     ▼
Queue
     │
     ▼
Worker
     │
     ▼
External Service / Database
```

### Real-time Communication

The system includes Socket.IO infrastructure for real-time events and synchronization between backend and frontend.

---

## Implemented Modules

### Patient 360

A longitudinal patient view combining appointments, memories and relevant patient information into a single interface.

### Consultation Copilot

A clinical workflow that captures microphone audio, sends it to the backend and integrates with OpenAI Whisper for transcription. The resulting information can be used as input for AI-assisted workflows.

### CRM

A visual Kanban-based workflow for follow-ups and lead management, including intelligent lead classification.

### Task Center

Operational task management with priorities, status and deadlines.

### Financial Copilot

Financial dashboards including estimated monthly revenue and lost revenue derived from scheduling data.

### Scheduling

Appointment management through dedicated API endpoints and frontend workflows.

---

## Multi-Tenancy

ClinicOS is designed around a multi-tenant model.

Data and operational contexts are associated with a tenant, allowing multiple clinics to use the same application architecture while maintaining logical separation between their data.

This architecture also provides a foundation for integrating external services on a per-tenant basis.

---

## Running Locally

### Backend

```bash
cd api

npm install

npm run dev
```

### Frontend

```bash
cd web

npm install

npm run dev
```

### Database

The backend includes Prisma migrations and Docker-based infrastructure commands:

```bash
npm run infra:up
npm run prisma:generate
npm run prisma:migrate
```

See the project configuration and documentation for environment-specific settings.

---

## Testing

The backend includes automated tests using Jest and Supertest.

```bash
cd api

npm test
```

The project also includes browser testing infrastructure through Playwright.

---

## Engineering Principles

The project is developed around a few core principles:

* separation of business logic from infrastructure
* provider abstractions for external integrations
* explicit application use cases
* asynchronous processing for background workloads
* tenant-aware data handling
* testable modules
* integration of AI with structured application context

The architecture is intentionally designed to allow the system to evolve without tightly coupling business logic to individual infrastructure providers.

---

## Current Limitations

ClinicOS is still under active development.

Some areas are intentionally being evolved toward a more complete production architecture, particularly around real-time audio processing, vector-based memory and additional AI capabilities.

The current implementation already provides the architectural foundation and several functional workflows, while these areas continue to mature.

---

## Project Direction

The long-term direction of ClinicOS is to make AI a native operational layer for clinics.

Instead of treating artificial intelligence as a separate chatbot interface, the platform is designed to connect AI with:

**patients → conversations → appointments → tasks → clinical workflows → CRM → financial data**

This creates a foundation for AI systems that can understand context, interact with business workflows and assist users throughout the clinic's operation.

---

## Author

**Davie Schimidt Fonseca**

Information Systems student at UNICAMP.

GitHub: [@daviesf](https://github.com/daviesf)
LinkedIn: [davie-schimidt](https://linkedin.com/in/davie-schimidt)
