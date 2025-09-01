# Twitter Clone Backend

> **Note:** This project is currently under development.

## API Documentation

The API is documented using Swagger. To view the API documentation:

1. Download the `twitter-swagger.yaml` file from this repository
2. Go to [Swagger Editor](https://editor.swagger.io/)
3. Click **File** → **Import File** → Choose the downloaded YAML file

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB
- [Other requirements]

### Installation

1. Clone the repository
2. Install dependencies:
    ```bash
    cd Backend
    npm install
    ```
3. Set up environment variables
4. Start the development server:
    ```bash
    npm run dev
    ```

## Project Structure

- `src/controllers/` - Request handlers
- `src/middlewares/` - Express middlewares
- `src/models/` - Data models
- `src/routes/` - API routes
- `src/services/` - Business logic
- `src/utils/` - Helper functions

## Features

- User authentication
- Tweet creation and interaction
- Media upload and processing
- Bookmarks and likes
- ...

## Technologies Used

- TypeScript
- Express.js
- MongoDB
- [Other technologies]
