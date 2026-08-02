Implementation Plan: WIN-DIA Production-Ready Backend Foundation

This plan outlines the creation of the backend foundation layer inside src/backend/ for the WIN-DIA E-Commerce application, following the finalized database schema in DATABASE_ARCHITECTURE.md and strict SOLID software engineering principles.

User Review Required

IMPORTANT

All components are strictly interfaces, types, constants, configuration loaders, error classes, utility functions, middleware, validation infrastructure and shared helpers.
Zero business logic, zero Supabase database queries, zero SQL, zero repository implementations, zero service implementations and zero API routes are included.
The backend will use the project's existing root tsconfig.json. Do NOT create a separate src/backend/tsconfig.json, as this is a Next.js application.
Open Questions

None.

The database architecture is considered finalized.

Proposed Changes

Create the following production-ready backend foundation.
src/backend/

├── config/
│   ├── env.config.ts
│   ├── supabase.config.ts
│   └── index.ts
│
├── constants/
│   ├── app.constants.ts
│   ├── http-status.constants.ts
│   ├── event.constants.ts
│   └── index.ts
│
├── errors/
│   ├── app-error.ts
│   ├── domain.errors.ts
│   └── index.ts
│
├── types/
│   ├── common.types.ts
│   ├── api-response.types.ts
│   ├── dto.types.ts
│   ├── result.types.ts
│   └── index.ts
│
├── models/
│   ├── profile.model.ts
│   ├── product.model.ts
│   ├── order.model.ts
│   ├── cart.model.ts
│   ├── shipment.model.ts
│   └── index.ts
│
├── repositories/
│   ├── base.repository.ts
│   ├── product.repository.ts
│   ├── cart.repository.ts
│   ├── wishlist.repository.ts
│   ├── order.repository.ts
│   ├── payment.repository.ts
│   ├── shipment.repository.ts
│   ├── review.repository.ts
│   ├── coupon.repository.ts
│   └── index.ts
│
├── services/
│   ├── auth.service.ts
│   ├── product.service.ts
│   ├── cart.service.ts
│   ├── wishlist.service.ts
│   ├── order.service.ts
│   ├── payment.service.ts
│   ├── shipment.service.ts
│   ├── review.service.ts
│   ├── coupon.service.ts
│   └── index.ts
│
├── middleware/
│   ├── auth.middleware.ts
│   ├── admin.middleware.ts
│   ├── error.middleware.ts
│   ├── async-handler.ts
│   └── index.ts
│
├── validation/
│   ├── base.schema.ts
│   ├── validator.util.ts
│   └── index.ts
│
├── providers/
│   ├── container.ts
│   └── index.ts
│
├── utils/
│   ├── logger.ts
│   ├── pagination.ts
│   ├── helpers.ts
│   ├── currency.ts
│   └── index.ts
│
└── index.ts
Backend Configuration
env.config.ts

Validate every required environment variable using Zod.

Required variables:
NODE_ENV

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

RAZORPAY_KEY_ID

RAZORPAY_KEY_SECRET

SMTP_HOST

SMTP_PORT

SMTP_USER

SMTP_PASSWORD
Expose a strongly typed immutable env object.

supabase.config.ts

Provide reusable factory methods for:

Browser Client
Server Client
Admin (Service Role) Client

No business logic.

No queries.

Constants

Create centralized application constants.

Examples
Pagination

Currency

Order Prefix

Default Limits

Regex

File Limits
Event Constants

Create strongly typed application events.

Examples

ORDER_CREATED

ORDER_CANCELLED

PAYMENT_CREATED

PAYMENT_SUCCESS

PAYMENT_FAILED

SHIPMENT_CREATED

SHIPMENT_DELIVERED

REVIEW_APPROVED

REVIEW_REJECTED

Avoid magic strings throughout the project.

Types
Common Types

Create reusable utility types.

Examples

Nullable<T>

Optional<T>

DeepPartial<T>

RequestContext

UserContext

BaseEntity
Result Type

Create reusable result wrappers.

Result<T,E>

Success<T>

Failure<E>

Services should be able to return typed success/failure objects instead of relying exclusively on exceptions.

Domain Models

Instead of duplicating frontend entity definitions unnecessarily, define domain models that can eventually be shared across frontend and backend.

Keep these separate from DTOs.

Examples

ProductModel

OrderModel

ProfileModel

CartModel

ShipmentModel
DTO Types

Create request/response DTOs only.

Examples

CreateOrderDTO

AddCartItemDTO

UpdateWishlistDTO

CreateReviewDTO
API Response Types

Standardize responses.

ApiResponse<T>

ApiErrorResponse

PaginatedResponse<T>
Error Infrastructure

Create

AppError

ValidationError

AuthenticationError

AuthorizationError

ConflictError

InventoryError

PaymentError

NotFoundError

All operational errors should inherit from AppError.

Logger

Create a logger abstraction.

Expose methods such as

logger.debug()

