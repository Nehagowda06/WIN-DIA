Part 1: Architecture + ER Diagram + Design Philosophy
Part 2: Core Tables (Profiles → Products)
Part 3: Commerce Tables (Wishlist, Cart, Orders)
Part 4: Supporting Tables (Payments, Shipments, Coupons, etc.)
Part 5: Indexes, Triggers, Helper Functions
Part 6: API Layer & Business Logic
Part 7: RLS, Security, Storage, Production Readiness

Part 1 — Architecture, ER Diagram & Design Philosophy

Project: WIN-DIA E-Commerce Backend
Database: PostgreSQL (Supabase)
Authentication: Supabase Auth
Storage: Supabase Storage
Frontend: Next.js 16
Backend: Supabase + Server Actions / API Routes (future)
Architecture Style: Layered Architecture (Presentation → API → Business Logic → Repository → Database)

1. Introduction

The WIN-DIA backend is designed as a production-ready, scalable e-commerce database built on PostgreSQL using Supabase.

Rather than treating the database as simple storage, it acts as the single source of truth for every business process including:

Authentication
Product Catalogue
Inventory
Cart
Wishlist
Checkout
Orders
Payments
Shipments
Reviews
CMS content
Admin operations

The schema has been normalized to reduce redundancy while remaining practical for frontend performance.

The overall design favors:

Data consistency
Referential integrity
Security
Horizontal scalability
Easy API development
Future extensibility
2. High-Level System Architecture
                ┌────────────────────────┐
                │     Next.js Frontend    │
                │                        │
                │  Shop                  │
                │  Product Page          │
                │  Cart                  │
                │  Wishlist              │
                │  Checkout              │
                │  Profile               │
                └────────────┬───────────┘
                             │
                             │
                    API / Server Actions
                             │
                             ▼
                ┌────────────────────────┐
                │ Business Logic Layer    │
                │                        │
                │ Cart Service           │
                │ Product Service        │
                │ Payment Service        │
                │ Inventory Service      │
                │ Wishlist Service       │
                │ Shipment Service       │
                └────────────┬───────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │ Repository Layer        │
                │                        │
                │ Products Repository    │
                │ Orders Repository      │
                │ Cart Repository        │
                │ User Repository        │
                └────────────┬───────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │ Supabase PostgreSQL     │
                │                        │
                │ Tables                 │
                │ Views                  │
                │ Functions              │
                │ Triggers               │
                │ Policies               │
                └────────────────────────┘
3. Architectural Philosophy

The backend intentionally separates responsibilities into layers.

Presentation Layer

Responsible only for:

Rendering UI
Form validation
Sending API requests
Displaying responses

It never performs business logic.

API Layer

Responsible for:

Authentication
Request validation
Calling services
Returning responses

The API should never directly manipulate SQL.

Business Logic Layer

This is where application rules live.

Examples:

Can user order?
Can coupon be applied?
Is inventory available?
Calculate taxes
Create shipment
Verify payment

This layer contains the intelligence of the application.

Repository Layer

Responsible only for database access.

Example:

getProduct()

createOrder()

updateInventory()

insertReview()

No calculations.

No validations.

Only SQL operations.

Database Layer

Responsible for:

storing data
relationships
constraints
indexes
triggers
transactions

The database guarantees integrity regardless of the application.

4. Design Principles
Principle 1
Normalize where necessary

Instead of

Products

Name
Flavor
Weight
Price
Stock

Variants are separated.

Products

↓

Product Variants

↓

Prices
↓

Inventory

This prevents duplicated products.

Principle 2
Snapshot transactional data

Current price may change.

But an order must preserve the price at purchase.

Therefore

orders

↓

order_items

↓

price_snapshot

This guarantees historical accuracy.

Principle 3
Immutable History

Status changes are never overwritten.

Instead

Pending

↓

Paid

↓

Packed

↓

Shipped

↓

Delivered

are stored as separate rows.

Nothing is lost.

Principle 4
Separate Business Entities

Products

≠

Variants

≠

Reviews

≠

Orders

≠

Wishlist

Each has its own lifecycle.

Principle 5
Authentication ≠ Profile

Supabase Auth stores

email

password

provider

Application stores

role

name

phone

avatar

inside Profiles.

5. Database Categories

The database can be divided into logical modules.

User Module

Handles

login
registration
addresses
profiles
admin sessions

Tables

profiles

addresses

login_attempts

otp_verifications

admin_sessions
Product Module

Handles

products
variants
categories
images
banners

Tables

products

categories

product_images

product_variants

banners
Shopping Module

Responsible for

wishlists

carts

cart_items
Checkout Module

Responsible for

orders

order_items

payments

coupons
Shipping Module

Responsible for

shipments

shipment_tracking_events

order_status_history
CMS Module

Responsible for

page_content

settings

contact_messages
6. Complete Entity Relationship Diagram (Conceptual)
                    auth.users
                         │
                         │ 1
                         │
                         ▼
                    profiles
                    (PK id)
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    addresses      wishlists        product_reviews
         │               │
         │               │
         │               ▼
         │           products
         │              │
         │              │
         │      ┌───────┼────────────┐
         │      │       │            │
         │      ▼       ▼            ▼
         │ product_images product_variants order_items
         │                    │
         │                    │
         ▼                    ▼
      orders ------------ cart_items
         │                    │
         ▼                    ▼
 order_status_history      carts
         │
         ▼
     shipments
         │
         ▼
shipment_tracking_events
7. Commerce Lifecycle

The backend follows one continuous lifecycle.

Visitor

↓

Registers

↓

Profile Created

↓

Browse Products

↓

Open Variant

↓

Add To Wishlist

↓

Add To Cart

↓

Checkout

↓

Payment

↓

Order Created

↓

Inventory Updated

↓

Shipment Created

↓

Tracking Events

↓

Delivery

↓

Review

Every arrow corresponds to multiple database operations.

8. Why Product Variants Exist

Imagine these products.

Garlic

100g

₹45

Stock 20
Garlic

200g

₹80

Stock 15

If variants didn't exist, these would become two separate products.

Instead

Product

↓

Garlic Thins

↓

Variant A

100g

↓

Variant B

200g

Benefits:

cleaner catalog
reusable reviews
reusable images
easier filtering
easier inventory
9. Why Cart References Variants

Earlier design

cart

↓

Flavor

Weight

Price

Problems

If

Garlic

becomes

Garlic Premium

all carts become inconsistent.

Current design

variant_id

↓

Variant

↓

Product

↓

Price

↓

Stock

↓

SKU

Everything stays synchronized.

10. Why Snapshots Exist

Imagine

Product

₹60

Customer buys.

Next week

Price becomes

₹80

Order should still show

₹60

Therefore

order_items

price_snapshot

stores the historical price.

Same philosophy can apply to:

cart
invoices
payment receipts
11. Referential Integrity

Almost every table uses Foreign Keys.

Example

wishlist.product_id

↓

products.id

Impossible to save wishlist pointing to a deleted product.

Database guarantees consistency.

12. Scalability Strategy

The current schema supports:

✔ thousands of products

✔ tens of thousands of users

✔ hundreds of thousands of orders

✔ multiple images

✔ multiple variants

✔ multiple addresses

✔ multiple reviews

✔ multiple shipments

without structural changes.

Future additions like:

gift cards
subscriptions
international shipping
warehouses
multiple currencies
loyalty points
referrals
product bundles
AI recommendations

can be introduced by adding new tables rather than modifying existing ones.

13. Security Philosophy

The database is designed with a zero-trust approach:

Every user is authenticated through Supabase Auth.
Every application user has a corresponding profiles row.
Sensitive operations are protected by Row Level Security (RLS).
Users can only access their own carts, wishlists, addresses, and orders.
Administrative operations require elevated roles and separate authorization logic.
Database constraints prevent invalid or orphaned data even if an API contains a bug.

This means security is enforced at the database level, not just in application code.

14. Architectural Goals

This backend is optimized to achieve the following goals:

Goal	Implementation
Data Integrity	Primary keys, foreign keys, constraints
Performance	Indexed lookup columns
Scalability	Normalized schema with variants and child tables
Security	RLS + Supabase Auth
Maintainability	Layered architecture and separation of concerns
Auditability	Status history, payment events, snapshots
Extensibility	Modular tables for future features
Production Readiness	Triggers, helper functions, indexes, policies

Part 2 — Core Tables (Profiles → Products)
Overview

The Core Tables form the foundation of the WIN-DIA e-commerce backend. These tables define:

Users
Categories
Products
Product Images
Product Variants

Almost every other table in the system references one or more of these entities.

Conceptually:

auth.users
      │
      ▼
 profiles

categories
      │
      ▼
 products
      │
      ├──────────────┐
      ▼              ▼
product_images   product_variants
1. Profiles Table
Purpose

The profiles table stores application-specific user information.

Supabase Authentication stores login credentials, while profiles stores information needed by the application.

This separation is intentional.

Authentication and user metadata evolve independently.

Relationship
auth.users
      │
      │ 1 : 1
      ▼
profiles

Every authenticated user has exactly one profile.

Table Structure
Column	Type	Description
id	uuid	Primary Key, FK → auth.users(id)
email	text	User email
full_name	text	User display name
phone	text	Contact number
avatar_url	text	Profile image
role	text	customer/admin
created_at	timestamptz	Account creation
updated_at	timestamptz	Last modification
Primary Key
id UUID PRIMARY KEY

Using UUIDs prevents predictable IDs.

Example

Instead of

user/15

you get

2f1d99af-cd17...

Much safer.

Foreign Key
profiles.id

↓

auth.users.id

This guarantees

No profile can exist without authentication.

Why not duplicate passwords?

Because Supabase already handles

passwords
providers
refresh tokens
sessions

The application should never store them.

Role Field

Current values

customer

admin

Future values could include

warehouse

support

manager

super_admin

without changing schema.

Relationships
profiles

↓

addresses

↓

wishlists

↓

orders

↓

reviews

↓

cart

↓

shipments (admin)

Profiles are the parent of almost every user-owned table.

Query Examples

Load profile

SELECT *
FROM profiles
WHERE id = auth.uid();

Get all admins

SELECT *
FROM profiles
WHERE role='admin';
Index Recommendation

Usually

PRIMARY KEY(id)

is enough.

If admin dashboard grows,

INDEX(role)

may be useful.

Future Improvements

Possible additions

birthday

gender

preferred_language

reward_points

marketing_opt_in

loyalty_tier
2. Categories Table
Purpose

Categories organize products.

Without categories,

every product would require manual searching.

Example

Gluten Free

↓

Products
Everyday Range

↓

Products

Future

Festival Specials

Kids

Protein Snacks

