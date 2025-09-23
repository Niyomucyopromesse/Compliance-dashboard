# Fraud Detection Dashboard Frontend

A modern React + TypeScript frontend for fraud detection and monitoring systems.

## Features

- **Real-time Dashboard**: Live fraud monitoring with WebSocket integration
- **Transaction Management**: View and analyze suspicious transactions
- **Customer Management**: Monitor customer risk profiles and accounts
- **Alert System**: Real-time fraud alerts with acknowledgment workflow
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Type Safety**: Full TypeScript implementation
- **Modern Stack**: React 18, Vite, TanStack Query, Recharts

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Recharts** for data visualization
- **Lucide React** for icons
- **WebSocket** for real-time updates

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Basic UI components
│   ├── charts/         # Chart components
│   ├── layout/         # Layout components
│   ├── dashboard/      # Dashboard-specific components
│   ├── tables/         # Data table components
│   ├── customers/      # Customer management components
│   ├── accounts/       # Account management components
│   ├── monitoring/     # Fraud monitoring components
│   └── transactions/   # Transaction components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API and WebSocket services
├── contexts/           # React contexts
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── styles/             # Global styles
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

### API Integration

The frontend expects a REST API with the following endpoints:

- `GET /api/overview` - Dashboard metrics
- `GET /api/transactions` - Transaction list
- `GET /api/customers` - Customer list
- `GET /api/accounts` - Account list
- `GET /api/alerts` - Alert list
- `WebSocket /ws` - Real-time updates

## Component Architecture

### Layout Components

- **AppLayout**: Main application layout with sidebar and topbar
- **Sidebar**: Navigation sidebar with collapsible menu
- **Topbar**: Top navigation with search and controls
- **Breadcrumbs**: Navigation breadcrumbs

### Dashboard Components

- **OverviewCards**: Key metrics display
- **TransactionsChart**: Transaction volume chart
- **RiskDistributionPie**: Risk level distribution
- **TransactionsTableCard**: Recent transactions table

### Data Management

- **DataTable**: Generic data table with sorting and pagination
- **PaginatedFooter**: Pagination controls
- **LiveFeed**: Real-time data feed

## State Management

### Contexts

- **AuthContext**: User authentication state
- **UIContext**: UI preferences and settings

### Hooks

- **useMetrics**: Dashboard metrics data
- **useTransactions**: Transaction data management
- **useCustomers**: Customer data management
- **useLiveFeed**: Real-time WebSocket feed

## Styling

The project uses Tailwind CSS with custom component classes:

- `.btn` - Button base styles
- `.card` - Card container styles
- `.input` - Form input styles
- `.metric-card` - Metric card styles

## Type Safety

All components are fully typed with TypeScript:

- API response types in `types/api.d.ts`
- Component prop interfaces
- Hook return types
- Context types

## Development

### Adding New Components

1. Create component file in appropriate directory
2. Define TypeScript interfaces for props
3. Export from component directory index
4. Add to main component exports

### Adding New Pages

1. Create page component in `pages/`
2. Add route in `routes/index.tsx`
3. Update navigation in `Sidebar.tsx`

### API Integration

1. Add API functions in `services/api.ts`
2. Create corresponding hooks in `hooks/`
3. Define types in `types/api.d.ts`

## Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - see LICENSE file for details.
