# Project Structure: NestBloq

## 📁 Backend Directory Structure (`backend/`)

The backend is built using FastAPI and SQLAlchemy (PostgreSQL).

```text
backend/
├── alembic/                  # Database migration configuration and scripts
├── alembic.ini               # Alembic configuration file
├── requirements.txt          # Python dependencies
├── .env.example              # Example env configurations
└── app/                      # Main Application Source Code
    ├── main.py               # Application entrypoint & CORS setup
    ├── config.py             # Settings and configuration loader
    ├── database.py           # Database engine & session setup
    ├── init_db.py            # Initial DB tables and seed data setup
    ├── dependencies/         # Reusable dependencies (auth check, db session injection)
    ├── models/               # SQLAlchemy Models (DB entities)
    │   ├── amenity.py
    │   ├── audit_log.py
    │   ├── community.py
    │   ├── contract.py
    │   ├── user.py
    │   └── ...
    ├── routers/              # API Controllers (Request endpoints)
    │   ├── auth.py
    │   ├── amenity.py
    │   ├── community.py
    │   ├── contract.py
    │   └── ...
    ├── services/             # Core business logic services
    │   ├── amenity_service.py
    │   ├── contract_service.py
    │   └── ...
    ├── schemas/              # Pydantic schemas for data validation
    └── utils/                # Helper functions/utilities (encryption, mailers, files)
```

---

## 📁 Frontend Directory Structure (`frontend/hoa-portal/`)

The frontend is a modern React application built with Vite, React Router, Tailwind CSS, and Axios.

```text
frontend/hoa-portal/
├── index.html                # Entry HTML page
├── package.json              # Client dependencies and npm scripts
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── src/                      # Frontend Source Code
    ├── main.jsx              # Application entrypoint
    ├── App.jsx               # Routes setup & context wrappers
    ├── App.css               # Global application styles
    ├── index.css             # Tailwind imports and customized styles
    ├── assets/               # Static assets (images, logos, SVGs)
    ├── components/           # Reusable UI component library (buttons, modals, tables, layout)
    ├── context/              # React Context Providers (Auth, Community contexts)
    ├── services/             # API layer using Axios to communicate with the backend
    └── pages/                # Page/Route level components
        ├── auth/             # Login, Signup, OTP Verification, and Onboarding
        ├── marketing/        # Public facing pages (Landing, Features, Pricing, About, Contact)
        │   ├── solutions/    # Solution specific pages (Apartment, Condo, HOA, Rental)
        │   ├── LandingPage.jsx
        │   ├── FeaturesPage.jsx
        │   ├── PricingPage.jsx
        │   ├── AboutPage.jsx
        │   ├── ContactPage.jsx
        │   └── HowItWorksPage.jsx
        ├── Dashboard.jsx     # Combined Overview and user dashboards
        ├── Amenity.jsx       # Amenity bookings and listings page
        ├── Contracts.jsx     # Service Provider Contracts
        ├── Meetings.jsx      # Minutes and meetings scheduler
        ├── Payments.jsx      # Assessment & maintenance bill payment
        └── ...
```
