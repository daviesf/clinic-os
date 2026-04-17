## Architecture Refactoring (Evolution API)

The backend has been refactored to use the **Provider Pattern** for WhatsApp integration.

- **Legacy Removed:** `whatsapp-web.js` and Puppeteer dependencies have been removed.
- **New Provider:** `EvolutionProvider` connects to an external Evolution API instance via HTTP.
- **Service Layer:** `WhatsAppService` wraps the provider, allowing for easy swapping of providers in the future.
- **Dependency Injection:** `server.ts` handles the wiring of services.


## Setup Instructions

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Update `.env` with:
    ```
    DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/clinic_os"
    EVOLUTION_BASE_URL="http://your-evolution-api:8080"
    EVOLUTION_API_KEY="your-api-key"
    ```

3.  **Start the Server**
    ```bash
    npm run dev
    ```

## Project Structure

- `src/server.ts`: Entry point with dependency injection.
- `src/providers/whatsapp`: implementations of `IWhatsAppProvider` (currently `EvolutionProvider`).
- `src/modules/whatsapp`: Service layer.
- `src/modules/conversations`: Logic for handling incoming messages.
- `src/modules/scheduling`: Appointment management.

