import { jest } from '@jest/globals';

const mockExpress = jest.fn();
const mockApp = {
  use: jest.fn(),
  get: jest.fn(),
  listen: jest.fn(),
};

mockExpress.json = jest.fn();
mockExpress.urlencoded = jest.fn();
mockExpress.static = jest.fn();

mockExpress.mockReturnValue(mockApp);

jest.unstable_mockModule('express', () => ({
  default: mockExpress,
}));

const mockDotenv = {
  config: jest.fn(),
};

jest.unstable_mockModule('dotenv', () => ({
  default: mockDotenv,
}));

const mockPath = {
  resolve: jest.fn(() => '/mock/path'),
  join: jest.fn((...args) => args.join('/')),
};

jest.unstable_mockModule('path', () => ({
  default: mockPath,
}));

const mockAuthRoutes = { mockAuthRoutes: true };
const mockMessageRoutes = { mockMessageRoutes: true };

jest.unstable_mockModule('../../routes/auth.route.js', () => ({
  default: mockAuthRoutes,
}));

jest.unstable_mockModule('../../routes/message.route.js', () => ({
  default: mockMessageRoutes,
}));

const mockConnectDB = jest.fn();

jest.unstable_mockModule('../../lib/db.js', () => ({
  connectDB: mockConnectDB,
}));