Limited Edition
Table Structure
Column	Type
id	uuid PK
parent_id	uuid FK nullable
name	text
slug	text UNIQUE
description	text
image_url	text
is_active	boolean
sort_order	integer
created_at	timestamptz
Parent Category

Allows hierarchy.

Example

Snacks

↓

Healthy Snacks

↓

Gluten Free

Without changing schema.

Relationship

categories

↓

categories.parent_id

Self-reference.

Slug

Instead of

category/13

URL becomes

/gluten-free

Better for

SEO
readability
Relationships
categories

↓

products

One category

Many products

Example Queries

Load category

SELECT *

FROM categories

WHERE slug='gluten-free';

Products in category

SELECT *

FROM products

WHERE category_id=...
Existing Index
idx_categories_parent

Helps nested category lookups.

Future Extensions
category banners

SEO title

SEO description

featured category

icon
3. Products Table

The most important table.

Everything revolves around Products.

Purpose

Stores product-level information.

Not flavor.

Not weight.

Not stock.

Those belong to Variants.

Think

Garlic Thins

Product

Variants

100g

200g

500g
Table Structure
Column	Type
id	uuid PK
category_id	uuid FK
variant_group_id	uuid
sku	text UNIQUE
name	text
slug	text UNIQUE
short_description	text
long_description	text
is_active	boolean
is_featured	boolean
thumbnail_url	text
created_at	timestamptz
updated_at	timestamptz
Why separate Products and Variants?

Imagine

Garlic

100g

₹50
Garlic

200g

₹85

Without variants

two products.

With variants

one product.

Cleaner.

Category Relationship
categories

↓

products

Many products

One category.

Variant Group

Useful when multiple products belong together.

Example

Thins

↓

Garlic

Onion

Curry Leaf
SKU

Unique stock identifier.

Example

THN-ON-100

THN-GA-100

THN-CL-100

Warehouse operations use SKU.

Customers never see it.

Slug

Friendly URLs

/products/garlic-thins

instead of

product/18
Active Flag

Instead of deleting

is_active=false

Product disappears

History remains.

Relationships
products

↓

variants

↓

images

↓

reviews

↓

wishlist

↓

cart

↓

order_items
Existing Indexes

Already present

idx_products_category

Used for category pages.

idx_products_active

Used for

WHERE is_active=true
idx_products_variant_group

Used for grouping.

Example Queries

Load category

SELECT *

FROM products

WHERE category_id=...

Load featured

SELECT *

FROM products

WHERE is_featured=true;

Search

SELECT *

FROM products

WHERE name ILIKE '%garlic%';

Future search

Could use

Postgres Full Text Search

or

pg_trgm
4. Product Images Table

One product

Many images.

Why?

Instead of

Front

Back

Nutrition

Lifestyle

Packaging

stored as columns

each image becomes a row.

Unlimited.

Table Structure
Column	Type
id	uuid PK
product_id	uuid FK
image_url	text
alt_text	text
sort_order	integer
is_primary	boolean
created_at	timestamptz
Relationship
products

↓

product_images

One

↓

Many

sort_order

Controls

Gallery order

1

↓

Front
2

↓

Back

etc.

Primary Image
is_primary=true

Product listing loads this image.

No need

LIMIT 1
Example Query
SELECT *

FROM product_images

WHERE product_id=...

ORDER BY sort_order;
Future

360°

Videos

Zoom

AR

without schema changes.

5. Product Variants Table

Variants represent purchasable inventory.

Not products.

Inventory belongs here.

Purpose

Store

flavor
size
stock
SKU
price
Table Structure
Column	Type
id	uuid PK
product_id	uuid FK
flavor	text
net_weight_grams	integer
sku	text UNIQUE
price	numeric
original_price	numeric
count_in_stock	integer
is_active	boolean
created_at	timestamptz
updated_at	timestamptz
Relationship
products

↓

product_variants

One

↓

Many

Why Variant ID is important

Cart stores

variant_id

instead of

flavor

weight

Benefits

No duplicated data
Name changes don't break carts
Price lookup is automatic
Stock lookup is automatic
SKU lookup is automatic
Stock

Inventory lives here.

Never inside Products.

Example

Garlic 100g

Stock 18
Garlic 250g

Stock 5

Independent.

Price

Current selling price.

Order stores snapshot.

Therefore

future price changes

never affect old orders.

Example Query

Available variants

SELECT *

FROM product_variants

WHERE product_id=...

AND is_active=true

AND count_in_stock>0;
Existing Trigger
product_variants_updated_at

Automatically updates

updated_at
Existing Unique Constraint
sku UNIQUE

Warehouse safety.

Existing Index

Primary key

plus

SKU lookup

already sufficient.

Future

INDEX(product_id)

if product catalog grows significantly.

6. Relationships Summary
auth.users
      │
      ▼
profiles

categories
      │
      ▼
products
      │
      ├──────────────┐
      ▼              ▼
product_images   product_variants
7. Design Decisions Summary
Decision	Reason
Separate profiles from auth.users	Authentication and application data have different responsibilities.
Categories support parent-child relationships	Enables nested product hierarchies without schema changes.
Products separated from variants	Avoids duplicate products and supports multiple flavors, weights, and prices.
Product images stored in a child table	Supports unlimited gallery images with ordering.
Inventory stored on variants	Each purchasable option can have independent stock levels.
SKU unique on variants	Ensures every sellable item is uniquely identifiable for warehouse and order processing.
Slugs used for products and categories	Provides SEO-friendly and human-readable URLs.
Soft activation (is_active)	Products/categories can be hidden without losing historical references.
UUID primary keys	Prevents predictable IDs and improves security for public-facing APIs.

Part 3 — Commerce Tables (Wishlists, Carts, Cart Items, Orders, Order Items)
Overview

The Commerce Module represents the core business workflows of the e-commerce platform. It manages the customer's shopping journey from saving products to completing an order.

This module is transactional in nature and emphasizes:

Data consistency
Historical accuracy
Inventory integrity
Auditability
Scalability

It is designed so that every action a customer performs (wishlist, cart, checkout, purchase) is recorded in a normalized and traceable manner.

Commerce Lifecycle
Customer
    │
    ▼
Browse Products
    │
    ▼
Add to Wishlist
    │
    ▼
Add to Cart
    │
    ▼
Modify Cart
    │
    ▼
Checkout
    │
    ▼
Payment
    │
    ▼
Order Created
    │
    ▼
Order Items Created
    │
    ▼
Inventory Updated
    │
    ▼
Shipment Created
Commerce Relationship Diagram
profiles
    │
    ├─────────────┐
    ▼             ▼
wishlists       carts
    │             │
    │             ▼
    │        cart_items
    │             │
    ▼             ▼
 products   product_variants
      │             │
      └─────────────┘
            │
            ▼
         orders
            │
            ▼
       order_items
1. Wishlists Table
Purpose

The wishlists table stores products that a customer wishes to purchase later.

Unlike carts, wishlists are long-term collections.

Products remain even after months.

Table Structure
Column	Type	Description
id	uuid PK	Wishlist Item ID
user_id	uuid FK	Owner
product_id	uuid FK	Saved Product
product_snapshot	jsonb	Optional historical snapshot
created_at	timestamptz	Save time
Relationships
profiles
    │
    ▼
wishlists
    │
    ▼
products

One user

↓

Many wishlist items

One product

↓

Many wishlist entries

Unique Constraint
UNIQUE(user_id, product_id)

Purpose

Prevent duplicate wishlist entries.

Customer cannot save the same product twice.

Why product_snapshot exists

Normally

Wishlist

↓

Product

is enough.

However

Imagine

Product deleted

or

Product renamed.

The snapshot preserves historical metadata if desired.

Current implementation keeps it nullable.

CRUD Operations
Add
Insert Wishlist Item
Remove
Delete Wishlist Item
List
SELECT *
FROM wishlists
WHERE user_id=auth.uid();
Future Improvements

Wishlist folders

Example

Birthday

Christmas

Favorites

Healthy Snacks

Shareable wishlists

Public links

Price-drop notifications

2. Carts Table
Purpose

Represents a customer's active shopping cart.

A customer has one active cart.

The cart contains multiple items.

Relationship
profiles

↓

carts

↓

cart_items
Table Structure
Column	Type
id	uuid PK
user_id	uuid FK
created_at	timestamptz
updated_at	timestamptz
Constraint
UNIQUE(user_id)

Guarantees

One customer

↓

One active cart.

Why separate Cart and Cart Items?

Instead of

Cart

Product1

Product2

Product3

We normalize

Cart

↓

Cart Items

Unlimited products.

Cleaner schema.

Existing Trigger
carts_updated_at

Automatically updates

updated_at
Example Query

Get active cart

SELECT *
FROM carts
WHERE user_id=auth.uid();
3. Cart Items Table
Purpose

Represents individual purchasable items inside a cart.

This is one of the most frequently accessed tables.

Table Structure
Column	Type
id	uuid PK
cart_id	uuid FK
product_id	uuid FK
variant_id	uuid FK
qty	integer
price_snapshot	numeric
created_at	timestamptz
updated_at	timestamptz
Relationships
carts

↓

cart_items

↓

products

↓

product_variants
Why variant_id?

Old design

Flavor

Weight

Problems

Rename flavor

↓

Cart breaks.

Current

variant_id

Advantages

Current price
Current SKU
Current stock
Current weight
Current flavor

All resolved automatically.

Why product_id also exists?

Although variant references product,

keeping product_id

simplifies

joins
analytics
filtering

without another lookup.

Quantity

Constraint

qty>0

Negative quantities impossible.

Price Snapshot

Imagine

Cart

₹60

Tomorrow

₹65

Price snapshot lets checkout verify

Current

vs

Previous

before charging.

CRUD
Add

Insert Cart Item

Update

Increase quantity

Delete

Remove item

Checkout

Convert

↓

Order Items

Existing Trigger
cart_items_updated_at
Example Query
SELECT *
FROM cart_items
WHERE cart_id=...
4. Orders Table
Purpose

Represents a completed purchase.

An order is immutable except for its status.

It becomes the legal transaction record.

Relationship
profiles

↓

orders

↓

order_items
Expected Structure
Column	Type
id	uuid PK
user_id	uuid FK
shipping_address_id	uuid FK
billing_address_id	uuid FK
subtotal	numeric
discount	numeric
tax	numeric
shipping_fee	numeric
total	numeric
payment_status	text
order_status	text
created_at	timestamptz
updated_at	timestamptz
Order Status

Suggested values

Pending

Confirmed

Packed

Shipped

Delivered

Cancelled

Refunded
Payment Status
Pending

Paid

Failed

Refunded
Existing Trigger
orders_updated_at
Important Principle

