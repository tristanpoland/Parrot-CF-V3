# Mock CF API Server

## Directory Structure
```
mock-api/
├── server.js
├── package.json
└── data/
    ├── apps.json              # List of all apps
    ├── apps/                  # Individual app details
    │   ├── app-guid-1.json
    │   └── app-guid-2.json
    ├── spaces.json           # List of all spaces
    ├── spaces/              # Individual space details
    │   └── space-guid-1.json
    ├── events.json          # List of all events
    ├── services.json        # List of all services
    ├── user.json           # User profile data
    └── stats.json          # System statistics
```

## Usage

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
node server.js
```

3. Default credentials:
- Username: admin
- Password: password

## Adding New Data

Simply add new JSON files to the appropriate directory. The server will automatically serve them based on the requested path.

Example paths:
- GET /v3/apps -> serves data/apps.json
- GET /v3/apps/app-guid-1 -> serves data/apps/app-guid-1.json
- GET /v3/spaces -> serves data/spaces.json

## Pagination

All list endpoints support pagination using query parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 10)

Example: GET /v3/apps?page=2&limit=5