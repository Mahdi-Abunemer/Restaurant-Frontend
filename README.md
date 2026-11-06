# Food Delivery Frontend

A multi-page restaurant ordering website built with HTML, CSS, and vanilla JavaScript, with no framework or build tools.

## About the Project

The application lets customers order food online from start to finish: they can browse a restaurant's menu, build a cart, place an order for delivery, track it, and rate the dishes they received.

This repository contains the frontend only. Menu data, accounts, carts, and orders are handled by a separate hosted REST API, which the frontend consumes.

## Features

- **Menu browsing:** paginated dish list with category and vegetarian filters, plus sorting by name, price, or rating
- **Dish details:** a dedicated page for each dish
- **User accounts:** registration, login, logout, and profile editing
- **Shopping cart:** add and remove dishes, change quantities, and see the total price
- **Checkout:** place an order with a delivery address and time
- **Order management:** order history, order details, and delivery confirmation
- **Dish ratings:** 1 to 10 star ratings, available once the API confirms the user can rate the dish (after delivery)

## Technical Highlights

- **REST API integration:** uses the Fetch API with async/await for reading and updating data, including `GET`, `POST`, `PUT`, and `DELETE` requests
- **Token-based authentication:** stores a bearer token in `localStorage`, sends it with protected requests, and updates the navbar based on login state
- **Shareable filter state:** keeps filters, sorting, and page number in the URL using the History API, so browser back and forward work ([js/main.js](js/main.js))
- **Dynamic rendering:** builds page content from HTML `<template>` elements using DOM APIs
- **Form validation and error handling:** validates input on the client, formats phone numbers as they are typed, and displays server validation errors ([registration/reg.js](registration/reg.js))
- **Shared navigation:** loads one navbar file into each page at runtime ([navbar.html](navbar.html))

## Technology Stack

| Area | Technologies |
| --- | --- |
| Languages | HTML, CSS, JavaScript |
| Browser APIs | Fetch, History, Web Storage (`localStorage`) |
| Libraries (via CDN) | [SweetAlert2](https://sweetalert2.github.io/) for alerts, [Boxicons](https://boxicons.com/) for icons |

## Backend API

The frontend integrates with an existing REST API, which provides its menu, account, cart, order, and rating functionality. The backend is an external dependency and is not part of this project.

- **Base URL:** `https://food-delivery.int.kreosoft.space/api`
- **Documentation:** [Swagger UI](https://food-delivery.int.kreosoft.space/swagger/index.html)

The base URL is defined in [js/config.js](js/config.js), and page scripts call the API directly with `fetch`. Request bodies are sent as JSON, and protected requests send the user's token in an `Authorization: Bearer` header.

| Resource | Endpoints used |
| --- | --- |
| Account | `/account/register`, `/account/login`, `/account/logout`, `/account/profile` |
| Dishes | `/dish`, `/dish/{id}`, `/dish/{id}/rating`, `/dish/{id}/rating/check` |
| Cart | `/basket`, `/basket/dish/{id}` |
| Orders | `/order`, `/order/{id}`, `/order/{id}/status` |

## Project Structure

Each page has its own folder containing its HTML and JavaScript. Stylesheets and shared scripts are kept separately.

```text
├── index.html       # Main menu page
├── navbar.html      # Shared navigation bar
├── css/             # Stylesheets for each page
├── js/
│   ├── config.js    # API base URL
│   ├── main.js      # Menu, cart, and rating logic
│   └── navbar.js    # Login state and logout
├── login/           # Login
├── registration/    # Registration
├── Profile/         # User profile
├── item/            # Dish details
├── cart/            # Shopping cart
├── purchase/        # Checkout
├── orders/          # Order history
└── order/           # Order details
```

## Running Locally

There are no dependencies to install or build steps to run. You need a modern web browser, internet access for the API and CDN libraries, and a local static web server. The steps below use Python 3, but another server, such as the VS Code Live Server extension, also works.

1. Clone the repository:

   ```bash
   git clone https://github.com/Mahdi-Abunemer/Restaurant-Frontend.git
   cd Restaurant-Frontend
   ```

2. Serve the repository root:

   ```bash
   python -m http.server 8000
   ```

3. Open <http://localhost:8000>.

The site must be served from the web root. Opening `index.html` directly from disk or hosting it in a subfolder will break its navbar loading and page links.

## Configuration

No setup is required to run the project. The API base URL is set in [js/config.js](js/config.js). To use a different API, update that value and the two URLs hardcoded in [js/navbar.js](js/navbar.js).