Never edit

subtotal

tax

shipping

discount

after payment.

These are historical values.

Example

Customer

January

₹399

Product

March

₹450

Order must still show

₹399
5. Order Items Table
Purpose

Stores every product purchased in an order.

Relationship
orders

↓

order_items

↓

product_variants
Expected Structure
Column	Type
id	uuid PK
order_id	uuid FK
product_id	uuid FK
variant_id	uuid FK
quantity	integer
price_snapshot	numeric
product_name_snapshot	text
flavor_snapshot	text
weight_snapshot	integer
Why Snapshots?

Products change.

Orders never should.

Imagine

Garlic Thins

becomes

Roasted Garlic Thins

Customer's invoice should remain

Garlic Thins

at purchase time.

Lifecycle

Cart Item

↓

Checkout

↓

Order Item

↓

Immutable

Inventory Flow

Checkout

↓

Reduce

product_variants.count_in_stock

↓

Create

Order Item

↓

Create

Shipment

Complete Checkout Flow
Customer

↓

Cart

↓

Cart Items

↓

Validate Inventory

↓

Validate Prices

↓

Apply Coupon

↓

Calculate Tax

↓

Create Order

↓

Create Order Items

↓

Reduce Inventory

↓

Create Shipment

↓

Clear Cart
Transaction Requirements

Checkout should always execute inside a database transaction.

If any step fails

Inventory Update

↓

FAIL

Everything rolls back.

Never allow

Order Created

Inventory NOT Updated

This prevents inconsistent data.

Business Rules
Wishlist

✔ Same product only once

Cart

✔ One active cart per customer

Cart Item

✔ Quantity > 0

✔ Variant must exist

✔ Product must exist

Order

✔ Cannot exist without customer

✔ Cannot exist without items

Order Item

✔ Immutable

✔ Historical snapshots preserved

Query Examples
Customer Orders
SELECT *
FROM orders
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
Order Details
SELECT *
FROM order_items
WHERE order_id = :order_id;
Customer Cart
SELECT *
FROM carts
WHERE user_id = auth.uid();
Cart Contents
SELECT
    ci.*,
    pv.price,
    pv.flavor,
    pv.net_weight_grams
FROM cart_items ci
JOIN product_variants pv
ON ci.variant_id = pv.id
WHERE ci.cart_id = :cart_id;
Future Improvements
Cart
Guest carts
Cart expiration
Saved carts
Multiple carts (e.g., "Office", "Home")
Orders
Partial refunds
Split shipments
Multi-vendor support
Multi-currency
Invoice generation
Order Items
Gift wrapping
Personalized messages
Bundle products
Subscription products
Commerce Design Summary
Table	Purpose
wishlists	Long-term saved products
carts	One active shopping cart per user
cart_items	Individual items in a cart, linked to variants
orders	Completed purchase header with totals and statuses
order_items	Immutable line items preserving purchase-time data

Part 4A — Fulfillment Module (Shipments, Shipment Tracking Events & Order Status History)
Overview

The Fulfillment Module is responsible for everything that happens after an order has been successfully placed.

Its primary responsibilities include:

Order lifecycle management
Shipment creation
Courier tracking
Customer tracking timeline
Delivery confirmation
Administrative audit trail

Unlike the Commerce Module (which ends at checkout), the Fulfillment Module manages the movement of an order until it reaches the customer.

Fulfillment Lifecycle
Customer Places Order
        │
        ▼
Order Created
        │
        ▼
Payment Successful
        │
        ▼
Warehouse Packs Order
        │
        ▼
Shipment Created
        │
        ▼
Courier Pickup
        │
        ▼
Transit Updates
        │
        ▼
Delivered
        │
        ▼
Customer Reviews Product

Every transition is stored in the database.

Nothing is inferred.

Nothing is overwritten.

Fulfillment Architecture
orders
   │
   │ 1 : Many
   ▼
order_status_history

orders
   │
   │ 1 : Many
   ▼
shipments
   │
   │
   ▼
shipment_tracking_events
Why Fulfillment is Separate from Orders

Many beginners attempt this:

orders

status
tracking_number
courier
delivery_date

This quickly becomes problematic.

Example

Order

↓

Packed

↓

Courier Pickup

↓

Reached Hub

↓

Out for Delivery

↓

Delivered

Only one status field exists.

Previous information is lost.

Instead

Orders store

Current Status

while

History stores

Every Status

This makes the system auditable.

1. Shipments Table
Purpose

Represents a physical shipment created for an order.

A shipment contains courier-related information.

Orders represent purchases.

Shipments represent logistics.

These are separate business entities.

Relationship
orders
   │
   ▼
shipments

One Order

↓

One or More Shipments

Why Multiple Shipments?

Suppose

Customer buys

Garlic Chips

Onion Chips

Gift Box

Garlic is available.

Gift Box arrives later.

Instead of delaying everything

Warehouse creates

Shipment 1

Garlic

Onion

Shipment 2

Gift Box

The schema supports this naturally.

Expected Structure
Column	Type	Purpose
id	uuid PK	Shipment ID
order_id	uuid FK	Parent Order
courier_name	text	Delhivery, BlueDart, etc.
tracking_number	text	Courier Tracking ID
shipment_status	text	Current shipment state
shipped_at	timestamptz	Dispatch timestamp
delivered_at	timestamptz	Delivery timestamp
estimated_delivery	timestamptz	ETA
created_at	timestamptz	Record creation
updated_at	timestamptz	Last update
Relationship
orders

↓

shipments

↓

tracking_events
Shipment Status

Suggested values

Created

Ready

Packed

Dispatched

In Transit

Out for Delivery

Delivered

Failed Delivery

Returned

Cancelled

Avoid storing arbitrary strings.

Use controlled values.

Example Query

Customer Shipment

SELECT *

FROM shipments

WHERE order_id=:order_id;
Business Rules

Shipment cannot exist

without

Order.

Shipment should never be deleted.

Even cancelled shipments remain

for auditing.

Future Improvements

Support

International Shipping

Multiple Warehouses

Split Shipments

Reverse Pickup

Returns

Exchange Orders

No schema redesign required.

Shipment Lifecycle
Order

↓

Shipment Created

↓

Packed

↓

Courier Pickup

↓

In Transit

↓

Hub Arrival

↓

Out for Delivery

↓

Delivered
2. Shipment Tracking Events
Purpose

Stores the complete courier timeline.

Unlike Shipments

which store only the latest status,

Tracking Events store

EVERY update.

Relationship
shipments

↓

shipment_tracking_events

One Shipment

↓

Many Events

Table Structure
Column	Type
id	uuid PK
shipment_id	uuid FK
order_id	uuid FK
status	text
location	text
message	text
event_time	timestamptz
raw_payload	jsonb
created_at	timestamptz
Example Timeline
Shipment Created

↓

Packed

↓

Courier Pickup

↓

Reached Bangalore Hub

↓

Left Bangalore Hub

↓

Reached Mysore

↓

Out for Delivery

↓

Delivered

Every row

↓

One Event.

Why raw_payload?

Courier APIs differ.

Example

Delhivery

{
 "scan":"Hub"
}

BlueDart

{
 "status":"Hub"
}

Instead of losing information

Store

Entire API Response

inside

raw_payload

Useful for

debugging
auditing
support
Example Query

Tracking Timeline

SELECT *

FROM shipment_tracking_events

WHERE shipment_id=:shipment

ORDER BY event_time;
Example UI

Frontend

✔ Packed

✔ Courier Pickup

✔ Reached Bangalore Hub

✔ Left Bangalore Hub

✔ Out for Delivery

○ Delivered

Entire timeline comes from

Tracking Events.

Future Improvements

Could include

Courier Images

Proof of Delivery

GPS

Driver Name

Vehicle Number
3. Order Status History
Purpose

Tracks

Business status

NOT

Courier status.

Example

Pending Payment

↓

Paid

↓

Packed

↓

Ready

↓

Cancelled

These are business decisions.

Not courier events.

Difference

Shipment Timeline

Courier Pickup

Order History

Payment Confirmed

Different responsibilities.

Relationship
orders

↓

order_status_history
Table Structure
Column	Type
id	uuid PK
order_id	uuid FK
old_status	text
new_status	text
note	text
changed_by	uuid FK
created_at	timestamptz
Example
Pending

↓

Paid

Admin

↓

Packed

Warehouse

↓

Ready

Courier

↓

Delivered

Every change

↓

One Row.

changed_by

References

profiles

Allows

Support

Warehouse

Admin

Manager

to be identified.

Example History
Pending

↓

Payment Successful

↓

Inventory Reserved

↓

Packed

↓

Ready

↓

Shipped

↓

Delivered

Nothing overwritten.

Example Query
SELECT *

FROM order_status_history

WHERE order_id=:id

ORDER BY created_at;
Shipment vs Order Status
Shipment	Order
Physical movement	Business workflow
Courier API	Internal application
Driver events	Admin actions
Transit updates	Payment updates
Location based	Workflow based
Fulfillment Flow
Customer

↓

Checkout

↓

Order Created

↓

Payment Success

↓

Status History

↓

Shipment Created

↓

Tracking Events

↓

Delivered
Database Integrity

Foreign Keys

shipment.order_id

↓

orders.id

Tracking

tracking.shipment_id

↓

shipments.id

History

history.order_id

↓

orders.id

Impossible

to create

orphan tracking records.

Recommended Indexes

Already created

idx_shipments_order

idx_tracking_order

idx_tracking_shipment

Future

tracking_number

shipment_status

may also be indexed

if shipment volume grows.

Business Rules
Shipment

✔ Cannot exist without Order

✔ May have many Tracking Events

✔ Never delete after dispatch

Tracking Event

✔ Belongs to one Shipment

✔ Chronological

✔ Immutable

Status History

✔ Every change stored

✔ Never overwrite previous state

✔ Records actor (changed_by)

Audit Trail Philosophy

One of the core principles of this backend is append-only history for operational events.

Instead of updating rows like:

Status = Delivered

the system records:

12:30 PM → Pending

12:45 PM → Paid

01:10 PM → Packed

03:00 PM → Courier Pickup

08:30 PM → Delivered

This provides:

Complete traceability
Easier debugging
Customer support visibility
Analytics on fulfillment time
Compliance and auditing
Future Enhancements

The current fulfillment schema can be extended without redesign to support:

Multiple warehouses
Multi-package orders
Return Merchandise Authorization (RMA)
Exchange orders
Partial deliveries
Failed delivery retries
Delivery OTP verification
Proof-of-delivery images
Courier webhooks
Delivery SLA monitoring
Shipment insurance
Real-time map tracking
Fulfillment Module Summary
Table	Responsibility
shipments	Represents the physical shipment associated with an order
shipment_tracking_events	Stores every courier tracking update in chronological order
order_status_history	Stores every business workflow transition for an order

