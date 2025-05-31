# Express Plugin

An Express.js plugin for the base plugin system that provides HTTP server functionality and allows other plugins to extend the Express application with routes, middleware, and server lifecycle hooks.

## Features

- **Express Integration**: Seamlessly integrates Express.js with the base plugin system
- **Two-phase Express Initialization**: Supports `initExpress` and `postInitExpress` hooks for Express-specific setup
- **Plugin Extensibility**: Other plugins can easily add routes, middleware, and Express functionality
- **Environment Configuration**: Configurable port via environment variables
- **Graceful Shutdown**: Built-in server stop functionality
- **App Access**: Provides access to the Express application instance

## Installation

```bash
npm install express
npm install @types/express  # If using TypeScript
```

## API

### ExpressHooks Interface

```typescript
interface ExpressHooks {
  initExpress?: (app: express.Application, stop: () => void) => MaybePromise<void>;
  postInitExpress?: () => MaybePromise<void>;
}
```

- **`initExpress`**: Called when the Express app is being configured. Receives the Express app instance and a stop function.
- **`postInitExpress`**: Called after all Express initialization is complete, just before the server starts listening.

### ExpressPlugin Interface

```typescript
interface ExpressPlugin extends BaseHooks {
  name: "express";
  port: number;
  getExpressApp: () => express.Application;
}
```

- **`name`**: Always "express" - used for plugin identification
- **`port`**: The port the server will listen on
- **`getExpressApp()`**: Returns the Express application instance

## Usage

### Basic Setup

```typescript
import { initPlugins } from 'base-plugin-system';
import { expressPlugin } from 'express-plugin-system';

// Initialize with just the Express plugin
const plugins = [expressPlugin()];
await initPlugins(plugins);

// Server is now running on port 5173 (or PORT env var)
```

### Environment Configuration

```bash
# Set custom port
export PORT=3000
```

Or in your application:
```typescript
process.env.PORT = '3000';
```

### Creating Express-Enabled Plugins

```typescript
import { BaseHooks, ExpressHooks } from 'base-plugin-system';
import { ExpressPlugin } from 'express-plugin-system';
import express from 'express';

// API Routes Plugin
const apiPlugin = (): BaseHooks & ExpressHooks => ({
  name: 'api',
  
  initExpress: async (app, stop) => {
    // Add middleware
    app.use(express.json());
    app.use('/api', express.Router());
    
    // Add routes
    app.get('/api/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
    
    app.get('/api/users', (req, res) => {
      res.json([
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' }
      ]);
    });
  },
  
  postInitExpress: async () => {
    console.log('API routes initialized');
  }
});

// Authentication Plugin
const authPlugin = (): BaseHooks & ExpressHooks => ({
  name: 'auth',
  
  initExpress: async (app, stop) => {
    // Add auth middleware
    const authenticateToken = (req: any, res: any, next: any) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.sendStatus(401);
      }
      
      // Verify token logic here
      req.user = { id: 1, username: 'user' }; // Mock user
      next();
    };
    
    // Protected routes
    app.use('/api/protected', authenticateToken);
    
    // Auth routes
    app.post('/api/login', (req, res) => {
      // Login logic
      res.json({ token: 'mock-jwt-token' });
    });
  }
});

// Initialize all plugins
const plugins = [
  expressPlugin(),
  apiPlugin(),
  authPlugin()
];

await initPlugins(plugins);
```

### Accessing Other Plugins

```typescript
const integratedPlugin = (): BaseHooks & ExpressHooks => ({
  name: 'integrated',
  
  init: async (plugins) => {
    // Find the Express plugin during base initialization
    const expressPlugin = plugins.find(p => p.name === 'express') as ExpressPlugin;
    console.log(`Express will run on port: ${expressPlugin.port}`);
  },
  
  initExpress: async (app, stop) => {
    // Express-specific initialization
    app.get('/api/info', (req, res) => {
      res.json({ 
        message: 'Integrated plugin active',
        port: process.env.PORT || 5173
      });
    });
  },
  
  postInitExpress: async () => {
    // Access the Express app after initialization
    const plugins = /* get plugins reference */;
    const expressPlugin = plugins.find(p => p.name === 'express') as ExpressPlugin;
    const app = expressPlugin.getExpressApp();
    
    // Can add additional configuration here
  }
});
```

## Initialization Flow

1. **Base `init` phase**: Express plugin reads PORT environment variable
2. **Express app creation**: Creates Express application instance
3. **`initExpress` phase**: All plugins with Express hooks configure the app
4. **`postInitExpress` phase**: Final Express setup before server starts
5. **Server start**: Express server begins listening on the configured port

## Configuration

### Environment Variables

- **`PORT`**: Server port (defaults to 5173)

### Example .env file
```env
PORT=3000
NODE_ENV=production
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 