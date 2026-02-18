# Auth Migration Plan: PAT → GitHub OAuth

> Research and implementation plan for replacing Personal Access Token (PAT) authentication with GitHub OAuth, so users no longer need to manually create a PAT.

## Table of Contents

- [Current State](#current-state)
- [Problem](#problem)
- [Options Evaluated](#options-evaluated)
- [Recommended Approach](#recommended-approach)
- [Architecture Overview](#architecture-overview)
- [Implementation Plan](#implementation-plan)
- [Files That Need to Change](#files-that-need-to-change)
- [New Files to Create](#new-files-to-create)
- [Migration Strategy](#migration-strategy)
- [Security Considerations](#security-considerations)
- [Open Questions](#open-questions)
- [References](#references)

---

## Current State

The app currently uses **GitHub Personal Access Tokens (PATs)** for authentication:

| Aspect | Current Implementation |
|---|---|
| **Auth method** | User manually creates a PAT on GitHub and pastes it into the app |
| **Required scopes** | `repo`, `read:user` |
| **Storage** | `localStorage` under key `codeagentflow:github-pat` |
| **API client** | `@octokit/rest` initialized with the PAT |
| **Validation** | Calls `GET /user` (octokit `users.getAuthenticated()`) |
| **Key files** | `PatModal.tsx`, `useAuth.ts`, `github.ts`, `storage.ts` |

### Files Involved in Auth

| File | Role |
|---|---|
| `src/components/auth/PatModal.tsx` | UI: modal that collects the PAT from the user |
| `src/hooks/useAuth.ts` | State management: stores token, validates, handles logout |
| `src/services/github.ts` | API: initializes Octokit with PAT, provides `verifyPat()` |
| `src/utils/storage.ts` | Persistence: `getPat()`/`setPat()`/`removePat()` in localStorage |
| `src/App.tsx` | Gate: shows `PatModal` when not authenticated |

---

## Problem

Users must manually:
1. Navigate to GitHub Settings → Developer Settings → Personal Access Tokens
2. Create a new token with the correct scopes (`repo`, `read:user`)
3. Copy/paste the token into the app

This is **friction-heavy**, error-prone (wrong scopes, expired tokens), and unfamiliar to non-developer users. We want a **"Sign in with GitHub"** experience instead.

---

## Options Evaluated

### Option 1: GitHub OAuth App (Web Application Flow)

**How it works:** Standard OAuth 2.0 Authorization Code flow — user clicks "Sign in with GitHub", is redirected to GitHub to authorize, then redirected back with a code that is exchanged for an access token.

| Pros | Cons |
|---|---|
| Familiar "Sign in with GitHub" UX | Requires a backend/serverless function for the token exchange (client secret must be kept server-side) |
| Broad scope model (matches current `repo`, `read:user` needs) | GitHub's token endpoint does NOT support CORS — cannot exchange code from browser directly |
| Tokens don't expire unless revoked | Broad scopes only (all-or-nothing for `repo`) |
| Simple to reason about | |

**CORS blocker:** GitHub's `POST /login/oauth/access_token` endpoint does **not** return CORS headers. A pure SPA cannot complete this flow without a backend proxy.

### Option 2: GitHub App (User OAuth Flow with PKCE)

**How it works:** Register a GitHub App. Users install the app on their account/repos. Authentication uses OAuth + PKCE (no client secret needed in theory).

| Pros | Cons |
|---|---|
| Fine-grained permissions (per-repo, read/write separately) | Still requires backend proxy — CORS blocks the token exchange endpoint even with PKCE (as of early 2026) |
| Short-lived tokens (1 hour, auto-refreshable) | More complex setup: app registration, installation flow, token refresh logic |
| Acts as app or user (bot identity for automation) | Users must "install" the app on their account, which is an extra step |
| Higher rate limits | |
| GitHub's recommended approach going forward | |

**CORS blocker:** Same as Option 1. GitHub's token endpoint lacks CORS support even for PKCE flows (as of Feb 2026).

### Option 3: GitHub OAuth Device Flow

**How it works:** App displays a code + URL. User visits the URL in any browser, enters the code, and authorizes. App polls GitHub until authorization completes.

| Pros | Cons |
|---|---|
| No client secret needed (only `client_id`) | UX is less seamless — user must visit a separate URL and enter a code |
| Designed for public/untrusted clients | GitHub's device flow endpoints also lack CORS — needs a CORS proxy |
| Works without redirect URIs | Polling adds complexity |
| Library support: `@octokit/auth-oauth-device` v7.1.3 | |

**CORS blocker:** GitHub's `POST /login/device/code` and token polling endpoints also lack CORS. A proxy is required.

### Option 4: Azure Static Web Apps Built-in GitHub Auth

**How it works:** Azure SWA has pre-configured GitHub OAuth built in. Users navigate to `/.auth/login/github`, authenticate, and user info is available at `/.auth/me`.

| Pros | Cons |
|---|---|
| Zero backend code needed — fully managed by Azure | Only provides user identity (login, name, etc.), NOT a GitHub API access token |
| Extremely simple setup | Cannot use the token to make GitHub API calls (read/write repos) — **this is a deal-breaker** |
| Free with Azure SWA | PR preview environments have callback URL issues |
| Automatic session management | Locks app to Azure SWA hosting |

**Deal-breaker:** Azure SWA built-in auth gives you a user identity, but it does **NOT** provide a GitHub API access token with `repo` scope. Since this app needs to read/write Markdown files to repos via the GitHub API, this option alone is insufficient.

### Option 5: Hybrid — Azure SWA Built-in Auth + Custom API Function

Combine Azure SWA's built-in auth with a custom API function (Azure Functions) to handle the OAuth token exchange.

| Pros | Cons |
|---|---|
| Leverages existing Azure SWA hosting | Adds complexity (need to manage two auth flows) |
| API functions handle secret securely | Not straightforward to chain SWA auth into a full GitHub API token |
| No separate proxy to deploy | |

---

## Recommended Approach

### **GitHub OAuth App + Azure SWA Serverless API Proxy**

This is the recommended approach because it provides the best balance of user experience, security, and implementation complexity given the constraints.

#### Why This Approach?

1. **Best UX**: One-click "Sign in with GitHub" button → redirect → done
2. **Compatible with existing infra**: The app already deploys to Azure Static Web Apps. SWA supports an `/api` folder with Azure Functions as serverless APIs out of the box
3. **Secure**: Client secret stays server-side in the Azure Function; never exposed to the browser
4. **Minimal new dependencies**: Mostly configuration + a small serverless function
5. **Keeps existing Octokit usage**: Once we have the token, all existing `@octokit/rest` code works unchanged

#### Flow Overview

```
┌─────────────┐      1. Click "Sign in"       ┌──────────────┐
│   Browser    │ ─────────────────────────────► │   GitHub     │
│   (SPA)      │                                │   OAuth      │
│              │ ◄───────────────────────────── │   Server     │
│              │   2. Redirect back with ?code  │              │
└──────┬───────┘                                └──────────────┘
       │
       │ 3. POST /api/auth/callback { code }
       ▼
┌──────────────┐    4. Exchange code for token  ┌──────────────┐
│  Azure SWA   │ ─────────────────────────────► │   GitHub     │
│  API Function│                                │   OAuth      │
│  (/api)      │ ◄───────────────────────────── │   Server     │
│              │    5. Returns access_token      │              │
└──────┬───────┘                                └──────────────┘
       │
       │ 6. Return token to SPA
       ▼
┌─────────────┐
│   Browser   │  7. Store token, init Octokit, fetch user
│   (SPA)     │
└─────────────┘
```

---

## Architecture Overview

### New Components

| Component | Technology | Purpose |
|---|---|---|
| **GitHub OAuth App** | GitHub Settings | Registered OAuth App with `client_id` and `client_secret` |
| **API: `/api/auth/callback`** | Azure Function (Node.js) | Exchanges authorization code for access token (keeps secret server-side) |
| **API: `/api/auth/token-refresh`** | Azure Function (Node.js) | _(Future)_ Refreshes tokens if using GitHub App tokens |
| **Login component** | React | Replaces `PatModal` with "Sign in with GitHub" button |
| **OAuth callback handler** | React (route or component) | Handles the redirect from GitHub, extracts code, calls API |

### Environment Variables (Server-side only)

| Variable | Where | Purpose |
|---|---|---|
| `GITHUB_CLIENT_ID` | Azure SWA App Settings + SPA config | OAuth App client ID (public) |
| `GITHUB_CLIENT_SECRET` | Azure SWA App Settings only | OAuth App client secret (NEVER in browser) |
| `GITHUB_OAUTH_REDIRECT_URI` | Azure SWA App Settings | Callback URL (e.g., `https://yourapp.azurestaticapps.net/auth/callback`) |

---

## Implementation Plan

### Phase 1: Setup & Infrastructure

- [ ] **1.1** Register a GitHub OAuth App at https://github.com/settings/developers
  - Homepage URL: your deployed app URL
  - Authorization callback URL: `https://<your-domain>/auth/callback`
  - Note down `Client ID` and `Client Secret`
- [ ] **1.2** Create an `/api` directory for Azure Functions
  - Initialize with `func init api --worker-runtime node --language typescript`
  - Or create manually with the right structure
- [ ] **1.3** Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to Azure SWA App Settings
- [ ] **1.4** Update `staticwebapp.config.json` for routing (callback URL → SPA, API routes)

### Phase 2: Serverless API Function

- [ ] **2.1** Create `/api/auth/callback/index.ts` — Azure Function that:
  - Receives `{ code }` from the SPA
  - POSTs to `https://github.com/login/oauth/access_token` with `client_id`, `client_secret`, `code`
  - Returns the `access_token` to the SPA
  - Handles errors (invalid code, expired code, etc.)
- [ ] **2.2** Add input validation and error handling
- [ ] **2.3** Add CORS configuration (only allow requests from the app's origin)
- [ ] **2.4** Write tests for the API function

### Phase 3: Frontend — New OAuth Login Flow

- [ ] **3.1** Create a new `LoginModal` component (replaces `PatModal`) with:
  - "Sign in with GitHub" button that redirects to GitHub's OAuth authorize URL
  - Still keep "Use Personal Access Token" as a fallback option for power users / local development
  - Loading state while OAuth completes
- [ ] **3.2** Create an OAuth callback handler (component or route):
  - Extracts `code` and `state` from URL query params on redirect
  - Calls `/api/auth/callback` with the code
  - Stores the returned access token
  - Redirects to the main app
- [ ] **3.3** Add PKCE support (code_verifier / code_challenge):
  - Generate `code_verifier` before redirect
  - Store in `sessionStorage` (not localStorage — only needed for one request)
  - Include `code_challenge` in the authorize URL
  - Send `code_verifier` to the API function for the token exchange
- [ ] **3.4** Add `state` parameter for CSRF protection:
  - Generate random `state` before redirect
  - Store in `sessionStorage`
  - Validate on callback

### Phase 4: Frontend — Auth State Updates

- [ ] **4.1** Update `useAuth` hook:
  - Support both OAuth token and PAT
  - New `authenticateWithOAuth(code)` method
  - Keep existing `authenticate(pat)` for fallback
  - Token storage: rename storage key from `github-pat` to `github-token` (tokens are equivalent once obtained)
- [ ] **4.2** Update `storage.ts`:
  - Add `getToken()`/`setToken()`/`removeToken()` helpers (or rename existing PAT helpers)
  - Keep backward compatibility: if old `github-pat` key exists, migrate it
- [ ] **4.3** Update `github.ts`:
  - Rename `initGitHubClient(pat)` → `initGitHubClient(token)` (works the same way — Octokit accepts any token)
  - Rename `verifyPat()` → `verifyToken()` (functionally identical)
- [ ] **4.4** Update `App.tsx`:
  - Replace `PatModal` with new `LoginModal`
  - Handle OAuth callback route/state

### Phase 5: Testing & Validation

- [ ] **5.1** Unit tests for:
  - OAuth URL construction (correct params, PKCE challenge, state)
  - Callback handler (code extraction, API call, token storage)
  - Auth state management (OAuth flow + PAT fallback)
- [ ] **5.2** Integration tests:
  - Mock the `/api/auth/callback` endpoint
  - Full OAuth flow simulation
- [ ] **5.3** E2E tests (Playwright):
  - Login with mocked OAuth (intercept GitHub redirect)
  - PAT fallback flow still works
- [ ] **5.4** Manual testing:
  - Test with actual GitHub OAuth App (dev environment)
  - Test error cases (user denies access, invalid code, network errors)

### Phase 6: Documentation & Cleanup

- [ ] **6.1** Update `README.md`: new auth setup instructions, remove PAT-only instructions
- [ ] **6.2** Update `AGENTS.md`: document new auth flow, environment variables, API function
- [ ] **6.3** Update `.github/copilot-instructions.md`: reflect new auth approach
- [ ] **6.4** Update `TESTING.md`: document testing approach for OAuth
- [ ] **6.5** Add deployment docs: how to configure the GitHub OAuth App, set env vars in Azure

---

## Files That Need to Change

| File | Change |
|---|---|
| `src/components/auth/PatModal.tsx` | Replace with new `LoginModal` (keep PAT as fallback option) |
| `src/hooks/useAuth.ts` | Add OAuth flow support, rename methods |
| `src/services/github.ts` | Rename PAT-specific functions to generic token functions |
| `src/utils/storage.ts` | Add/rename token helpers, add migration from old key |
| `src/App.tsx` | Use new LoginModal, handle OAuth callback |
| `src/types/github.ts` | Add OAuth-related types if needed |
| `src/components/index.ts` | Update exports |
| `staticwebapp.config.json` | Add routing rules for OAuth callback and API |
| `README.md` | Update auth documentation |
| `AGENTS.md` | Update auth documentation |

## New Files to Create

| File | Purpose |
|---|---|
| `api/auth/callback/index.ts` | Azure Function: exchanges OAuth code for token |
| `api/auth/callback/function.json` | Azure Function binding configuration |
| `api/package.json` | API dependencies |
| `api/host.json` | Azure Functions host config |
| `api/local.settings.json` | Local dev settings (gitignored) |
| `src/components/auth/LoginModal.tsx` | New login UI with OAuth + PAT fallback |
| `src/components/auth/OAuthCallback.tsx` | Handles redirect from GitHub |
| `src/utils/oauth.ts` | PKCE helpers, state generation, URL construction |
| `staticwebapp.config.json` | SWA routing configuration |

---

## Migration Strategy

### Backward Compatibility

1. **Keep PAT as a fallback option** — power users and local dev can still paste a PAT
2. **Auto-migrate stored PATs** — if `codeagentflow:github-pat` exists in localStorage, treat it as a valid token (it is — PATs and OAuth tokens work identically with Octokit)
3. **Gradual rollout** — can feature-flag the OAuth option initially

### Token Equivalence

A key insight: **GitHub PATs and OAuth access tokens are functionally identical** for API calls. Both are passed as `Authorization: token <token>` headers. The entire `@octokit/rest` API layer works the same with either token type. This means:

- `initGitHubClient(token)` works with both PATs and OAuth tokens
- `verifyPat()` / `verifyToken()` works with both — it just calls `GET /user`
- No changes needed to any API functions in `github.ts` beyond renaming

---

## Security Considerations

| Concern | Mitigation |
|---|---|
| Client secret exposure | Stored only in Azure Function App Settings; never in browser or source code |
| Token storage in localStorage | Same as current PAT approach — acceptable for this use case. Could upgrade to `sessionStorage` or in-memory only in the future |
| CSRF on OAuth callback | Use `state` parameter: generate random value before redirect, validate on callback |
| Authorization code interception | Use PKCE (`code_challenge` + `code_verifier`) to bind the code to the originating client |
| Token scope over-granting | Request only `repo` and `read:user` scopes (same as current PATs) |
| API function abuse | CORS restriction to app origin only; validate input; rate limiting |

---

## Open Questions

1. **Custom domain?** — OAuth callback URLs must be pre-registered. If using PR preview environments (dynamic URLs), we may need a wildcard or a fixed callback URL that handles routing.
2. **Token expiration?** — GitHub OAuth App tokens don't expire, but GitHub App tokens do (1 hour). If we later upgrade to a GitHub App, we'll need refresh logic.
3. **Multiple environments?** — Need separate OAuth Apps for dev/staging/production, or a single app with multiple callback URLs.
4. **Local development?** — Developers running `npm run dev` on `localhost:5173` will need a way to authenticate. Options:
   - Register `http://localhost:5173/auth/callback` as an additional callback URL in the OAuth App
   - Use PAT fallback for local dev
   - Use Azure SWA CLI to emulate the API locally

---

## References

- [GitHub Docs: Differences between GitHub Apps and OAuth Apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps)
- [GitHub Docs: Authorizing OAuth Apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [GitHub Blog: PKCE support for OAuth and GitHub App authentication (July 2025)](https://github.blog/changelog/2025-07-14-pkce-support-for-oauth-and-github-app-authentication/)
- [GitHub Community: Authenticating with a SPA without a relay](https://github.com/orgs/community/discussions/40077)
- [GitHub Community: Support PKCE flow for OAuth apps](https://github.com/orgs/community/discussions/15752)
- [GitHub Community: Any auth flow currently supported for SPA without backend?](https://github.com/octokit/octokit.js/issues/2616)
- [Octokit: @octokit/auth-oauth-device (npm)](https://www.npmjs.com/package/@octokit/auth-oauth-device)
- [Azure Docs: Add an API to Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/add-api)
- [Azure Docs: Authentication in Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/authentication-authorization)
- [Andrea Zonca: Authenticate to GitHub in the Browser with Device Flow](https://www.zonca.dev/posts/2025-01-29-github-auth-browser-device-flow)
- [Nango: GitHub App vs GitHub OAuth](https://www.nango.dev/blog/github-app-vs-github-oauth)