Together, these three tables create a complete fulfillment system that separates business workflow from physical logistics, preserves historical events, and provides a scalable foundation for order tracking, customer support, and operational analytics.
DATABASE_ARCHITECTURE.md
Part 4B — Customer Engagement Module (Product Reviews, Coupons, Contact Messages)
Overview

The Customer Engagement Module manages all interactions between the customer and the platform beyond purchasing products.

Unlike the Commerce Module, which focuses on transactions, this module focuses on:

Building customer trust
Marketing and promotions
Customer feedback
Customer support
Community engagement
Increasing repeat purchases

These tables do not directly affect inventory or payments but significantly influence user experience and business growth.

Customer Engagement Architecture
                    profiles
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
product_reviews      coupons      contact_messages
        │
        ▼
     products
Customer Journey
Customer

↓

Browse Products

↓

Purchase Product

↓

Receive Order

↓

Leave Review

↓

Receive Coupon

↓

Contact Support

↓

Become Returning Customer
1. Product Reviews
Purpose

The product_reviews table stores customer ratings and written reviews for purchased products.

It serves three major business purposes:

Social proof
Product quality feedback
Search ranking & SEO

Unlike product ratings stored as aggregates, every review is stored individually.

Relationship
profiles
      │
      ▼
product_reviews
      │
      ▼
products

One User

↓

Many Reviews

One Product

↓

Many Reviews

Table Structure
Column	Type	Purpose
id	uuid PK	Review ID
user_id	uuid FK	Review Author
product_id	uuid FK	Reviewed Product
order_id	uuid FK Nullable	Purchase Reference
rating	integer	Rating (1–5)
title	text	Review Heading
comment	text	Review Content
is_verified_purchase	boolean	Purchased Product?
is_approved	boolean	Admin Moderation
created_at	timestamptz	Creation Timestamp
updated_at	timestamptz	Last Modification
Why reference Order?

Suppose someone never purchased

Garlic Chips.

Without linking Orders,

anyone could write

★★★★★

Fake Review.

Instead

Order

↓

Review

allows

Verified Purchase

to be displayed.

Rating Constraint
CHECK (rating BETWEEN 1 AND 5)

Impossible values

0

7

-1

are rejected by PostgreSQL.

Unique Constraint
UNIQUE(user_id,
       product_id,
       order_id)

Purpose

Prevent duplicate reviews

for

the same purchase.

Approval Workflow

Customer

↓

Submit Review

↓

Pending

↓

Admin Approval

↓

Visible

Instead of

DELETE

spam

the review simply remains

is_approved=false
Verified Purchase

Display

★★★★★

Verified Purchase ✓

only if

is_verified_purchase=true

This increases buyer confidence.

Example Query

Load Product Reviews

SELECT *

FROM product_reviews

WHERE product_id=:id

AND is_approved=true

ORDER BY created_at DESC;
Future Extensions

Helpful votes

👍 Helpful (145)

Photos

Videos

Anonymous reviews

Review replies

Review editing history

Review reports

AI moderation

Review Lifecycle
Purchase

↓

Delivery

↓

Leave Review

↓

Pending Approval

↓

Published

↓

Helpful Votes
Business Rules

✔ Rating must be 1–5

✔ Product must exist

✔ User must exist

✔ Purchase verification optional

✔ Admin approval required

2. Coupons
Purpose

Coupons provide promotional discounts.

They increase:

Conversion
Customer retention
Average Order Value

Coupons are marketing objects,

not payment objects.

Relationship
orders

↓

coupon

An order

may reference

one coupon.

Suggested Table Structure
Column	Type
id	uuid PK
code	text UNIQUE
description	text
discount_type	text
discount_value	numeric
minimum_order	numeric
maximum_discount	numeric
usage_limit	integer
used_count	integer
valid_from	timestamptz
valid_until	timestamptz
is_active	boolean
created_at	timestamptz
Discount Types

Flat

₹100 OFF

Percentage

20%

Buy One Get One

Future

BOGO
Coupon Validation

Before applying

check

Coupon Exists

↓

Active

↓

Date Valid

↓

Usage Remaining

↓

Minimum Order

↓

Eligible Customer

Only then

Apply Discount.

Example

Coupon

WELCOME20

Rules

20%

Minimum ₹500

Maximum ₹150

Expires Dec 31
Example Query
SELECT *

FROM coupons

WHERE code='WELCOME20'

AND is_active=true;
Future Extensions

Per-user coupons

Birthday coupons

Referral coupons

First-order coupons

Festival campaigns

Category-only coupons

Product-specific coupons

Free shipping coupons

Coupon Lifecycle
Admin Creates Coupon

↓

Customer Applies

↓

Validation

↓

Discount Applied

↓

Order Completed

↓

Usage Count Increased
Business Rules

✔ Unique coupon code

✔ Expiry enforced

✔ Usage limit respected

✔ Minimum order validated

✔ Cannot exceed maximum discount

3. Contact Messages
Purpose

Stores messages submitted through the website's

Contact Us

form.

This table acts as a lightweight customer support ticket system.

Relationship
Visitor

↓

Contact Form

↓

contact_messages

Authentication

is optional.

Guests

can submit.

Suggested Table Structure
Column	Type
id	uuid PK
name	text
email	text
phone	text Nullable
subject	text
message	text
status	text
assigned_to	uuid Nullable
created_at	timestamptz
updated_at	timestamptz
Status Values
New

Open

In Progress

Resolved

Closed
Assignment

Support Admin

↓

assigned_to

↓

profiles.id

Allows workload management.

Example Query

Open Messages

SELECT *

FROM contact_messages

WHERE status='Open';
Future Improvements

Attachments

Screenshots

Priority

Internal Notes

Response History

Email Synchronization

Live Chat Conversion

Contact Workflow
Visitor

↓

Contact Form

↓

Database

↓

Support Dashboard

↓

Assign Staff

↓

Resolve

↓

Close
Customer Engagement Summary
Customer

↓

Purchase

↓

Review Product

↓

Receive Coupon

↓

Return Purchase

↓

Need Help

↓

Contact Support

Every interaction is persisted independently.

Recommended Indexes
Product Reviews
product_id

user_id

created_at
Coupons
code

is_active

valid_until
Contact Messages
status

assigned_to

created_at
Security Considerations
Product Reviews
Customers may create reviews.
Customers may edit only their own reviews (if allowed).
Public users may read only approved reviews.
Admins can approve, reject, or moderate reviews.
Coupons
Public users should never modify coupons.
Validation should occur on the backend.
Admins manage creation, updates, and deactivation.
Contact Messages
Guests may submit messages.
Only authorized staff should read or manage messages.
Sensitive customer information should not be exposed publicly.
Analytics Opportunities

This module enables valuable business insights, such as:

Average product ratings
Most reviewed products
Review approval rate
Coupon redemption rate
Conversion by coupon campaign
Customer support response time
Most common support subjects
Customer satisfaction trends

These metrics can power future admin dashboards and business reporting.

Customer Engagement Module Summary
Table	Responsibility
product_reviews	Customer ratings, reviews, moderation, verified purchases
coupons	Promotional discounts, marketing campaigns, order incentives
contact_messages	Customer inquiries and lightweight support ticket management

Together, these tables strengthen customer trust, encourage repeat purchases, improve marketing effectiveness, and provide structured channels for customer feedback and support.
Part 4C — Authentication & Security Module (OTP Verification, Login Attempts, Admin Sessions)
Overview

The Authentication & Security Module protects the application against unauthorized access, abuse, brute-force attacks, and session hijacking.

Although Supabase Auth manages authentication (passwords, OAuth, sessions, JWTs), the application requires additional tables to support business-specific security features such as:

OTP verification
Login monitoring
Admin session auditing
Device tracking
Fraud detection
Security analytics

These tables extend Supabase Auth rather than replace it.

Security Architecture
                     ┌──────────────────────┐
                     │  Supabase Auth       │
                     │----------------------│
                     │ Email               │
                     │ Password            │
                     │ OAuth              │
                     │ JWT                │
                     │ Sessions           │
                     └─────────┬──────────┘
                               │
                               ▼
                         auth.users
                               │
                               ▼
                           profiles
                               │
          ┌────────────────────┼──────────────────┐
          ▼                    ▼                  ▼
otp_verifications     login_attempts      admin_sessions
Authentication Philosophy

Authentication answers:

Who are you?

Authorization answers:

What are you allowed to do?

These are intentionally separated.

Supabase answers the first question.

Our application answers the second.

Authentication Flow
Visitor

↓

Sign Up

↓

Supabase Auth

↓

Email Verification

↓

auth.users Created

↓

profiles Created

↓

Login

↓

JWT Generated

↓

Frontend

↓

Protected Routes
Security Layer
User

↓

Supabase Auth

↓

JWT

↓

API

↓

Business Logic

↓

Repository

↓

Database (RLS)

Every request should eventually reach the database with an authenticated JWT.

1. OTP Verification
Purpose

Stores One-Time Passwords (OTP) generated for actions requiring additional verification.

Typical use cases:

Email verification
Phone verification
Password reset
Sensitive account updates
Checkout confirmation (future)
Delivery verification (future)
Why separate from Auth?

Supabase handles authentication.

The application decides when an OTP is required.

Example

Customer

↓

Change Phone Number

↓

Generate OTP

↓

Verify OTP

↓

Update Phone

No need to modify Supabase Auth.

Suggested Table
Column	Type	Purpose
id	uuid PK	OTP Record
user_id	uuid FK Nullable	Logged-in user
email	text	Target email
phone	text	Target phone
otp_code	text	Generated code (prefer hashed)
purpose	text	Verification reason
expires_at	timestamptz	Expiration
verified_at	timestamptz	Success time
attempts	integer	Number of attempts
created_at	timestamptz	Generated
OTP Lifecycle
Generate OTP

↓

Store Record

↓

Send Email/SMS

↓

User Enters Code

↓

Validate

↓

Verified

↓

Expire/Delete
Purposes

Suggested values

EMAIL_VERIFICATION

PASSWORD_RESET

PHONE_UPDATE

ACCOUNT_RECOVERY

CHECKOUT_CONFIRMATION

DELIVERY_CONFIRMATION
Expiration

Never store OTP indefinitely.

Recommended

5 Minutes

or

10 Minutes

After expiration

↓

Invalid.

Security Recommendation

Never store the OTP in plain text.

Instead

Generated OTP

↓

Hash

↓

Store Hash

↓

Compare Hashes

Exactly like passwords.

