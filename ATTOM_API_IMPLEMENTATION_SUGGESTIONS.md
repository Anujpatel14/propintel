This is exactly how I would design it. I wouldn't let Cursor directly integrate ATTOM APIs everywhere. Instead, I'd introduce a **Property Search Service** that acts as a layer between our frontend and ATTOM. That gives us caching, API abstraction, rate limiting, and makes it easy to swap ATTOM for Zillow, RentCast, or another provider in the future. ATTOM's APIs are endpoint-based and authenticated with an `apikey` header, supporting searches by address, location, radius, and other filters. ([ATTOM Help Center][1])

---

# ATTOM Property Search & Listing Integration

### Technical Design Document (Cursor Specification)

---

# Objective

Integrate the ATTOM Property Data API into the Real Estate SaaS platform to provide investors with a seamless property discovery experience.

Instead of manually entering every property, investors should be able to:

* Search for properties by location
* Browse property listings
* Apply filters
* View property details
* Import a property into our platform
* Continue using all existing platform features (analysis, AI, reports, CRM, etc.)

The ATTOM integration **does not replace** our application's Property Analysis feature.

It is simply the entry point into the workflow.

---

# Overall User Flow

```text
Investor Dashboard

↓

Property Search

↓

ATTOM API

↓

Property Listing

↓

Property Details

↓

Import Property

↓

Our Database

↓

Property Analysis

↓

AI Analysis

↓

Save Deal

↓

CRM Pipeline

↓

Generate Report
```

---

# New Sidebar Module

```text
Investor

Dashboard

Property Explorer   ⭐ NEW

My Properties

Calculators

Saved Deals

CRM

Reports

AI Assistant

Maps

Billing

Settings
```

> Rename "Properties" to **Property Explorer** for ATTOM-powered search, and use **My Properties** for imported/saved properties.

---

# High-Level Architecture

Never call ATTOM directly from the frontend.

```text
Next.js Frontend

↓

Next.js API Route

↓

Property Service

↓

ATTOM Service

↓

ATTOM API
```

Responsibilities:

### Frontend

* Search UI
* Filters
* Listing Grid
* Property Details
* Pagination

---

### Property Service

Responsible for

* Validation
* Caching
* Mapping ATTOM response to our internal model
* Pagination normalization
* Error handling
* Logging

---

### ATTOM Service

Only responsible for

* Calling ATTOM
* API authentication
* Endpoint selection
* Returning raw response

---

# New Module

## Property Explorer

Purpose

Allow investors to discover investment opportunities.

---

## Main Page

```
/investor/property-explorer
```

Layout

```
----------------------------------------------

Search Bar

----------------------------------------------

Filters

----------------------------------------------

Map | Grid Toggle

----------------------------------------------

Property Cards

----------------------------------------------

Pagination

----------------------------------------------
```

---

# Search Bar

Allow searching by

* Address
* ZIP Code
* City
* State

Examples

```
Austin

Dallas

90210

123 Main Street
```

Search requests should call the appropriate ATTOM search endpoint depending on the input. ATTOM supports lookups by address as well as broader location-based searches. ([ATTOM Help Center][2])

---

# Filters

Suggested filters

### Location

* State
* City
* ZIP Code
* Radius

---

### Property

* Property Type
* Bedrooms
* Bathrooms
* Square Feet
* Lot Size
* Year Built

---

### Pricing

* Minimum Price
* Maximum Price

---

### Investment

* Estimated Value
* Estimated Rent
* Tax Amount

---

### Sorting

* Newest
* Highest Price
* Lowest Price
* Highest Estimated Value
* Largest Area

ATTOM supports many of these query parameters and sorting capabilities on search/snapshot endpoints. ([Postman][3])

---

# Listing Cards

Each card should display

```
Image (fallback if unavailable)

Address

City

State

ZIP

Bedrooms

Bathrooms

Square Feet

Lot Size

Estimated Value

Rent Estimate

Property Type

View Details Button
```

Never perform calculations here.

Listing page = discovery only.

---

# Property Details

Route

```
/investor/property-explorer/[attomId]
```

Sections

---

## Header

Address

Favorite Button

Import Button

---

## Gallery

Property Images

---

## Overview

Bedrooms

Bathrooms

Garage

Year Built

Stories

Construction

Property Type

---

## Financial

Estimated Value

Estimated Rent

Tax

Assessment

---

## Map

Google Maps

Nearby Schools

Transit

Parks

Shopping

