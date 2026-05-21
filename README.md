# Zones Modern Workplace Sales Motion Tool

An AI-powered guided sales companion for Zones LLC sellers. Profiles customers, validates readiness, and generates structured solution recommendations and deployment roadmaps for Modern Workplace services (MDM, Autopilot, Clean Image, TSC Provisioning).

---

## Architecture

```
mw-motion-tool/
├── frontend/          React + TypeScript (Vite) single-page app
│   └── src/
│       ├── components/steps/   6-step wizard components
│       ├── hooks/              useMotionState — wizard state management
│       ├── types/              Shared TypeScript types
│       └── utils/api.ts        Azure Functions API client
└── backend/           Azure Functions v4 (Node.js + TypeScript)
    └── src/functions/
        └── motion.ts           POST /api/motion — AI call handler
```

**Data flow:** Browser → Azure Functions → Azure AI Foundry (OpenAI-compatible) → structured JSON response → UI updates

---

## Prerequisites

- Node.js 20+
- Azure Functions Core Tools v4: `npm install -g azure-functions-core-tools@4`
- An Azure AI Foundry resource with a model deployment (default: `gpt-5.4`)

---

## Setup

### 1. Clone and install dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Configure the backend

```bash
cd backend
cp local.settings.json.example local.settings.json
```

Edit `local.settings.json` and fill in your values:

```json
{
  "Values": {
    "AZURE_FOUNDRY_ENDPOINT": "https://YOUR-RESOURCE.openai.azure.com/",
    "AZURE_FOUNDRY_KEY": "YOUR-API-KEY",
    "AZURE_OPENAI_DEPLOYMENT": "gpt-5.4"
  }
}
```

> `local.settings.json` is in `.gitignore`. **Never commit API keys.**

### 3. Configure the frontend (optional for local dev)

The frontend proxies `/api/*` to `http://localhost:7071` via Vite, so no `.env` file is needed for local development. For a deployed environment, create `frontend/.env.local`:

```
VITE_API_BASE_URL=https://your-function-app.azurewebsites.net
```

---

## Running Locally

You need two terminals:

**Terminal 1 — Backend (Azure Functions):**
```bash
cd backend
npm run start
# Functions running at: http://localhost:7071/api/motion
```

**Terminal 2 — Frontend (Vite):**
```bash
cd frontend
npm run dev
# App running at: http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000).

---

## The 6-Step Sales Motion

| Step | Name | Purpose |
|------|------|---------|
| 1 | **Customer Profile** | Collect industry, environment, MDM platform, device volume, timeline |
| 2 | **Readiness Gate** | Validate Autopilot + Intune production readiness. Routes to Pro Services if not ready |
| 3 | **Deployment Model** | AI recommends Clean Image vs OEM, Pre-Provisioning vs User-Driven |
| 4 | **Engagement Triggers** | Confirm DW SA assigned, TSC call scheduled, Cloud Services engaged |
| 5 | **First Article** | Determine test order requirements and AI-generated validation criteria |
| 6 | **Roadmap Output** | Structured next-step plan with owner assignments and SOW readiness score |

### Business Rules (always enforced)

- TSC engagement is **required** before any device order
- Clean Image is **always preferred** over OEM Ready Image
- Autopilot enrollment is **required** for modern provisioning
- First Article is **required** before production-scale orders
- If Autopilot or Intune is not production-ready → **route to Pro Services**

---

## Deploying to Azure

### Backend (Azure Functions)

```bash
cd backend
npm run build

# Create Function App in Azure portal or via CLI, then:
func azure functionapp publish YOUR-FUNCTION-APP-NAME
```

Set these Application Settings in the Azure portal (not in code):
- `AZURE_FOUNDRY_ENDPOINT`
- `AZURE_FOUNDRY_KEY`
- `AZURE_OPENAI_DEPLOYMENT`

### Frontend (Static Web App or Azure Storage)

```bash
cd frontend
npm run build
# Output in frontend/dist/ — deploy to Azure Static Web Apps or blob storage
```

For Azure Static Web Apps, set `VITE_API_BASE_URL` as a build environment variable pointing to your Function App URL.

---

## Swapping the AI Model

The backend calls any Azure OpenAI-compatible endpoint. To switch from `gpt-5.4` to `claude-sonnet-4-6`:

1. Deploy `claude-sonnet-4-6` in your Azure AI Foundry resource
2. Update `AZURE_OPENAI_DEPLOYMENT=claude-sonnet-4-6` in your settings
3. Update `local.settings.json` locally

No code changes needed — the deployment name is fully configuration-driven.

---

## Development Notes

- The Vite dev server proxies `/api` to `http://localhost:7071` — start the Functions host first
- The frontend has no runtime dependency on the AI backend; all steps are functional with structured inputs even if AI calls fail
- `local.settings.json` is gitignored — use the `.example` file as a template
- Print/PDF export uses the browser's native print dialog with print-specific CSS