Example Query
SELECT *

FROM otp_verifications

WHERE email=:email

AND purpose='PASSWORD_RESET'

AND expires_at>NOW();
Future Improvements
SMS providers
Email providers
Rate limiting
IP tracking
OTP resend cooldown
2. Login Attempts
Purpose

Tracks authentication attempts.

Useful for

brute-force detection
suspicious login monitoring
analytics
security audits
Relationship
Visitor

↓

Login Attempt

↓

login_attempts

Authentication success is not required.

Even failed attempts are recorded.

Suggested Table
Column	Type
id	uuid PK
email	text
ip_address	inet
user_agent	text
success	boolean
failure_reason	text
attempted_at	timestamptz
Why Store Failed Logins?

Imagine

500 Failed Logins

↓

Same IP

Very likely

↓

Bot attack.

Without logging

You never know.

Example
Email

↓

admin@example.com

↓

Wrong Password

↓

Saved
Security Uses

Detect

10 Failures

↓

Lock Account

or

100 Attempts

↓

Block IP
Example Query
SELECT *

FROM login_attempts

WHERE email=:email

ORDER BY attempted_at DESC;
Analytics

Possible dashboard

Today's Logins

Successful

Failed

Blocked

Countries

Devices
Future Improvements

Store

Country

City

ISP

Device

Browser

OS

Fingerprint
3. Admin Sessions
Purpose

Tracks privileged administrator sessions.

Unlike customer sessions,

admin activity requires stronger auditing.

Relationship
profiles

↓

admin_sessions

Only

role='admin'

should create records.

Suggested Table
Column	Type
id	uuid PK
admin_id	uuid FK
session_token	text
ip_address	inet
user_agent	text
started_at	timestamptz
last_activity	timestamptz
ended_at	timestamptz
is_active	boolean
Session Lifecycle
Admin Login

↓

Session Created

↓

Requests

↓

Activity Updated

↓

Logout

↓

Session Closed
Why Keep Session History?

Imagine

Admin accidentally deletes

100 Products.

Need to know

Who?

When?

Which Device?

Which IP?

Admin Sessions help answer those questions.

Example Query
SELECT *

FROM admin_sessions

WHERE admin_id=:admin

AND is_active=true;
Future Improvements

Support

Force logout
Session revocation
Concurrent session limits
Device approval
Trusted devices
Authentication vs Authorization
Authentication	Authorization
Identity	Permissions
Managed by Supabase	Managed by Application
Login	Role checks
JWT	RLS Policies
JWT Flow
Login

↓

Supabase

↓

JWT

↓

Frontend

↓

API

↓

Database

↓

RLS

JWT becomes the identity for every request.

Security Best Practices
Passwords

Never stored.

Managed entirely by Supabase.

OTP

Store hashed.

Never plaintext.

Sessions

Expire automatically.

Support manual revocation.

Login Attempts

Always log failures.

Admin Activity

Always auditable.

HTTPS

All authentication traffic must use HTTPS.

Secrets

Never expose

service_role

JWT Secret

SMTP Password

Razorpay Secret

to the frontend.

Only the backend should access them.

Recommended Indexes
OTP
email

purpose

expires_at
Login Attempts
email

attempted_at

ip_address
Admin Sessions
admin_id

is_active

started_at
Security Workflows
Login
User

↓

Supabase Auth

↓

JWT

↓

profiles

↓

Application
Password Reset
Forgot Password

↓

Generate OTP

↓

Send Email

↓

Verify OTP

↓

Reset Password
Admin Login
Admin Login

↓

Supabase Auth

↓

Role Check

↓

Admin Session Created

↓

Dashboard Access
Threat Mitigation
Threat	Protection
Brute-force attacks	Login attempts + rate limiting
Session hijacking	JWT expiration + HTTPS
Unauthorized admin access	Role checks + admin session logging
OTP replay	Expiration + single-use verification
Credential leakage	Supabase-managed password hashing
Audit requirements	Admin sessions + login history
Future Security Enhancements

The current architecture can evolve to support:

Two-Factor Authentication (2FA)
WebAuthn / Passkeys
Hardware security keys
Device fingerprinting
Adaptive authentication
Risk-based login challenges
Geo-location anomaly detection
Security event notifications
Account lockout policies
Single Sign-On (SSO)

No major schema redesign would be required.

Authentication & Security Module Summary
Table	Responsibility
otp_verifications	Temporary verification codes for sensitive operations
login_attempts	Audit trail of successful and failed login attempts
admin_sessions	Tracking and auditing of administrator sessions

These tables complement Supabase Auth by adding application-specific security controls, operational visibility, and auditing capabilities while keeping authentication responsibilities cleanly separated.
Part 4D — CMS & System Module (Settings, Page Content, Banners, Payment Events)
Overview

The CMS & System Module manages all application-level content and configuration that is not directly tied to commerce transactions.

Instead of hardcoding values into the frontend, this module centralizes dynamic content and operational settings in the database.

It allows administrators to update:

Homepage banners
Marketing content
Company information
Policies
Contact details
Feature toggles
Payment event logs
Site-wide configuration

without redeploying the frontend.

Module Architecture
                     Admin Dashboard
                            │
          ┌─────────────────┼──────────────────┐
          ▼                 ▼                  ▼
     page_content       banners          settings
                                                │
                                                ▼
                                        Entire Application

orders
   │
   ▼
payment_events
Why a CMS?

Many beginner projects hardcode content like:

<h1>Healthy Snacks</h1>

or

const phone = "9876543210";

Every content change requires:

Edit Code

↓

Commit

↓

Build

↓

Deploy

With a CMS:

Admin Dashboard

↓

Update Database

↓

Frontend Updates Automatically

No deployment required.

1. Settings Table
Purpose

Stores global application configuration.

Think of it as the application's configuration file stored inside PostgreSQL.

Relationship
Entire Application

↓

settings

There is no parent table.

Settings are global.

Suggested Structure
Column	Type	Purpose
id	uuid PK	Setting ID
key	text UNIQUE	Configuration key
value	jsonb	Configuration value
description	text	Admin explanation
updated_by	uuid FK	Admin
created_at	timestamptz	Created
updated_at	timestamptz	Modified
Why JSONB?

Instead of

phone

email

instagram

facebook

youtube

Store

{
  "phone":"...",
  "email":"...",
  "socials":{
      "instagram":"...",
      "facebook":"..."
  }
}

Far more flexible.

Example Keys
site_name

contact_info

social_links

delivery_settings

tax_settings

payment_settings

seo_defaults

maintenance_mode

homepage_configuration

shipping_configuration
Example Query
SELECT value

FROM settings

WHERE key='contact_info';
Future Uses
Feature Flags
AI Configuration
Analytics Keys
Newsletter Settings
SEO Defaults
2. Page Content (CMS)
Purpose

Stores editable website content.

Instead of editing code

admins edit content.

Relationship
Admin

↓

page_content

↓

Frontend
Suggested Structure
Column	Type
id	uuid PK
page	text
section	text
title	text
subtitle	text
body	text
image_url	text
metadata	jsonb
is_published	boolean
updated_by	uuid FK
created_at	timestamptz
updated_at	timestamptz
Example

Homepage

Hero

↓

Title

↓

Subtitle

↓

Image

About Page

↓

Mission

↓

Vision

↓

Founder

No frontend changes required.

Example Query
SELECT *

FROM page_content

WHERE page='home'

AND is_published=true;
Benefits

Marketing team

↓

Update homepage

↓

Immediately visible

without

Developer.

Future Extensions

Rich Text

Markdown

Version History

Scheduled Publishing

Translations

Drafts

SEO Fields

3. Banners
Purpose

Stores promotional banners.

Examples

Homepage

Festival Sale

Offers

Announcements

Relationship
Frontend

↓

banners
Suggested Structure
Column	Type
id	uuid PK
title	text
image_url	text
mobile_image_url	text
link_url	text
priority	integer
starts_at	timestamptz
ends_at	timestamptz
is_active	boolean
created_at	timestamptz
Example
Independence Day Sale

↓

Banner

↓

Shop Now

↓

Link
Priority

Multiple banners

↓

Sort

1

↓

Homepage Hero
2

↓

Secondary Banner
Scheduling

Instead of manually

Enable

↓

Disable

Use

starts_at

↓

ends_at

Automatically.

Example Query
SELECT *

FROM banners

WHERE is_active=true

AND NOW()

BETWEEN starts_at

AND ends_at

ORDER BY priority;
Future Improvements

Carousel

Video Banner

Animated Banner

Region-specific Banner

A/B Testing

4. Payment Events
Purpose

Stores every payment gateway interaction.

Unlike Orders

which store

Business Data

Payment Events store

Gateway Data.

Relationship
orders

↓

payment_events

One Order

↓

Many Events

Why Many?

Payment isn't always successful first time.

Example

Created

↓

Authorized

↓

Captured

↓

Refunded

Every event

↓

One row.

Suggested Structure
Column	Type
id	uuid PK
order_id	uuid FK
gateway	text
event_type	text
payment_id	text
transaction_id	text
amount	numeric
currency	text
status	text
raw_payload	jsonb
created_at	timestamptz
Event Types
Payment Created

Authorized

Captured

Failed

Refund Initiated

Refund Success

Webhook Received
Why raw_payload?

Every gateway differs.

Razorpay

↓

Different

Stripe

↓

Different

Cashfree

↓

Different

Instead

Store

Entire JSON.

Useful

for

Support

Audits

Debugging

Example Query
SELECT *

FROM payment_events

WHERE order_id=:order;
Example Timeline
Payment Created

↓

Authorized

↓

Captured

↓

Invoice Generated
Future

Support

UPI

Wallets

EMI

International Cards

Subscriptions

without

Schema redesign.

CMS Flow
Admin

↓

Dashboard

↓

Update Page Content

↓

Database

↓

Frontend

↓

Customer
Banner Flow
Admin

↓

Upload Banner

↓

Supabase Storage

↓

Banner Record

↓

Homepage
Payment Flow
Checkout

↓

Gateway

↓

Webhook

↓

Payment Event

↓

Order Update
System Configuration Philosophy

Everything that changes frequently

↓

Database

Everything

Business Logic

↓

Backend

Everything

Presentation

↓

Frontend

Security
Settings

Only Admin

Read/Write

CMS

Public

Read

Admin

Write

Banners

Public

Read

Admin

Write

Payment Events

Never Public

Only Backend

Only Admin

Read

Recommended Indexes

Settings

key

Page Content

page

section

is_published

Banner

priority

is_active

starts_at

ends_at

Payment Events

order_id

payment_id

event_type

status
Future Expansion

Current architecture supports

✔ Dynamic Homepage

