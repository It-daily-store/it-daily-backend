# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Express + TypeScript + MongoDB (Mongoose) REST API for an e-commerce IT product shop ("it-shop-server" / IT Daily). Also includes Socket.IO for real-time notifications and BullMQ/Redis for background jobs (product/deal cache sync, transactional emails).

## Commands (PowerShell)

```powershell
npm run dev              # start dev server (ts-node-dev, auto-restart) at src/server.ts
npm run build            # tsc compile to dist/
npm start                # run compiled server: node dist/server.js
npm run build:prod       # tsc using .env.prod (env-cmd)
npm run start:prod       # run dist/server.js using .env.prod
npm run lint             # eslint src --ext .ts
npm run seed             # run src/scripts/seed.ts via ts-node
```

There is no real test suite (`npm test` is a stub that exits with an error) — do not assume Jest/Vitest exists.

Redis (required for BullMQ queues; also used for product/deal caching):

```powershell
npm run redis:up         # docker run redis on port 6380
npm run redis:stop
npm run redis:rm
```

Env vars live in `.env` (dev) / `.env.prod` (prod, loaded via `env-cmd`), read in `src/app/config/index.ts`. Never hardcode secrets — reference `config.<key>` or `process.env.<KEY>`. Notable keys: `PORT`, `DATABASE_URL`, `REDIS_URL`, `CLOUD_NAME`/`CLOUD_API_KEY`/`CLOUD_API_SECRET` (Cloudinary), `ACCESS_SECRET`/`REFRESH_SECRET`/`OTP_SECRET`/`VERIFY_SECRET` + `JWT_ACCESS_EXPIRES_IN`/`JWT_REFRESH_EXPIRES_IN`/`OTP_EXPIRES_IN`, `BCRYPT_HASH_ROUNDS`, `SMTP_USER`/`SMTP_APP_PASSWORD`, `STRIPE_SECRET_KEY`/`STRIPE_PUBLISH_KEY`/`STRIPE_ENDPOINT_SECRET`, `CLIENT_URL`, `ENVIRONMENT`.

## Architecture

### Module pattern (`src/app/modules/<name>/`)

Every feature lives in its own folder under `src/app/modules/`, named `<name>.<kind>.ts`. Not every module has every file, but the full set for a CRUD-ish module is:

- `<name>.interface.ts` — TypeScript types (`T<Name>`), often plus enums (e.g. `roles.interface.ts` has `EAppFeatures`).
- `<name>.model.ts` — Mongoose `Schema`/`model`. Soft-delete via `isDeleted: boolean` (not real deletes) is the repo-wide convention. Statics such as `User.isUserExistsByEmail` / `User.matchUserPassword` live here.
- `<name>.validation.ts` — Zod object schemas, exported as a `{ create...ValidationSchema, update...ValidationSchema }` namespace object (e.g. `CategoryValidations`, `authValidations`).
- `<name>.service.ts` — all business logic and DB access (`...FromDB` / `...IntoDB` naming convention), throws `AppError` on failure, returns plain data (no response shaping). Exported as a `<Name>Services` object of named functions.
- `<name>.controller.ts` — thin HTTP layer: wraps each handler in `catchAsync`, extracts `req.body`/`req.params`/`req.query`/`req.user`, calls the matching service function, and replies via `sendResponse`. Exported as a `<Name>Controller`/`<Name>Controllers` object.
- `<name>.route.ts` (or `.routes.ts`, inconsistent) — an Express `Router()` wiring URL + HTTP verb to `checkPermission`/`validateRequest` middleware, then the controller method. Exported as `<Name>Routes`.
- Optional `<name>.utils.ts` — pure helpers used only within the module (e.g. `auth.utils.ts` → `createToken`, `category.utils.ts`, `gallery.utils.ts`).
- Optional `<name>.queue.ts` / `<name>.redis.ts` — BullMQ `Queue`/`Worker` pairs and Redis cache read/write helpers for modules with background sync (`product`, `deals`).

To add a new feature module: create these files following this exact naming/shape, then register the router in `src/app/routes/index.ts`.

### Request lifecycle

`src/server.ts` connects Mongoose, starts the HTTP server, wraps it with Socket.IO, then boots BullMQ workers → `src/app.ts` builds the Express app (CORS with an explicit origin allowlist, raw-body Stripe webhook route mounted before `express.json()`, cookie-parser) → mounts everything at `/api/v1` via `src/app/routes/index.ts`.

