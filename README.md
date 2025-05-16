# Drone Survey Management System API

A comprehensive backend API for managing drone surveys, mission planning, and reporting.

## Features

- **User Authentication & Authorization**: Secure JWT-based authentication with role-based access control
- **Organization Management**: Multi-tenant architecture with organization-based data isolation
- **Drone Fleet Management**: Track drone inventory, status, and telemetry
- **Mission Planning**: Create and manage survey missions with different patterns (grid, crosshatch, perimeter)
- **Real-time Monitoring**: Socket.io integration for live mission updates
- **Reporting & Analytics**: Generate comprehensive survey reports and organization-wide statistics

## Tech Stack

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **Socket.io**: Real-time bidirectional event-based communication
- **JWT**: Authentication
- **Winston**: Logging
- **Jest**: Testing

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/drone-survey-system.git
   cd drone-survey-system
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   \`\`\`bash
   cp .env.example .env.development
   \`\`\`
   Edit the `.env.development` file with your configuration.

4. Seed the database with sample data:
   \`\`\`bash
   npm run seed
   \`\`\`

5. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

### Production Deployment

1. Set up production environment variables:
   \`\`\`bash
   cp .env.example .env.production
   \`\`\`
   Edit the `.env.production` file with your production configuration.

2. Build and start the production server:
   \`\`\`bash
   npm start
   \`\`\`

### Using Docker

1. Build the Docker image:
   \`\`\`bash
   npm run docker:build
   \`\`\`

2. Run the Docker container:
   \`\`\`bash
   npm run docker:run
   \`\`\`

Alternatively, use Docker Compose:
\`\`\`bash
docker-compose up -d
\`\`\`

## API Documentation

### Authentication

- `POST /api/auth/register`: Register a new user and organization
- `POST /api/auth/login`: Login a user
- `GET /api/auth/profile`: Get current user profile
- `POST /api/auth/users`: Create a new user (admin only)

### Drone Management

- `GET /api/drones`: Get all drones for the organization
- `GET /api/drones/:id`: Get a single drone by ID
- `POST /api/drones`: Create a new drone
- `PATCH /api/drones/:id`: Update a drone
- `DELETE /api/drones/:id`: Delete a drone
- `PATCH /api/drones/:id/telemetry`: Update drone telemetry

### Mission Management

- `GET /api/missions`: Get all missions for the organization
- `GET /api/missions/:id`: Get a single mission by ID
- `POST /api/missions`: Create a new mission
- `PATCH /api/missions/:id`: Update a mission
- `DELETE /api/missions/:id`: Delete a mission
- `POST /api/missions/:id/start`: Start a mission
- `POST /api/missions/:id/pause`: Pause a mission
- `POST /api/missions/:id/resume`: Resume a mission
- `POST /api/missions/:id/abort`: Abort a mission
- `POST /api/missions/:id/complete`: Complete a mission
- `PATCH /api/missions/:id/progress`: Update mission progress

### Reporting

- `GET /api/reports`: Get all reports for the organization
- `GET /api/reports/:id`: Get a single report by ID
- `POST /api/reports`: Create a new report
- `PATCH /api/reports/:id`: Update a report
- `DELETE /api/reports/:id`: Delete a report
- `GET /api/reports/stats/organization`: Get organization-wide statistics

## Testing

Run tests with:
\`\`\`bash
npm test
\`\`\`

## License

This project is licensed under the ISC License.