logger.info()

logger.warn()

logger.error()

Internally it may use console initially, but it must be replaceable later by Pino, Winston, Sentry or any structured logging provider without changing application code.

Utilities

Create reusable helper functions.

Examples

generateOrderNumber()

generateSKU()

slugify()

formatCurrency()

calculatePagination()

buildPaginatedResponse()
Middleware

Create reusable middleware.

Authentication

Admin Authorization

Global Error Handler

Async Handler

The async handler should eliminate repetitive try/catch blocks in future API routes.

Validation

Use Zod.

Create reusable primitive schemas.

Examples

UUID

Email

Phone

Slug

Currency

Pagination

Price

Quantity

Future validators should compose these primitives.

Repository Contracts

Create repository contracts directly under

repositories/

Each file should export its interface.

Example

product.repository.ts

export interface ProductRepository { }

Avoid unnecessary interfaces/ nesting.

Repositories should contain no implementation at this stage.

Service Contracts

Create service contracts directly under

services/

Each service exports its interface only.

Examples

ProductService

CartService

OrderService

ShipmentService

PaymentService

No implementation.

Lightweight Dependency Container

Create a simple provider/container layer.

Purpose:

centralize dependency construction
simplify testing
avoid manual object creation

Do not introduce any external dependency injection framework.

Keep it lightweight.

Next.js 16 + Vercel Serverless Architecture Requirements

The application will be deployed on Vercel using Next.js 16.

The backend must be designed specifically for a serverless environment, not a long-running Node.js server.

Design every component with Vercel serverless limitations in mind.

Runtime Compatibility

Only use APIs that are fully compatible with Next.js and Vercel.

Avoid assumptions that the backend runs as a persistent Node.js process.

Do not rely on:

long-running background processes
in-memory application state
singleton state
local file storage
cron jobs inside the application
WebSockets (unless using a managed external provider)
persistent queues running inside the application

Assume every request executes in an isolated serverless invocation.

Stateless Architecture

All services must be completely stateless.

Never rely on:

global variables

memory caches

singleton mutable state

process memory

Any state must live in:

PostgreSQL
Supabase Storage
Redis (future)
External managed services
File System

Do not write files to disk.

Do not use local uploads.

Use Supabase Storage for all uploaded assets.

The application filesystem should be treated as read-only.

Background Processing

Do not implement background workers inside Next.js.

If asynchronous processing is required in the future, design the code so it can later integrate with services such as:

Inngest
Trigger.dev
Upstash QStash
Supabase Edge Functions
Vercel Cron
Other managed queue/event systems

Keep the business logic independent so these can be added without major refactoring.

API Routes

Use Next.js Route Handlers (app/api) compatible with Next.js 16.

Do not design APIs assuming Express or Fastify.

Do not introduce Express-specific middleware or patterns.

Middleware and utilities should work naturally with the Next.js Request/Response APIs.

Long Running Operations

Avoid requests that execute for a long time.

Where appropriate:

keep endpoints small
split expensive operations
make operations idempotent
prepare workflows for future asynchronous execution
Database Connections

Use Supabase's client libraries.

Do not manually manage PostgreSQL connection pools.

Do not assume persistent database connections.

Environment Variables

Follow Next.js conventions.

Public variables:

NEXT_PUBLIC_*

Server-only variables:

SUPABASE_SERVICE_ROLE_KEY

RAZORPAY_KEY_SECRET

SMTP_PASSWORD

Never expose server secrets to the frontend.

Server Components

Respect Next.js architecture.

Use:

Server Components where appropriate
Client Components only when required
Server Actions only if they simplify the architecture

Avoid unnecessary "use client" directives.

Caching

Design for Next.js caching.

Use:

fetch caching where appropriate
revalidate
route segment caching

Do not build a custom in-memory cache.

Future distributed caching should use Redis or another external cache.

Production Scalability

The backend should scale horizontally without modification.

No component should depend on a specific server instance.

Every request should be executable independently.

Production Compatibility Review

Before implementation, verify that every generated component is compatible with:

Next.js 16
Vercel Serverless Functions
Supabase
PostgreSQL
TypeScript
Serverless deployment

If any proposed implementation assumes a traditional Express or persistent Node.js server, replace it with the appropriate Next.js/Vercel-compatible approach before generating code.


Never generate code based on Express.js, NestJS, Fastify, Koa, or traditional persistent Node.js server assumptions unless explicitly requested. Prefer idiomatic Next.js 16 Route Handlers, Server Components, and Vercel-compatible serverless patterns throughout the implementation.

Verification Plan
Type Checking

Use the root project configuration.

Run

npx tsc --noEmit

Ensure:

no TypeScript errors
all barrel exports resolve
no circular imports
Code Verification

Verify that the generated foundation contains:

No SQL
No Supabase queries
No API routes
No repository implementations
No service implementations
No business logic
No checkout logic
No payment logic

Only reusable production infrastructure.