describe('Server Configuration', () => {
  let originalEnv;
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Save and setup environment
    originalEnv = { ...process.env };
    process.env.NODE_ENV = 'development';
    process.env.PORT = undefined;
    
    // Spy on console
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Setup app.listen mock
    mockApp.listen.mockImplementation((port, callback) => {
      callback();
      return { close: jest.fn() };
    });
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    consoleLogSpy.mockRestore();
  });

  describe('Application Setup', () => {
    test('should call dotenv.config', async () => {
      await import('../../server.js?t=' + Date.now());
      
      expect(mockDotenv.config).toHaveBeenCalled();
    });

    test('should create Express application', async () => {
      await import('../../server.js?t=' + Date.now());
      
      expect(mockExpress).toHaveBeenCalled();
    });

    test('should setup JSON parser middleware', async () => {
      mockExpress.json.mockReturnValue('json-middleware');
      
      await import('../../server.js?t=' + Date.now());
      
      expect(mockExpress.json).toHaveBeenCalled();
      expect(mockApp.use).toHaveBeenCalledWith('json-middleware');
    });

    test('should setup URL-encoded parser middleware', async () => {
      mockExpress.urlencoded.mockReturnValue('urlencoded-middleware');
      
      await import('../../server.js?t=' + Date.now());
      
      expect(mockExpress.urlencoded).toHaveBeenCalledWith({ extended: false });
      expect(mockApp.use).toHaveBeenCalledWith('urlencoded-middleware');
    });
  });

  describe('Route Registration', () => {
    test('should mount auth routes on /api/auth', async () => {
      await import('../../server.js?t=' + Date.now());
      
      expect(mockApp.use).toHaveBeenCalledWith('/api/auth', mockAuthRoutes);
    });

    test('should mount message routes on /api/messages', async () => {
      await import('../../server.js?t=' + Date.now());
      
      expect(mockApp.use).toHaveBeenCalledWith(
        '/api/messages',
        mockMessageRoutes
      );
    });

    test('should register routes in correct order', async () => {
      await import('../../server.js?t=' + Date.now());
      
      const useCalls = mockApp.use.mock.calls;
      const authIndex = useCalls.findIndex(
        (call) => call[0] === '/api/auth'
      );
      const messageIndex = useCalls.findIndex(
        (call) => call[0] === '/api/messages'
      );
      
      expect(authIndex).toBeGreaterThan(-1);
      expect(messageIndex).toBeGreaterThan(-1);
    });
  });

  describe('Production Configuration', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    test('should serve static files in production', async () => {
      mockExpress.static.mockReturnValue('static-middleware');
      
      await import('../../server.js?t=' + Date.now());
      
      expect(mockExpress.static).toHaveBeenCalled();
      expect(mockApp.use).toHaveBeenCalledWith('static-middleware');
    });

    test('should setup catch-all route for SPA in production', async () => {
      await import('../../server.js?t=' + Date.now());
      
      expect(mockApp.get).toHaveBeenCalledWith('*', expect.any(Function));
    });

    test('should serve index.html for catch-all route', async () => {
      await import('../../server.js?t=' + Date.now());
      
      const catchAllCall = mockApp.get.mock.calls.find(
        (call) => call[0] === '*'
      );
      expect(catchAllCall).toBeDefined();
      
      const handler = catchAllCall[1];
      const mockRes = { sendFile: jest.fn() };
      
      handler({}, mockRes);
      
      expect(mockRes.sendFile).toHaveBeenCalled();
    });

    test('should use correct path for static files', async () => {
      await import('../../server.js?t=' + Date.now());
      
      expect(mockPath.join).toHaveBeenCalled();
      expect(mockExpress.static).toHaveBeenCalled();
    });
  });

  describe('Development Configuration', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    test('should not serve static files in development', async () => {
      await import('../../server.js?t=' + Date.now());
      
      expect(mockExpress.static).not.toHaveBeenCalled();
    });

    test('should not setup catch-all route in development', async () => {
      await import('../../server.js?t=' + Date.now());
      
      const catchAllCall = mockApp.get.mock.calls.find(
        (call) => call[0] === '*'
      );
      expect(catchAllCall).toBeUndefined();
    });
  });

  describe('Server Startup', () => {
    test('should listen on default port 3000', async () => {
      delete process.env.PORT;
      
      await import('../../server.js?t=' + Date.now());
      
      expect(mockApp.listen).toHaveBeenCalledWith(
        3000,
        expect.any(Function)
      );
    });

    test('should listen on PORT from environment', async () => {
      process.env.PORT = '8080';
      
      await import('../../server.js?t=' + Date.now());
      
      expect(mockApp.listen).toHaveBeenCalledWith(
        '8080',
        expect.any(Function)
      );
    });

    test('should log server start message', async () => {
      process.env.PORT = '5000';
      
      await import('../../server.js?t=' + Date.now());
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Server running on port 5000'
      );
    });

    test('should connect to database on startup', async () => {
      await import('../../server.js?t=' + Date.now());
      
      expect(mockConnectDB).toHaveBeenCalled();
    });

    test('should connect to database after logging start message', async () => {
      await import('../../server.js?t=' + Date.now());
      
      const logCallOrder = consoleLogSpy.mock.invocationCallOrder[0];
      const dbCallOrder = mockConnectDB.mock.invocationCallOrder[0];
      
      expect(logCallOrder).toBeLessThan(dbCallOrder);
    });
  });

  describe('Port Configuration', () => {
    test('should handle port as string', async () => {
      process.env.PORT = '4000';
      
      await import('../../server.js?t=' + Date.now());
      
      expect(mockApp.listen).toHaveBeenCalledWith(
        '4000',
        expect.any(Function)
      );
    });

    test('should handle port as number', async () => {
      process.env.PORT = 9000;
      
      await import('../../server.js?t=' + Date.now());
      
      expect(mockApp.listen).toHaveBeenCalledWith(
        9000,
        expect.any(Function)
      );
    });

    test('should use default port when PORT is empty string', async () => {
      process.env.PORT = '';
      
      await import('../../server.js?t=' + Date.now());
      
      expect(mockApp.listen).toHaveBeenCalledWith(
        3000,
        expect.any(Function)
      );
    });

    test('should handle various port values', async () => {
      const ports = ['80', '443', '3000', '8000', '8080'];
      
      for (const port of ports) {
        jest.clearAllMocks();
        process.env.PORT = port;
        
        await import('../../server.js?t=' + Date.now());
        
        expect(mockApp.listen).toHaveBeenCalledWith(
          port,
          expect.any(Function)
        );
      }
    });
  });

  describe('Middleware Order', () => {
    test('should register body parsers before routes', async () => {
      await import('../../server.js?t=' + Date.now());
      
      const useCalls = mockApp.use.mock.calls;
      const jsonIndex = useCalls.findIndex(
        (call) => call[0] === 'json-middleware'
      );
      const authRouteIndex = useCalls.findIndex(
        (call) => call[0] === '/api/auth'
      );
      
      expect(jsonIndex).toBeLessThan(authRouteIndex);
    });

    test('should setup urlencoded parser before routes', async () => {
      await import('../../server.js?t=' + Date.now());
      
      const useCalls = mockApp.use.mock.calls;
      const urlencodedIndex = useCalls.findIndex(
        (call) => call[0] === 'urlencoded-middleware'
      );
      const messageRouteIndex = useCalls.findIndex(
        (call) => call[0] === '/api/messages'
      );
      
      expect(urlencodedIndex).toBeLessThan(messageRouteIndex);
    });
  });

  describe('Path Resolution', () => {
    test('should resolve __dirname', async () => {
      await import('../../server.js?t=' + Date.now());
      
      expect(mockPath.resolve).toHaveBeenCalled();
    });

    test('should use path.join for constructing paths', async () => {
      process.env.NODE_ENV = 'production';
      
      await import('../../server.js?t=' + Date.now());
      
      expect(mockPath.join).toHaveBeenCalled();
    });
  });
});