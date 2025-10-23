import { jest } from '@jest/globals';

const mockRouter = {
  post: jest.fn(),
  get: jest.fn(),
};

const mockExpressRouter = jest.fn(() => mockRouter);

jest.unstable_mockModule('express', () => ({
  Router: mockExpressRouter,
}));

const mockSignup = jest.fn();

jest.unstable_mockModule('../../controllers/auth.controller.js', () => ({
  signup: mockSignup,
}));

describe('Auth Routes', () => {
  let router;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Import the route module
    router = (await import('../../routes/auth.route.js')).default;
  });

  describe('Router Setup', () => {
    test('should create a new Express Router', () => {
      expect(mockExpressRouter).toHaveBeenCalled();
    });

    test('should export router instance', () => {
      expect(router).toBe(mockRouter);
    });
  });

  describe('POST /signup Route', () => {
    test('should register POST route for /signup', () => {
      expect(mockRouter.post).toHaveBeenCalledWith('/signup', mockSignup);
    });

    test('should use signup controller for /signup route', () => {
      const signupCall = mockRouter.post.mock.calls.find(
        (call) => call[0] === '/signup'
      );
      expect(signupCall).toBeDefined();
      expect(signupCall[1]).toBe(mockSignup);
    });

    test('should register /signup as POST not GET', () => {
      expect(mockRouter.post).toHaveBeenCalledWith(
        '/signup',
        expect.any(Function)
      );
      
      const getSignupCall = mockRouter.get.mock.calls.find(
        (call) => call[0] === '/signup'
      );
      expect(getSignupCall).toBeUndefined();
    });
  });

  describe('GET /login Route', () => {
    test('should register GET route for /login', () => {
      const loginCall = mockRouter.get.mock.calls.find(
        (call) => call[0] === '/login'
      );
      expect(loginCall).toBeDefined();
    });

    test('should call router.get for /login', () => {
      expect(mockRouter.get).toHaveBeenCalled();
    });
  });

  describe('GET /logout Route', () => {
    test('should register GET route for /logout', () => {
      const logoutCall = mockRouter.get.mock.calls.find(
        (call) => call[0] === '/logout'
      );
      expect(logoutCall).toBeDefined();
    });

    test('should call router.get for /logout', () => {
      expect(mockRouter.get).toHaveBeenCalled();
    });
  });

  describe('Route Configuration', () => {
    test('should register exactly 3 routes total', () => {
      const totalRoutes =
        mockRouter.post.mock.calls.length + mockRouter.get.mock.calls.length;
      expect(totalRoutes).toBe(3);
    });

    test('should register 1 POST route', () => {
      expect(mockRouter.post).toHaveBeenCalledTimes(1);
    });

    test('should register 2 GET routes', () => {
      expect(mockRouter.get).toHaveBeenCalledTimes(2);
    });

    test('should not register any PUT routes', () => {
      expect(mockRouter.put).toBeUndefined();
    });

    test('should not register any DELETE routes', () => {
      expect(mockRouter.delete).toBeUndefined();
    });

    test('should not register any PATCH routes', () => {
      expect(mockRouter.patch).toBeUndefined();
    });
  });

  describe('Route Paths', () => {
    test('all routes should start with /', () => {
      const allCalls = [
        ...mockRouter.post.mock.calls,
        ...mockRouter.get.mock.calls,
      ];
      
      allCalls.forEach((call) => {
        expect(call[0]).toMatch(/^\//);
      });
    });

    test('should have signup route path', () => {
      const paths = mockRouter.post.mock.calls.map((call) => call[0]);
      expect(paths).toContain('/signup');
    });

    test('should have login route path', () => {
      const paths = mockRouter.get.mock.calls.map((call) => call[0]);
      expect(paths).toContain('/login');
    });

    test('should have logout route path', () => {
      const paths = mockRouter.get.mock.calls.map((call) => call[0]);
      expect(paths).toContain('/logout');
    });

    test('should not have duplicate route paths', () => {
      const allCalls = [
        ...mockRouter.post.mock.calls,
        ...mockRouter.get.mock.calls,
      ];
      const paths = allCalls.map((call) => call[0]);
      const uniquePaths = [...new Set(paths)];
      expect(paths.length).toBe(uniquePaths.length);
    });
  });

  describe('Import Dependencies', () => {
    test('should import signup controller', () => {
      expect(mockSignup).toBeDefined();
    });

    test('should import Router from express', () => {
      expect(mockExpressRouter).toBeDefined();
    });
  });

  describe('Route Handlers', () => {
    test('signup route should have a handler function', () => {
      const signupCall = mockRouter.post.mock.calls.find(
        (call) => call[0] === '/signup'
      );
      expect(signupCall[1]).toBeDefined();
      expect(typeof signupCall[1]).toBe('function');
    });

    test('POST /signup should call imported signup controller', () => {
      const signupCall = mockRouter.post.mock.calls.find(
        (call) => call[0] === '/signup'
      );
      expect(signupCall[1]).toBe(mockSignup);
    });
  });

  describe('Module Exports', () => {
    test('should export router as default', () => {
      expect(router).toBe(mockRouter);
    });

    test('exported router should have post method', () => {
      expect(router.post).toBeDefined();
    });

    test('exported router should have get method', () => {
      expect(router.get).toBeDefined();
    });
  });
});