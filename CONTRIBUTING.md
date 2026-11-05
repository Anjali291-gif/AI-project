# Contributing to FreightAI

Thank you for your interest in contributing to FreightAI — Intelligent Freight Forecasting & Vessel Chartering System!

This document explains how to set up your development environment, the branching strategy, coding standards, and the pull request process.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Branching Strategy](#branching-strategy)
5. [Coding Standards](#coding-standards)
6. [Commit Message Guidelines](#commit-message-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Reporting Bugs](#reporting-bugs)
9. [Requesting Features](#requesting-features)
10. [Testing Requirements](#testing-requirements)

---

## Code of Conduct

This project is built for Smart India Hackathon 2026. All contributors are expected to:

- Be respectful and constructive in all communications
- Focus on what is best for the project and the user
- Accept constructive criticism of your work graciously
- Use welcoming and inclusive language

---

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub first, then:
git clone https://github.com/<your-username>/AI-project.git
cd AI-project
```

### 2. Set Up Python Backend

```bash
# Create a virtual environment
python -m venv venv

# Activate it (Windows Command Prompt)
venv\Scripts\activate

# Activate it (Windows PowerShell)
venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend/requirements.txt
```

### 3. Set Up Frontend

```bash
cd frontend
npm install
cd ..
```

### 4. Verify Everything Works

```bash
# Terminal 1 — Start backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2 — Start frontend
cd frontend && npm run dev

# Terminal 3 — Run tests
python backend/tests/test_api.py
```

Expected: All 6 backend tests pass, frontend loads at http://localhost:5173.

---

## Development Workflow

1. **Create a branch** from `main` for your feature or fix (see [Branching Strategy](#branching-strategy))
2. **Make your changes** — keep commits small and focused
3. **Write or update tests** in `backend/tests/test_api.py`
4. **Verify tests pass** — `python backend/tests/test_api.py`
5. **Verify frontend builds** — `npm --prefix frontend run build`
6. **Push your branch** to your fork
7. **Open a Pull Request** against `main`

---

## Branching Strategy

| Branch Pattern | Purpose | Example |
|---|---|---|
| `main` | Production-ready code | — |
| `feature/<name>` | New features | `feature/real-ais-integration` |
| `fix/<issue>` | Bug fixes | `fix/forecast-csv-export` |
| `docs/<name>` | Documentation only | `docs/update-api-reference` |
| `refactor/<name>` | Code refactoring | `refactor/split-main-py` |
| `chore/<name>` | Build, deps, tooling | `chore/upgrade-xgboost` |

**Rules:**
- Never commit directly to `main`
- Keep feature branches short-lived (merge within a few days)
- Delete your branch after the PR is merged
- Rebase on `main` before opening a PR to avoid merge conflicts

---

## Coding Standards

### Python (Backend)

- **Style**: Follow PEP 8. Use 4-space indentation.
- **Type hints**: All new functions must have type annotations.
- **Docstrings**: Add a one-line docstring for all new public functions.
- **Pydantic models**: Define request/response schemas using `pydantic.BaseModel` with `Field()` validators.
- **Error handling**: Use `HTTPException` with meaningful status codes and `detail` messages.
- **No secrets in code**: Never hardcode API keys, tokens, or passwords.

```python
# Good example
def predict_rate_ml(req: ForecastRequest) -> Dict[str, Any]:
    """Run ML inference and return predicted freight rate with CI bounds."""
    ...
```

### TypeScript/React (Frontend)

- **Style**: 2-space indentation, single quotes for strings.
- **Types**: All component props must have explicit TypeScript interfaces. No `any` unless unavoidable.
- **Components**: Use functional components with React hooks — no class components.
- **State**: Keep state as local as possible. Only lift state when genuinely shared.
- **Naming**: PascalCase for components, camelCase for variables/functions, SCREAMING_SNAKE_CASE for constants.
- **CSS**: Use Tailwind utility classes only. No inline `style` attributes for layout (use Tailwind). Exceptions: dynamic values computed from data (e.g., chart widths).
- **Imports**: Group in order: React, third-party libraries, project services/types, relative components.

```tsx
// Good example
interface MetricCardProps {
  label: string;
  value: string;
  accent?: string;
  theme: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, accent = 'text-cyan-500', theme }) => (
  ...
);
```

### General Rules

- Do not remove existing features or UI without discussion
- Do not add new npm packages without discussion — check if an existing library covers the need
- Do not add Python packages without updating `backend/requirements.txt`
- Keep the dark maritime theme consistent — use existing Tailwind classes and color tokens

---

## Commit Message Guidelines

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

**Types:**

| Type | Use When |
|---|---|
| `feat` | New feature for the user |
| `fix` | Bug fix |
| `docs` | Documentation changes only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructuring, no feature/bug change |
| `test` | Adding or updating tests |
| `chore` | Build system, dependency updates |
| `perf` | Performance improvements |

**Examples:**

```
feat(forecast): add weather risk index slider to forecast form

fix(modal): prevent AIS map from overlapping charter optimizer modal

docs(api): add /api/models/predict-test endpoint documentation

test(backend): add test coverage for chartering-decision endpoint

chore(deps): upgrade xgboost to 2.1.0
```

**Rules:**
- Subject line: 50 characters or fewer
- Use imperative mood: "add" not "added" or "adds"
- Reference issues where relevant: `fix(csv): correct date format in export (closes #12)`

---

## Pull Request Process

1. **Title**: Use Conventional Commits format: `feat(scope): description`
2. **Description**: Fill in the PR template:
   - What does this PR do?
   - Which issue does it close? (if applicable)
   - How was it tested?
   - Screenshots (for UI changes)

3. **Checklist before requesting review:**
   - [ ] All 6 backend tests pass: `python backend/tests/test_api.py`
   - [ ] Frontend production build succeeds: `npm --prefix frontend run build` (0 errors)
   - [ ] No secrets or credentials in any file
   - [ ] `requirements.txt` updated if new Python packages added
   - [ ] `package.json` updated if new npm packages added
   - [ ] Existing UI features are not broken

4. **Review**: At least one review approval is required before merging.
5. **Squash merge** is preferred to keep `main` history clean.

---

## Reporting Bugs

Open a GitHub Issue with the **Bug Report** template:

```
**Bug Description:**
Clear description of what happens vs. what should happen.

**Steps to Reproduce:**
1. Go to '...'
2. Click '...'
3. See error

**Environment:**
- OS: Windows 11
- Python: 3.11
- Node: 20.x
- Browser: Chrome 120

**Expected Behavior:**
What should have happened?

**Actual Behavior:**
What actually happened? Include console errors / stack traces.

**Screenshots:**
If applicable.
```

---

## Requesting Features

Open a GitHub Issue with the **Feature Request** template:

```
**Feature Summary:**
One-line description of the feature.

**Problem it Solves:**
What maritime use-case or user workflow does this address?

**Proposed Solution:**
How would you implement this?

**Alternatives Considered:**
Any other approaches you evaluated?

**Additional Context:**
Mockups, references, or related issues.
```

---

## Testing Requirements

### Backend Tests

All backend changes must pass the existing test suite:

```bash
python backend/tests/test_api.py
# Expected: ALL BACKEND API TESTS PASSED SUCCESSFULLY! (6/6)
```

For new endpoints, add a test function to `backend/tests/test_api.py` following this pattern:

```python
def test_new_endpoint():
    res = client.get("/api/new-endpoint")
    assert res.status_code == 200
    data = res.json()
    assert "expected_field" in data
    print("New endpoint test passed!")
```

### Frontend Build Check

```bash
npm --prefix frontend run build
# Expected: ✓ built in X.XXs (0 TypeScript errors)
```

---

## Project-Specific Guidelines

### ML Models

- **Never** modify `backend/ml/models/*.joblib` manually
- To retrain: `python backend/ml/train_models.py` (regenerates both models + metadata)
- Document any changes to training parameters in your PR description
- Verify metrics don't regress from: R² ≥ 0.96, MAE ≤ 1.2, MAPE ≤ 8%

### Dataset

- The synthetic dataset (`backend/data/historical_freight_data.csv`) is generated by `train_models.py`
- Do not manually edit the CSV
- If changing the data generation logic, clearly document the change and expected impact on metrics

### API Contract

- Existing API response schemas are relied upon by the frontend — breaking changes require simultaneous frontend updates
- New fields can be added safely (additive changes)
- Removing or renaming fields is a breaking change — coordinate with frontend

### Theme

- Always use existing Tailwind classes from the maritime color palette
- Background: `bg-[#0b0f17]`, Card: `bg-[#121824]`, Accent: `text-cyan-500`, `border-cyan-500/30`
- Do not introduce new color tokens without discussion

---

## Questions?

If you're unsure about anything, open a GitHub Discussion or comment on the relevant issue.

Happy shipping! 🚢
