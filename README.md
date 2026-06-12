# Aether Flow Swarm

Aether Flow Swarm is a state-of-the-art multi-agent swarm deployment pipeline tailored for automated project scoping, compliance security audits, and financial ledger generation. The system orchestrates collaborative intelligence to structure projects dynamically with safe human-in-the-loop validation barriers.

## Key Features

1. **Document Ingestion Parser**
   - Supports native ingestion of `.docx`, `.pdf`, `.txt`, `.csv`, `.md`, and `.json` requirements files.
   - Text extracted from document templates is automatically piped into the agent orchestrator.

2. **In-Depth Multi-Agent Pipeline**
   - **Scoping Agent**: Analyzes raw requirements, creates a unique context-driven project title, and builds an estimated budget and duration matrix.
   - **Risk & Compliance Agent**: Audits generated scoping structures for compliance checks (such as GDPR, SOC2) and evaluates dynamic risk scores from 0 to 100.
   - **Financial Ledger Agent**: Calculates concrete milestone schedules, maps runway metrics (burn-rate), and locks final configurations.

3. **Input Sanitization Engine (Security Firewall)**
   - Pre-scans raw inputs or parsed documents for dangerous injection patterns before they reach the LLM parser.
   - Detects and filters **Script Injections** (`<script>`, `onload` inline events), **SQL Injection patterns** (`UNION SELECT`, `OR 1=1`), and **Shell Command Exploits** (`sudo apt`, `rm -rf`, `curl | sh`), alongside a `100,000` character buffer overload limit.

4. **Compliance Rules Engine (5-Framework Audit)**
   - Automated rule-by-rule compliance evaluation engine with **28 structured rules** across 5 regulatory frameworks:
     - **GDPR** — Data processing basis, right to erasure, portability, breach notification, data minimisation, cross-border transfers.
     - **SOC2** — Logical access controls, audit trails, incident response, change management, encryption, availability SLAs.
     - **HIPAA** — PHI safeguards, Business Associate Agreements, minimum necessary standard, breach notification.
     - **PCI-DSS** — Cardholder data protection, network segmentation, vulnerability management, access controls.
     - **ISO 27001** — Security policy, risk assessment, asset management, business continuity.
   - Auto-detects applicable frameworks from project document keywords.
   - Evaluates operational thresholds (budget limits, timeline overruns, scope creep).
   - Generates compliance summaries and enriches LLM prompts with concrete regulatory context.

5. **Human-in-the-Loop Override Panel**
   - Workflow suspensions halt at budget boundaries or compliance faults, allowing administrators to override target values and provide override justification audits before resuming the downstream pipeline.

---

## Technical Stack
- **Frontend**: Next.js App Router (TypeScript, TailwindCSS)
- **Backend**: Node.js & Express (ESModules)
- **Database**: SQLite with Prisma ORM
- **LLM Integrations**: AIML API / Llama-3-8B-Instruct models
- **Collaboration**: Band.ai messaging notifications

---

## Setup Instructions

### Backend Configuration
1. Navigate to the `/server` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup your environment variables by creating a `.env` file (do not push to source control):
   ```env
   DATABASE_URL="file:./dev.db"
   AIML_API_KEY="<YOUR_AIML_API_KEY>"
   FEATHERLESS_API_KEY="<YOUR_FEATHERLESS_API_KEY>"
   BAND_SCOPING_AGENT_KEY="scoping_agent_api_token"
   BAND_RISK_AGENT_KEY="risk_agent_api_token"
   BAND_LEDGER_AGENT_KEY="ledger_agent_api_token"
   BAND_RISK_AGENT_ID="risk_agent_user_id"
   BAND_LEDGER_AGENT_ID="ledger_agent_user_id"
   BAND_SCOPING_AGENT_ID="scoping_agent_user_id"
   ```
4. Run migrations:
   ```bash
   npx prisma db push
   ```
5. Start backend:
   ```bash
   npm run dev
   ```

### Frontend Configuration
1. Navigate to the `/client` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start frontend:
   ```bash
   npm run dev
   ```
