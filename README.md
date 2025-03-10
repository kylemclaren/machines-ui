<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/4fbf64b5-9ee9-4d6a-97cf-baf54105265b">
    <img src="https://github.com/user-attachments/assets/dc867946-08a3-41d8-9607-a91956b56350"</img>
  </picture>
</div>

# Machines UI

A modern dashboard for managing your Fly.io resources through the Machines API. This dashboard provides a clean interface for monitoring and managing your Fly Apps, Machines, and volumes.

## Features

- **Authentication**: Securely authenticate with your Fly.io API token
- **Apps Management**: View, search, and manage your Fly.io applications
- **Machines Management**: Monitor, filter, and control your virtual machines
- **Volumes Management**: View and manage your persistent storage volumes
- **Responsive Design**: Works across desktop and mobile devices

## Prerequisites

- A Fly.io account with API access
- Node.js 18+ and bun 1.0.0+

## Getting Started

1. Clone the repository

   ```bash
   git clone https://github.com/kylemclaren/machines-ui.git
   cd machines-ui
   ```

2. Install dependencies

   ```bash
   bun install
   ```

3. Run the development server

   ```bash
   bun run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Authentication

To use the dashboard, you'll need to authenticate with your Fly.io API token:

1. Download the [Fly CLI]((https://fly.io/docs/flyctl/install/))
2. Generate an API token with `fly tokens create org`
3. Enter your token in the login screen of the dashboard

## Deploy to Fly.io

To deploy the app tp Fly.io, simply run:

   ```bash
   fly launch --from https://github.com/kylemclaren/machines-ui.git
   ```

## API Documentation

This dashboard is built on top of the official [Fly.io Machines API](https://fly.io/docs/machines/api/). For more information on the API endpoints and capabilities, refer to the [official documentation](https://fly.io/docs/machines/api/).

## Tech Stack

- **Next.js 15**: React framework for server-side rendering and static site generation
- **React 19**: UI library for building component-based interfaces
- **TailwindCSS 4**: Utility-first CSS framework
- **React Query**: Data fetching and state management
- **Axios**: HTTP client for API requests

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Fly.io](https://fly.io/) for the Machines API
- [shadcn](https://ui.shadcn.com/) for UI components