`src/app/routes/index.ts` is the single place all module routers are registered; it applies `validateAuth()` globally to every module *except* `/auth` and `/customer`, so per-route auth in individual `.route.ts` files is layered on top of that (usually via `checkPermission`).

Per-request flow inside a module: `route → validateRequest(zodSchema) → checkPermission(feature, accessType) → controller (catchAsync-wrapped) → service → model`.

### Error handling

- `AppError` (`src/app/errors/AppError.ts`) — `new AppError(statusCode, message, stack?)`; throw this from services/middleware for any expected failure.
- `catchAsync` (`src/app/utils/catchAsync.ts`) — wrap every controller/middleware handler; forwards thrown/rejected errors to `next(err)`.
- `globalErrorHandler` (`src/app/middleware/globalErrorHandler.ts`, mounted last in `app.ts`) — dispatches by error type: `ZodError` → `handleZodError`, Mongoose `CastError`/`ValidationError`, Mongo duplicate key (`code === 11000`) → `handleDuplicateError`, `MulterError`, then `AppError`, then generic `Error`. Each `handle*Error.ts` in `src/app/errors/` normalizes to `{ statusCode, message, errorSources }`. Stack traces are only included when `config.node_environment === "development"`.
- `notFound` middleware runs after the error handler for unmatched routes (404).

### Auth & authorization

- JWT access/refresh tokens created via `createToken` (`auth.utils.ts`) with per-purpose secrets (`ACCESS_SECRET`, `REFRESH_SECRET`, `OTP_SECRET`). Passwords hashed with bcrypt (`BCRYPT_HASH_ROUNDS`).
- `validateAuth()` (`src/app/middleware/auth.ts`, default export) — reads the raw JWT from the `Authorization` header (no `Bearer ` stripping), verifies it with `verifyToken`, loads the user via `User.isUserExistsByEmail`, and attaches `req.user = { id, email, userRole, userData }` (typed globally in `src/app/interface/customRequest.ts`). Applied globally in `routes/index.ts` for all non-auth/customer modules.
- `validateCustomer()` (same file) — extra guard restricting to `req.user.userRole === "customer"`.
- `checkPermission(feature, accessType)` (`src/app/middleware/checkPermission.ts`) — role-based access control on top of `validateAuth()`. Looks up the user's `Roles` document, short-circuits for `isMasterAdmin`, blocks deleted/inactive accounts, then checks `role.permissions[].access[accessType]` for the given `feature` string (features enumerated in `roles.interface.ts` as `EAppFeatures`; access types are CRUD keys of `TCrud`, e.g. `"create" | "read" | "update" | "delete"`).
- `socketAuth.ts` provides the equivalent JWT check (`ValidateIOAuth`) for Socket.IO connections, populating `socket.user`.
- Refresh tokens are set as an httpOnly-style cookie (`res.cookie(...)`) rather than returned in the body; access tokens are returned in the JSON response body (and also cookied on user login).

### Response format

All success responses go through `sendResponse(res, { success, statusCode, message, data, pagination? })` (`src/app/utils/sendResponse.ts`), which always emits `{ statusCode, success, message, data, pagination }` (pagination defaults to `[]`). Error responses (from `globalErrorHandler`) use the shape `{ statusCode, success: false, message, errorSources, stack? }`. Controllers never call `res.json` directly for success paths — always use `sendResponse`.

### Data access / query conventions

- List endpoints typically build queries with `QueryBuilder` (`src/app/builder/queryBuilder.ts`): chain `.search(fields).filter(excludeFields).sort().paginate().fields()`, then `await builder.modelQuery` plus `builder.total` for pagination metadata passed back via `sendResponse`'s `pagination` field.
- Soft delete (`isDeleted: true`) is used instead of actually removing documents across modules (`Category`, `User`, etc.) — always filter `isDeleted: false` in read queries.
- Real-time UI sync: after create/update/delete, many services emit an event over Socket.IO via `sendSourceSocket` (`src/app/utils/sendSourceSocket.ts`) and write an in-app notification via `notification` module helpers (`buildNotifications`/`addNotifications`), targeting connected admin clients while excluding the acting admin (`ignore: [admin._id]`).
- Redis-cached read paths (`product`, `deals`) are kept in sync by BullMQ workers defined in the module's `.queue.ts`, triggered on server boot (`src/server.ts`) and on mutation.

## Code comments

Do not comment everywhere. Add a comment only where the code cannot explain itself (a non-obvious workaround, a business rule, a deliberate edge case), and keep it to a single line.