---

## Public Records

Owner Information (if licensing allows)

Parcel Number

Legal Description

Lot Size

APN

---

## Description

General Property Information

---

## Action Panel

```
Analyze Property

Import Property

Generate Report (disabled until imported)

Save Deal (disabled until imported)
```

---

# Import Property

When the user clicks

```
Import Property
```

The system should:

* Fetch full ATTOM property details
* Map ATTOM fields to our internal Property schema
* Save the property
* Link it to the current investor
* Open the Property Analysis page

The imported property becomes independent from ATTOM.

From that point forward

Everything uses our database.

This is important.

---

# Internal Workflow

```
ATTOM Property

↓

Import

↓

Properties Table

↓

Property Analysis

↓

AI Analysis

↓

Saved Deal

↓

CRM

↓

Reports
```

---

# Property Mapping

Create a dedicated mapper.

Example

```
ATTOM

↓

PropertyMapper

↓

Our Property Model
```

Never use ATTOM's response directly throughout the app.

Benefits

* Cleaner code
* Easier maintenance
* Easier provider replacement
* Stable database

---

# Suggested Internal Property Model

```ts
Property

id

userId

attomId

address

city

state

zip

latitude

longitude

propertyType

bedrooms

bathrooms

yearBuilt

squareFeet

lotSize

estimatedValue

estimatedRent

taxAmount

images

source

createdAt
```

---

# Property Source

Every property should have

```
source

ATTOM

Manual

Imported CSV

Future MLS
```

This future-proofs the platform.

---

# Search History

Keep

```
Recent Searches

Austin

Dallas

90210

Miami
```

Improves UX.

---

# Saved Searches (Future)

Allow

```
Austin

ROI > 12%

3+ Bedrooms
```

and notify users when new matching properties become available.

---

# Caching Strategy

Avoid hitting ATTOM on every request.

Cache search results and property details server-side for a reasonable TTL (for example, 15–60 minutes depending on freshness needs), then refresh after expiry. This reduces latency, controls API costs, and helps stay within ATTOM plan limits.

---

# Rate Limiting

Protect the ATTOM API.

```
User

↓

Search

↓

Our Rate Limiter

↓

ATTOM
```

Never expose API keys.

ATTOM authentication should only happen from the server using the `apikey` request header. ([ATTOM Help Center][1])

---

# Error Handling

If ATTOM fails

Show

```
Unable to fetch properties.

Please try again later.
```

Never crash the application.

---

# Empty State

```
No properties found.

Try another city or change filters.
```

---

# Future Enhancements (Do Not Build Now)

* Saved Searches
* Favorite ATTOM Properties (without importing)
* Compare Properties
* Draw Search Area on Map
* Heat Maps
* Investment Score in Search Results
* MLS Integration
* Market Trends

---

# Definition of Done

The feature is complete when:

* Investors can search by address, city, ZIP, or state.
* Investors can filter and sort search results.
* A responsive property listing page displays ATTOM results.
* Clicking a property opens a detailed property page.
* Investors can import an ATTOM property into the platform.
* Imported properties become part of our database.
* Imported properties can be analyzed with calculators.
* AI analysis works on imported properties.
* Imported properties can be saved as deals.
* Imported properties can enter the CRM pipeline.
* Reports can be generated from imported properties.
* All ATTOM communication is handled securely through backend services.
* No ATTOM API key or raw endpoint is exposed to the frontend.

## One recommendation beyond the original proposal

I would **not** make ATTOM the application's primary data store.

Treat ATTOM as an **external data provider** only. The moment a user clicks **Import Property**, copy the relevant property data into your own PostgreSQL database and let the rest of the platform (analysis, AI, CRM, reports, portfolio) operate on your own records. This decouples your business logic from ATTOM's response format, reduces repeated API calls, improves performance, and allows you to support additional providers in the future without rewriting the rest of the application.

[1]: https://support.attomdata.com/articles/3952343496-what-is-the-attom-property-data-api?utm_source=chatgpt.com "What Is the ATTOM Property Data API?"
[2]: https://support.attomdata.com/articles/2124023234-api-endpoints-overview?utm_source=chatgpt.com "API Endpoints Overview"
[3]: https://www.postman.com/api-evangelist/attom/request/2vhoibv/returns-properties-and-their-characteristics-that-fit-a-criteria?utm_source=chatgpt.com "Returns properties and their characteristics that fit a criteria. | Attom Data Solutions API | Postman API Network"