✔ Dynamic About

✔ Privacy Policy

✔ FAQ

✔ Blog

✔ Careers

✔ Announcements

✔ Coupons

✔ Payment Logs

without redesign.

System Module Summary
Table	Responsibility
settings	Global application configuration (contact info, feature flags, payment settings, SEO defaults, etc.)
page_content	Editable website content managed through an admin interface
banners	Promotional banners with scheduling, priority, and responsive images
payment_events	Immutable log of payment gateway interactions for auditing and debugging
Cross-Module Architecture Summary

At this point, the backend is organized into four major functional modules:

                     WIN-DIA Backend

                             │
 ┌───────────────────────────┼───────────────────────────┐
 │                           │                           │
 ▼                           ▼                           ▼
Core Module             Commerce Module          Customer Module
Profiles                Cart                     Reviews
Products                Wishlist                Coupons
Categories              Orders                  Contact Messages
Variants                Order Items

                             │
                             ▼
                    Fulfillment Module
                    Shipments
                    Tracking Events
                    Order Status History

                             │
                             ▼
                 Authentication & Security
                 OTP Verification
                 Login Attempts
                 Admin Sessions

                             │
                             ▼
                     CMS & System Module
                     Settings
                     Page Content
                     Banners
                     Payment Events
Overall Backend Status

Based on everything we've designed together:

Module	Status
Core Database Schema	✅ Complete
Commerce Schema	✅ Complete
Fulfillment Schema	✅ Complete
Customer Engagement Schema	✅ Complete
Authentication & Security Design	✅ Complete
CMS & System Design	✅ Complete
Primary Keys / Foreign Keys	✅ Complete
Constraints & Indexes	✅ Complete
updated_at Triggers	✅ Complete
Database Normalization	✅ Complete
API Layer	⏳ Not Started
Business Logic Layer	⏳ Not Started
Repository Layer	⏳ Not Started
Row-Level Security (RLS)	⏳ Planned
Storage Policies	⏳ Planned
Helper RPC Functions	⏳ Planned
Views / Materialized Views	⏳ Planned
Testing & Integration	⏳ Planned

Part 5 — Indexes, Triggers & Helper Functions
Overview

While tables define what data is stored, the objects covered in this chapter define how the database behaves.

A production PostgreSQL database is much more than tables.

It also contains:

Indexes
Constraints
Triggers
Trigger Functions
Helper Functions
RPC Functions
Views
Transactions
Stored Procedures (optional)

Together, these provide:

Faster queries
Automatic timestamp updates
Data integrity
Reusable business logic
Better maintainability
Reduced application complexity
Database Architecture
                    PostgreSQL

     ┌────────────────────────────────────┐
     │              Tables                │
     └────────────────────────────────────┘
                    │
                    ▼
     ┌────────────────────────────────────┐
     │            Constraints             │
     └────────────────────────────────────┘
                    │
                    ▼
     ┌────────────────────────────────────┐
     │              Indexes               │
     └────────────────────────────────────┘
                    │
                    ▼
     ┌────────────────────────────────────┐
     │             Triggers               │
     └────────────────────────────────────┘
                    │
                    ▼
     ┌────────────────────────────────────┐
     │         Helper Functions           │
     └────────────────────────────────────┘
                    │
                    ▼
     ┌────────────────────────────────────┐
     │          API / Backend             │
     └────────────────────────────────────┘
Philosophy

The backend follows an important principle:

The database should enforce correctness whenever possible.

Instead of relying entirely on backend code,

PostgreSQL should automatically guarantee:

timestamps
referential integrity
uniqueness
valid ranges
cascading deletes
default values
consistency
1. Indexes
What is an Index?

Imagine a book.

Without an index,

finding

Garlic Chips

requires reading every page.

With an index,

you jump directly to

Page 142.

Database indexes work exactly the same way.

Without Index
SELECT *

FROM products

WHERE category_id='...';

Database

↓

Reads every row.

Complexity

O(n)
With Index
Category

↓

Index

↓

Matching Rows

Complexity

Approximately

O(log n)

Much faster.

Existing Indexes
Products
idx_products_category

Purpose

Fast category pages.

WHERE category_id=...
idx_products_active

Purpose

Homepage

Shop

Search

WHERE is_active=true
idx_products_variant_group

Purpose

Group similar products.

Useful for

recommendations
related products
filtering
Categories
idx_categories_parent

Used for

Nested categories.

Snacks

↓

Healthy

↓

Gluten Free
Orders

Recommended

CREATE INDEX idx_orders_user

ON orders(user_id);

Allows

SELECT *

FROM orders

WHERE user_id=...

to execute efficiently.

Cart Items

Recommended

CREATE INDEX idx_cart_items_cart

ON cart_items(cart_id);

Used almost every page load.

Wishlist

Recommended

CREATE INDEX idx_wishlist_user

ON wishlists(user_id);
Reviews

Recommended

CREATE INDEX idx_reviews_product

ON product_reviews(product_id);
Shipment Tracking

Recommended

CREATE INDEX idx_tracking_shipment

ON shipment_tracking_events(shipment_id);
Why Not Index Everything?

Indexes improve reads.

Indexes slow

INSERT
UPDATE
DELETE

Every index

must also be updated.

Therefore

only frequently queried columns

should be indexed.

Recommended Index Summary
Table	Index
products	category_id
products	is_active
products	variant_group_id
categories	parent_id
carts	user_id
cart_items	cart_id
cart_items	variant_id
wishlists	user_id
orders	user_id
order_items	order_id
reviews	product_id
shipments	order_id
tracking_events	shipment_id
2. Triggers
What is a Trigger?

A trigger is automatic code executed by PostgreSQL.

Application

↓

Update Row

↓

Trigger Fires

↓

Database executes function.

No backend required.

Trigger Architecture
UPDATE products

        │

        ▼

Trigger

        │

        ▼

update_updated_at()

        │

        ▼

updated_at = NOW()
Existing Trigger

Every important table currently has

BEFORE UPDATE

trigger.

Examples

products_updated_at

categories_updated_at

orders_updated_at

carts_updated_at

cart_items_updated_at

product_variants_updated_at
Trigger Function

Shared

update_updated_at_column()

Instead of writing

10 trigger functions

one reusable function

updates

updated_at

for every table.

Benefits

No backend developer can accidentally forget

updated_at

The database guarantees it.

Future Trigger

Inventory

Imagine

Checkout

↓

Order Created

↓

Inventory

Automatically decreases.

Trigger

order_items

↓

AFTER INSERT

↓

Update Stock

However

For complex business logic,

Service Layer

is preferable.

Future Trigger

Review Count

Instead of

calculating

120 Reviews

every request

trigger

updates

products.review_count

Automatically.

Future Trigger

Average Rating

Review inserted

↓

Trigger

↓

Update

average_rating
Future Trigger

Coupon Usage

Order Paid

↓

Trigger

↓

Increase

used_count
Future Trigger

Audit Logs

Admin

↓

Deletes Product

↓

Automatically

insert

Audit Record.

Trigger Best Practices

Use triggers only for

✔ timestamps

✔ audit logs

✔ simple synchronization

Avoid

huge business workflows

inside triggers.

3. Helper Functions
Purpose

Reusable SQL functions.

Instead of repeating SQL

across API routes

write once.

Call everywhere.

Example

Current

SELECT SUM(price)
...

repeated

10 files.

Better

calculate_cart_total(user_id)
Function Categories
Cart Functions
get_cart_total()

get_cart_item_count()

clear_cart()

cart_has_stock()
Product Functions
get_product_average_rating()

get_product_review_count()

get_featured_products()

search_products()
Inventory Functions
has_inventory()

reserve_inventory()

release_inventory()

deduct_inventory()
Order Functions
calculate_order_total()

create_order_number()

get_order_summary()

get_order_status()
Customer Functions
get_user_orders()

get_wishlist()

get_recent_products()
Example

Instead of

SELECT AVG(rating)

FROM product_reviews

WHERE product_id='...'

Everywhere

Use

get_product_average_rating(product_id)

Cleaner.

Example RPC
get_featured_products(limit)

Frontend

↓

RPC

↓

Returns

Products.

Benefits

✔ Centralized logic

✔ Faster development

✔ Easier maintenance

✔ Consistent calculations

4. Database Views
What is a View?

Virtual table.

No duplicated data.

Example

Instead of

joining

5 tables

every request

Create

product_catalog_view

View

joins

products

↓

variants

↓

images

↓

categories

Frontend

queries

one object.

Useful Views
Product Catalog View

Returns

Product
Price
Category
Thumbnail
Rating
Review Count
Order Summary View

Returns

Order

Customer

Payment

Shipment

Dashboard View

Returns

Revenue

Orders

Customers

Products

Customer Profile View

Returns

Profile

Orders

Wishlist

Addresses

Benefits

Simpler frontend.

Less joins.

Cleaner APIs.

5. Transactions
Purpose

Guarantee

All

or

Nothing.

Checkout Example

Create Order

↓

Create Order Items

↓

Reduce Inventory

↓

Create Shipment

↓

Clear Cart

If

Inventory

Fails

↓

Everything

Rolls Back.

Never allow

Order Created

Inventory NOT Updated
Transaction Flow
BEGIN

↓

Insert Order

↓

Insert Items

↓

Update Inventory

↓

Create Shipment

↓

COMMIT

Failure

↓

ROLLBACK

6. Stored Procedures vs Helper Functions

Helper Functions

Return

Data.

Example

get_cart_total()

Stored Procedure

Performs

Action.

Example

complete_checkout()

Current recommendation

Use

Helper Functions

Backend Services

instead of

large stored procedures.

Keeps business logic

inside TypeScript.

7. Naming Conventions

Indexes

idx_table_column

Example

idx_products_category

Triggers

table_updated_at

Functions

get_

calculate_

create_

update_

delete_

Views

vw_

or

*_view

Constraints

chk_

fk_

pk_

uq_
Performance Considerations

As data grows:

Index high-selectivity columns (user_id, product_id, order_id, etc.).
Avoid indexing low-cardinality columns (e.g., is_active) unless they are heavily filtered in combination with other fields.
Consider composite indexes for common multi-column filters.
Monitor slow queries with PostgreSQL statistics before adding new indexes.
Remove unused indexes to reduce write overhead.
Helper Functions Planned for WIN-DIA
Function	Purpose
get_cart_total(user_id)	Calculates total cart value
get_cart_item_count(user_id)	Returns number of cart items
get_product_average_rating(product_id)	Average review score
get_product_review_count(product_id)	Number of approved reviews
search_products(query)	Product search
get_featured_products(limit)	Homepage featured products
has_inventory(variant_id, qty)	Checks stock availability
calculate_order_total(order_id)	Computes order totals
create_order_number()	Generates unique order numbers
clear_cart(user_id)	Removes all items after successful checkout
Existing Database Objects

Based on your current implementation, you already have:

Triggers
products_updated_at
categories_updated_at
product_variants_updated_at
orders_updated_at
carts_updated_at
cart_items_updated_at
(and equivalent updated_at triggers on other mutable tables)

All of these use a shared helper function:

update_updated_at_column()
Indexes

Already present or created during setup:

idx_products_category
idx_products_active
idx_products_variant_group
idx_categories_parent
Additional indexes on shipments, tracking, wishlist, and cart-related tables as discussed during setup.
Production Checklist
Feature	Status
Primary Keys	✅
Foreign Keys	✅
Unique Constraints	✅
Check Constraints	✅
Default Values	✅
Query Indexes	✅
updated_at Triggers	✅
Shared Trigger Function	✅
Normalized Schema	✅
Helper Function Design	✅ Planned
Database Views	✅ Planned
Transaction Strategy	✅ Designed
Naming Conventions	✅ Defined
Design Philosophy

This database intentionally keeps responsibilities separated:

Tables store data.
Indexes make data retrieval fast.
Constraints enforce correctness.
Triggers automate simple, repetitive tasks.
Helper Functions encapsulate reusable SQL.
Views simplify data access.
Transactions guarantee atomic operations.
Business Logic remains in the backend service layer rather than inside complex database triggers.

This balance leverages PostgreSQL's strengths while keeping the application logic maintainable and testable.

Part 6 — API Layer & Business Logic
Overview

The database designed in Parts 1–5 provides a solid foundation, but applications should never communicate with the database directly. Instead, requests flow through several well-defined layers, each with a single responsibility.

The WIN-DIA backend follows a layered architecture to keep concerns separated, improve maintainability, and make testing easier.

The layers are:

Frontend (Next.js)
API Layer
Service (Business Logic) Layer
Repository (Data Access) Layer
Supabase (Database & Storage)
Complete Request Lifecycle
                    USER
                      │
                      ▼
              Next.js Frontend
                      │
                      ▼
            API Route / Server Action
                      │
                      ▼
             Validation & Authentication
                      │
                      ▼
              Business Logic Service
                      │
                      ▼
             Repository / Data Layer
                      │
                      ▼
          Supabase PostgreSQL + Storage
                      │
                      ▼
                 Response Returned

Every request should follow this path.

No layer should skip another.

Folder Structure

A production-ready backend might look like:

src/
│
├── backend/
│
│   ├── api/
│   │     products.ts
│   │     cart.ts
│   │     wishlist.ts
│   │     checkout.ts
│   │
│   ├── services/
│   │     product.service.ts
│   │     cart.service.ts
│   │     wishlist.service.ts
│   │     order.service.ts
│   │     payment.service.ts
│   │     inventory.service.ts
│   │
│   ├── repositories/
│   │     product.repository.ts
│   │     cart.repository.ts
│   │     order.repository.ts
│   │
│   ├── supabase/
│   │     client.ts
│   │     admin.ts
│   │
│   ├── middleware/
│   │     auth.ts
│   │     admin.ts
│   │
│   ├── validators/
│   │     product.validator.ts
│   │     cart.validator.ts
│   │
│   ├── dto/
│   │
│   ├── utils/
│   │
│   └── types/
Responsibility of Each Layer
1. Frontend

Responsible for:

Rendering UI
Collecting user input
Form validation (basic)
Calling APIs
Displaying results

Never:

Calculate business rules
Directly modify database
Trust client values

Example

await fetch("/api/cart", {
  method: "POST",
  body: ...
});

Nothing more.

2. API Layer

Purpose

Acts as the entry point into the backend.

Responsibilities

Receive request
Authenticate user
Validate request
Call services
Return response

Never

Write SQL
Contain complex calculations

Example

POST

/api/cart

↓

Validate

↓

cartService.addItem()

↓

Return JSON

Example Structure

POST /api/cart

↓

Authenticate

↓

Validate body

↓

cartService.addToCart()

↓

Return Response
API Endpoints

Products

GET /products

GET /products/:slug

GET /categories

Wishlist

GET /wishlist

POST /wishlist

DELETE /wishlist/:id

Cart

GET /cart

POST /cart

PATCH /cart

DELETE /cart/:id

Orders

POST /checkout

GET /orders

GET /orders/:id

Payments

POST /payments/create

POST /payments/webhook

Reviews

GET /reviews

POST /reviews
3. Validation Layer

Every request should be validated.

Example

Cart

Client sends

{
  "qty": -500
}

Reject

before

business logic.

Validation includes

Required fields
Type checking
Length limits
Numeric limits
Enum validation
UUID validation

Example

qty > 0

variant_id is UUID

product exists
DTO (Data Transfer Objects)

DTOs define

what

the API accepts.

Example

AddCartItemDTO

variantId

quantity

Instead of exposing database models.

Benefits

Cleaner APIs
Versioning
Better validation
4. Authentication Layer

Every protected endpoint

should verify

JWT.

Flow

JWT

↓

Supabase

↓

User

↓

Profile

↓

Role

If invalid

↓

401 Unauthorized.

Admin Routes

Require

role='admin'

Example

POST /admin/product

Only admins.

5. Business Logic Layer (Services)

This is

the most important layer.

Contains

ALL application rules.

Example

Cart Service

Add Product

↓

Check Variant

↓

Check Stock

↓

Check Active

↓

Add Cart

↓

Return Updated Cart

Order Service

Validate Cart

↓

Calculate Total

↓

Apply Coupon

↓

Create Order

↓

Create Order Items

↓

Reduce Stock

↓

Create Shipment

Inventory Service

Reserve Stock

Release Stock

Deduct Stock

Payment Service

Create Razorpay Order

Verify Signature

Capture Payment

Update Database

Product Service

Get Product

Get Related Products

Get Featured Products

Search
Why Separate Services?

Suppose

Checkout

needs

cart
inventory
payment
shipment

Without services

API becomes

1000 lines.

Instead

checkoutService

↓

inventoryService

↓

paymentService

↓

shipmentService

Much cleaner.

6. Repository Layer

Repositories

ONLY communicate

with Supabase.

Never calculate.

Never validate.

Example

Instead of

supabase.from(...)

inside

20 files,

write

productRepository

↓

findById()

findBySlug()

search()

updateStock()

Repository

↓

SQL

Only.

Repository Examples

Product Repository

findById()

findBySlug()

findFeatured()

search()

Cart Repository

getCart()

createCart()

updateCart()

clearCart()

Wishlist Repository

add()

remove()

list()

Order Repository

create()

find()

updateStatus()
7. Supabase Layer

Responsible for

Database
Storage
Authentication
RPC
Realtime

Nothing else.

Example

Products

↓

Supabase

↓

JSON
Supabase Clients

Public Client

Used

Frontend

Authenticated User

Admin Client

Uses

Service Role Key

Backend Only

Never exposed.

Example

Frontend

↓

Anon Key

Backend

↓

Service Role

Storage Integration

Images

↓

Supabase Buckets

Database stores

image_url

Only.

Never binary.

Structure

product-images/

hero/

catalog/

products/

avatars/
Checkout Flow
Customer

↓

Cart

↓

API

↓

Validation

↓

Checkout Service

↓

Inventory Service

↓

Payment Service

↓

Order Repository

↓

Shipment Repository

↓

Success
Transaction Flow

Inside

Checkout Service

BEGIN

↓

Create Order

↓

Create Items

↓

Reduce Stock

↓

Create Shipment

↓

Clear Cart

↓

COMMIT

Failure

↓

ROLLBACK

Error Handling

Every layer

handles

its own errors.

Frontend

↓

Display Message

API

↓

HTTP Response

Service

↓

Business Errors

Repository

↓

Database Errors

Example

Inventory

0

↓

Throw

OUT_OF_STOCK

API

↓

409 Conflict.

Standard API Responses

Success

{
  "success": true,
  "data": {}
}

Failure

{
  "success": false,
  "error": {
    "code": "OUT_OF_STOCK",
    "message": "Selected variant is unavailable."
  }
}

Consistent responses simplify frontend development.

Logging

Every important operation

should log

timestamp
user
endpoint
duration
errors

Useful for

debugging
monitoring
analytics
Rate Limiting

Protect endpoints like

/login

/register

/contact

/reviews

/payments/webhook

against abuse.

Caching Strategy

Cache frequently accessed

categories
featured products
banners
settings

Avoid caching

carts
orders
payments

because they change frequently.

Dependency Flow
Frontend

↓

API

↓

Validation

↓

Service

↓

Repository

↓

Supabase

↓

PostgreSQL

Allowed

Repository

↓

Service

❌ No

Service

↓

API

Never.

Dependencies should always point downward.

Backend Responsibilities
Layer	Responsibility
Frontend	UI, user interactions
API	Routing, authentication, validation
Validators	Input validation
DTOs	API contracts
Services	Business rules and workflows
Repositories	Database access
Supabase	Database, Storage, Auth
PostgreSQL	Data persistence
Example: Add to Cart Request
User Clicks "Add to Cart"

↓

POST /api/cart

↓

Validate variant_id

↓

Authenticate user

↓

Cart Service

↓

Check variant exists

↓

Check stock

↓

Repository

↓

Insert cart_item

↓

Return updated cart
Example: Checkout Request
Customer clicks Checkout

↓

POST /api/checkout

↓

Validate request

↓

Authenticate

↓

Load cart

↓

Validate inventory

↓

Apply coupon

↓

Calculate totals

↓

Create order

↓

Create order items

↓

Reduce stock

↓

Create shipment

↓

Create payment record

↓

Clear cart

↓

Return order summary
Example: Razorpay Payment Flow
Frontend

↓

Create Razorpay Order

↓

Razorpay Checkout

↓

Payment Success

↓

Webhook

↓

Verify Signature

↓

Payment Service

↓

Update Payment Events

↓

Update Order Status

↓

Create Shipment

↓

Success Response
SOLID Principles Applied

The backend architecture follows SOLID principles:

Single Responsibility: Each layer has one purpose.
Open/Closed: Services can be extended without modifying existing logic.
Liskov Substitution: Repository implementations can be replaced if needed.
Interface Segregation: Small, focused service/repository interfaces.
Dependency Inversion: Higher layers depend on abstractions, not concrete database calls.
Module Responsibilities
Module	Main Responsibilities
Product Service	Catalog, search, featured products, categories
Cart Service	Cart creation, updates, totals
Wishlist Service	Save/remove products
Inventory Service	Stock validation, reservation, deduction
Order Service	Checkout, order creation, status updates
Payment Service	Razorpay integration, verification, payment events
Shipment Service	Shipment creation, tracking updates
Review Service	Review creation, moderation support
Admin Service	Dashboard operations, CMS, settings
Production Readiness Checklist
Feature	Status
Layered Architecture	✅
Repository Pattern	✅
Service Layer	✅
DTO Design	✅
Request Validation Strategy	✅
Error Handling Strategy	✅
Transaction Design	✅
Storage Integration Plan	✅
Payment Workflow	✅
Dependency Flow Defined	✅

Part 7 — RLS, Security, Storage & Production Readiness
Overview

This chapter transforms the WIN-DIA backend from a functional database into a production-ready, secure, and scalable system.

Previous chapters focused on:

Data modeling
Business logic
API architecture

This chapter focuses on:

Database security
Authorization
Storage
Secrets
Deployment
Monitoring
Production operations
Disaster recovery
Scalability

A production backend is not considered complete until these aspects are addressed.

Production Architecture
                    Internet
                        │
                        ▼
               Next.js (Vercel)
                        │
                        ▼
             API / Server Actions
                        │
                        ▼
            Supabase Authentication
                        │
                        ▼
              JWT + Row Level Security
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼
 PostgreSQL Database         Supabase Storage
          │                           │
          ▼                           ▼
       Tables                   Images/Videos
1. Security Philosophy

The backend follows a Zero Trust architecture.

Never trust:
Frontend input
Browser state
localStorage
Hidden form fields
Client-side role checks

Every request must be verified independently.

Security Layers
Frontend Validation

↓

API Validation

↓

Authentication

↓

Authorization

↓

Business Logic

↓

Repository

↓

Row Level Security

↓

Database Constraints

Even if one layer fails,

another still protects the data.

2. Row Level Security (RLS)
What is RLS?

RLS allows PostgreSQL itself to decide

who can

SELECT
INSERT
UPDATE
DELETE

instead of relying entirely on backend code.

Think of it as

Firewall

↓

Inside PostgreSQL
Why RLS?

Imagine someone discovers your

supabaseUrl

anonKey

Without RLS

they could potentially read every table that is exposed.

With RLS

PostgreSQL checks every row.

RLS Architecture
User

↓

JWT

↓

Supabase

↓

RLS Policy

↓

Allowed?

↓

Yes → Return Row

No → Permission Denied
Customer Policies
Profiles

Customer should only read

their own profile.

auth.uid() = id
Addresses
auth.uid() = user_id

Customer cannot read

another customer's address.

Wishlist
auth.uid() = user_id
Cart
auth.uid() = user_id
Cart Items

Customer

↓

Own Cart

↓

Own Items

Orders

Customer

↓

Own Orders

Only.

Reviews

Customer

↓

Own Reviews

Public

↓

Approved Reviews

Admin Policies

Admins should bypass

customer restrictions.

Instead of

role='customer'

check

role='admin'

Admins can

View all products
Manage orders
Approve reviews
Update settings
Upload banners
Public Policies

Some tables

should allow

anonymous

read access.

Examples

Products

Categories

Product Images

Banners

CMS Pages

Settings (public only)

Customers shouldn't need an account

to browse products.

Tables Requiring RLS
Table	RLS
profiles	✅
addresses	✅
wishlists	✅
carts	✅
cart_items	✅
orders	✅
order_items	✅
product_reviews	✅
shipments	✅
tracking_events	✅
payment_events	✅
contact_messages	✅
admin_sessions	✅
Tables With Public Read
Table
products
categories
product_images
banners
page_content
public settings
Service Role

Some operations

must ignore RLS.

Example

Payment webhook.

Razorpay

↓

Backend

↓

Service Role

↓

Update Order

The service role key bypasses RLS.

Never expose it to the frontend.

3. Authentication Strategy

Authentication is entirely handled by Supabase Auth.

Supported methods:

Email/password
Magic links (future)
OAuth providers (future)
Phone OTP (future)

Application logic only checks

auth.uid()

↓

profiles
Role-Based Access Control (RBAC)

Instead of

is_admin=true

use

profiles.role

Current roles

customer

admin

Future

warehouse

support

marketing

manager

super_admin

No schema change required.

Authorization Matrix
Feature	Guest	Customer	Admin
Browse Products	✅	✅	✅
Wishlist	❌	✅	✅
Cart	❌	✅	✅
Checkout	❌	✅	✅
Orders	❌	Own	All
Reviews	Read	Own	All
Products CRUD	❌	❌	✅
Settings	❌	❌	✅
CMS	Read	Read	Edit
Payment Events	❌	❌	✅
4. Supabase Storage
Purpose

Store binary files.

Never store

images

inside PostgreSQL.

Database stores

URLs only.

Storage Architecture
Supabase Storage

│

├── products/

├── hero/

├── catalogue/

├── categories/

├── banners/

├── users/

├── reviews/

└── cms/
Recommended Buckets
products

Stores

Product Images
Gallery Images
banners

Stores

Homepage banners.

users

Stores

Profile photos.

reviews

Stores

Customer review images.

cms

Stores

Blog images

About page

Policies

etc.

Storage Policies

Products

Public Read

Admin Write

Banners

Public Read

Admin Write

Users

Owner Read

Owner Update

Admin Read

Review Images

Public Read

Customer Upload

Admin Delete

Naming Convention

Instead of

image.png

Use

products/

uuid/

front.png

Example

products/

4f5a1...

front.webp

Avoid collisions.

Image Optimization

Recommended

.webp

instead of

PNG

for product images.

Advantages

Smaller
Faster
Better Lighthouse score
Video Optimization

Store

.mp4

(H.264)

Maximum

1080p

unless required.

Avoid huge videos.

Environment Variables

Frontend

NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

Backend

SUPABASE_SERVICE_ROLE_KEY=

RAZORPAY_KEY_SECRET=

SMTP_PASSWORD=

Rule

Anything beginning with NEXT_PUBLIC_ is exposed to the browser.

Never put secrets there.

Secrets Management

Never commit

.env

Git should ignore

.env

.env.local

.env.production
Logging Strategy

Log

Errors
Failed Payments
Login Attempts
Admin Actions
Inventory Errors
Webhooks

Don't log

Passwords
OTPs
JWTs
Card Information
Monitoring

Monitor

API latency
Database latency
Failed checkouts
Payment failures
Storage usage
Authentication failures
Backups

Supabase provides automatic backups

depending on your plan.

Additional recommendation

Weekly

pg_dump

exports

stored securely.

Disaster Recovery

In case of failure

Restore Database

↓

Restore Storage

↓

Deploy Frontend

↓

Restore Environment Variables

↓

Application Online
Production Deployment

Frontend

↓

Vercel

Backend

↓

Supabase

Storage

↓

Supabase Buckets

DNS

↓

Custom Domain

SSL

↓

Automatic

Performance Checklist

Database

✔ Indexes

✔ Constraints

✔ UUID PK

✔ Normalized

Frontend

✔ Image Optimization

✔ Lazy Loading

✔ Next/Image

✔ Code Splitting

Storage

✔ CDN Enabled

✔ WebP Images

✔ Compressed Videos

Rate Limiting

Protect

/login

/register

/contact

/reviews

/webhooks

/checkout

Future

Use

Middleware
Reverse Proxy
Edge Functions
Caching

Cache

Categories
Settings
Banners
Featured Products

Don't Cache

Cart
Orders
Payments
Inventory
Data Retention

Suggested policy

Data	Retention
Orders	Permanent
Payment Events	Permanent
Login Attempts	90 Days
OTP Records	30 Days
Admin Sessions	1 Year
Tracking Events	Permanent
Contact Messages	2 Years
Audit Trail

Always record

Admin actions
Status changes
Payments
Shipments

Never delete

historical records.

Prefer

Soft Delete

or

Archive

over permanent deletion where business records are involved.

Scalability Roadmap

Current design supports

Thousands of users
Hundreds of thousands of orders
Multiple product variants
Multiple images
Multiple shipments

Future upgrades

Redis caching
Elasticsearch / PostgreSQL Full-Text Search
Background job queue (Inngest, Trigger.dev, or similar)
Multi-region deployment
CDN image transformations
Read replicas
Analytics warehouse
Event-driven architecture

without major schema redesign.

Production Readiness Checklist
Database
✅ Normalized schema
✅ Primary Keys
✅ Foreign Keys
✅ Constraints
✅ Indexes
✅ Triggers
Backend
⏳ Repository Layer
⏳ Service Layer
⏳ API Routes
⏳ DTO Validation
⏳ Transactions
Security
⏳ Enable RLS
⏳ Write Policies
⏳ Role Checks
⏳ Secret Rotation
⏳ Rate Limiting
Storage
⏳ Create Buckets
⏳ Storage Policies
⏳ Upload Validation
⏳ Image Optimization
Payments
⏳ Razorpay Integration
⏳ Webhook Verification
⏳ Payment Events
⏳ Refund Handling
Monitoring
⏳ Logging
⏳ Alerts
⏳ Backups
⏳ Performance Monitoring
Final Architecture Summary
                           WIN-DIA

                         Next.js 16
                              │
                              ▼
                 API Routes / Server Actions
                              │
                              ▼
                    Authentication (Supabase)
                              │
                              ▼
                    Validation + Authorization
                              │
                              ▼
                    Business Logic Services
                              │
                              ▼
                     Repository Layer
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
  PostgreSQL Database                    Supabase Storage
          │                                       │
          ▼                                       ▼
   Tables • Views • RPCs                  Images • Videos
   Indexes • Triggers
   RLS • Policies
Overall Project Progress

Based on the work you've completed and the architecture we've designed:

Area	Status
Database Schema	✅ Complete
Relationships (PK/FK)	✅ Complete
Constraints	✅ Complete
Indexes	✅ Complete
Triggers	✅ Complete
Architecture Documentation	✅ Complete
Frontend Shop UI	🚧 In Progress
Supabase Storage Design	✅ Planned
API Layer	⏳ Next Phase
Business Logic	⏳ Next Phase
Repository Layer	⏳ Next Phase
RLS Policies	⏳ Ready to Implement
Production Deployment	⏳ Final Phase
Conclusion

The seven parts together define a production-oriented backend architecture:

Architecture & Design Philosophy established the overall system structure.
Core Tables modeled users, products, categories, images, and variants.
Commerce Tables covered wishlists, carts, orders, and order items.
Supporting Modules documented fulfillment, customer engagement, security, and CMS.
Indexes, Triggers & Helper Functions optimized performance and consistency.
API Layer & Business Logic defined how the application interacts with the database.
RLS, Security, Storage & Production Readiness completed the operational and security design needed for deployment.