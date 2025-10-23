import { jest } from '@jest/globals';
import { signup, login, logout } from '../../controllers/auth.controller.js';

// Mock dependencies
const mockUser = {
  findOne: jest.fn(),
  prototype: {
    save: jest.fn(),
  },
};

const mockBcrypt = {
  genSalt: jest.fn(),
  hash: jest.fn(),
};

const mockGenerateToken = jest.fn();

// Setup mocks before imports
jest.unstable_mockModule('../../models/User.js', () => ({
  default: mockUser,
}));

jest.unstable_mockModule('bcrypt', () => mockBcrypt);

jest.unstable_mockModule('../../lib/utils.js', () => ({
  generateToken: mockGenerateToken,
}));

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Setup request and response mocks
    req = {
      body: {},
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    // Setup console mocks
    console.error = jest.fn();
  });

  describe('signup', () => {
    describe('Validation Tests', () => {
      test('should return 400 if fullName is missing', async () => {
        req.body = { email: 'test@example.com', password: 'password123' };

        await signup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'All fields are required',
        });
      });

      test('should return 400 if email is missing', async () => {
        req.body = { fullName: 'John Doe', password: 'password123' };

        await signup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'All fields are required',
        });
      });

      test('should return 400 if password is missing', async () => {
        req.body = { fullName: 'John Doe', email: 'test@example.com' };

        await signup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'All fields are required',
        });
      });

      test('should return 400 if all fields are missing', async () => {
        req.body = {};

        await signup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'All fields are required',
        });
      });

      test('should return 400 if password is less than 6 characters', async () => {
        req.body = {
          fullName: 'John Doe',
          email: 'test@example.com',
          password: '12345',
        };

        await signup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Password must be at least 6 characters',
        });
      });

      test('should return 400 if password is exactly 5 characters', async () => {
        req.body = {
          fullName: 'John Doe',
          email: 'test@example.com',
          password: 'abcde',
        };

        await signup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Password must be at least 6 characters',
        });
      });

      test('should return 400 for invalid email format - missing @', async () => {
        req.body = {
          fullName: 'John Doe',
          email: 'testexample.com',
          password: 'password123',
        };

        await signup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Invalid email format',
        });
      });

      test('should return 400 for invalid email format - missing domain', async () => {
        req.body = {
          fullName: 'John Doe',
          email: 'test@',
          password: 'password123',
        };

        await signup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Invalid email format',
        });
      });

      test('should return 400 for invalid email format - missing TLD', async () => {
        req.body = {
          fullName: 'John Doe',
          email: 'test@example',
          password: 'password123',
        };

        await signup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Invalid email format',
        });
      });

      test('should return 400 for invalid email format - spaces', async () => {
        req.body = {
          fullName: 'John Doe',
          email: 'test @example.com',
          password: 'password123',
        };

        await signup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Invalid email format',
        });
      });

      test('should accept valid email with subdomain', async () => {
        req.body = {
          fullName: 'John Doe',
          email: 'test@mail.example.com',
          password: 'password123',
        };

        mockUser.findOne.mockResolvedValue(null);
        mockBcrypt.genSalt.mockResolvedValue('salt');
        mockBcrypt.hash.mockResolvedValue('hashedPassword');

        const mockNewUser = {
          _id: '123',
          fullName: 'John Doe',
          email: 'test@mail.example.com',
          profilePic: '',
          save: jest.fn().mockResolvedValue(true),
        };

        mockUser.mockImplementation(() => mockNewUser);

        await signup(req, res);

        expect(mockUser.findOne).toHaveBeenCalledWith({
          email: 'test@mail.example.com',
        });
      });

      test('should accept valid email with plus sign', async () => {
        req.body = {
          fullName: 'John Doe',
          email: 'test+alias@example.com',
          password: 'password123',
        };

        mockUser.findOne.mockResolvedValue(null);
        mockBcrypt.genSalt.mockResolvedValue('salt');
        mockBcrypt.hash.mockResolvedValue('hashedPassword');

        const mockNewUser = {
          _id: '123',
          fullName: 'John Doe',
          email: 'test+alias@example.com',
          profilePic: '',
          save: jest.fn().mockResolvedValue(true),
        };

        mockUser.mockImplementation(() => mockNewUser);

        await signup(req, res);

        expect(mockUser.findOne).toHaveBeenCalledWith({
          email: 'test+alias@example.com',
        });
      });
    });

    describe('Duplicate Email Tests', () => {
      test('should return 400 if email already exists', async () => {
        req.body = {
          fullName: 'John Doe',
          email: 'existing@example.com',
          password: 'password123',
        };

        mockUser.findOne.mockResolvedValue({
          email: 'existing@example.com',
          fullName: 'Existing User',
        });

        await signup(req, res);

        expect(mockUser.findOne).toHaveBeenCalledWith({
          email: 'existing@example.com',
        });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Email already exists',
        });
        expect(mockBcrypt.genSalt).not.toHaveBeenCalled();
      });
    });

    describe('Successful Signup Tests', () => {
      test('should successfully create a new user with valid data', async () => {
        req.body = {
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        };

        mockUser.findOne.mockResolvedValue(null);
        mockBcrypt.genSalt.mockResolvedValue('salt123');
        mockBcrypt.hash.mockResolvedValue('hashedPassword123');

        const mockNewUser = {
          _id: 'user123',
          fullName: 'John Doe',
          email: 'john@example.com',
          profilePic: '',
          save: jest.fn().mockResolvedValue(true),
        };

        mockUser.mockImplementation(() => mockNewUser);
        mockGenerateToken.mockReturnValue('token123');

        await signup(req, res);

        expect(mockUser.findOne).toHaveBeenCalledWith({
          email: 'john@example.com',
        });
        expect(mockBcrypt.genSalt).toHaveBeenCalledWith(10);
        expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 'salt123');
        expect(mockGenerateToken).toHaveBeenCalledWith('user123', res);
        expect(mockNewUser.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
          _id: 'user123',
          fullName: 'John Doe',
          email: 'john@example.com',
          profilePic: '',
        });
      });

      test('should hash password with bcrypt', async () => {
        req.body = {
          fullName: 'Jane Smith',
          email: 'jane@example.com',
          password: 'mySecurePassword',
        };

        mockUser.findOne.mockResolvedValue(null);
        mockBcrypt.genSalt.mockResolvedValue('generatedSalt');
        mockBcrypt.hash.mockResolvedValue('hashedMySecurePassword');

        const mockNewUser = {
          _id: 'user456',
          fullName: 'Jane Smith',
          email: 'jane@example.com',
          profilePic: '',
          save: jest.fn().mockResolvedValue(true),
        };

        mockUser.mockImplementation(() => mockNewUser);

        await signup(req, res);

        expect(mockBcrypt.hash).toHaveBeenCalledWith(
          'mySecurePassword',
          'generatedSalt'
        );
      });

      test('should accept password with exactly 6 characters', async () => {
        req.body = {
          fullName: 'Test User',
          email: 'test@example.com',
          password: '123456',
        };

        mockUser.findOne.mockResolvedValue(null);
        mockBcrypt.genSalt.mockResolvedValue('salt');
        mockBcrypt.hash.mockResolvedValue('hashed123456');

        const mockNewUser = {
          _id: 'user789',
          fullName: 'Test User',
          email: 'test@example.com',
          profilePic: '',
          save: jest.fn().mockResolvedValue(true),
        };

        mockUser.mockImplementation(() => mockNewUser);

        await signup(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
      });

      test('should generate token before saving user', async () => {
        req.body = {
          fullName: 'Order Test',
          email: 'order@example.com',
          password: 'password123',
        };

        mockUser.findOne.mockResolvedValue(null);
        mockBcrypt.genSalt.mockResolvedValue('salt');
        mockBcrypt.hash.mockResolvedValue('hashedPassword');

        const mockNewUser = {
          _id: 'userOrder',
          fullName: 'Order Test',
          email: 'order@example.com',
          profilePic: '',
          save: jest.fn().mockResolvedValue(true),
        };

        mockUser.mockImplementation(() => mockNewUser);

        await signup(req, res);

        // Verify generateToken was called before save
        const generateTokenCall = mockGenerateToken.mock.invocationCallOrder[0];
        const saveCall = mockNewUser.save.mock.invocationCallOrder[0];
        expect(generateTokenCall).toBeLessThan(saveCall);
      });
    });

    describe('Error Handling Tests', () => {
      test('should handle database errors during user lookup', async () => {
        req.body = {
          fullName: 'John Doe',
          email: 'test@example.com',
          password: 'password123',
        };

        const dbError = new Error('Database connection failed');
        mockUser.findOne.mockRejectedValue(dbError);

        await signup(req, res);

        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Error in signup controller')
        );
        expect(res.status).toHaveBeenCalledWith(500);
      });

      test('should handle bcrypt errors', async () => {
        req.body = {
          fullName: 'John Doe',
          email: 'test@example.com',
          password: 'password123',
        };

        mockUser.findOne.mockResolvedValue(null);
        mockBcrypt.genSalt.mockRejectedValue(new Error('Bcrypt error'));

        await signup(req, res);

        expect(console.error).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
      });

      test('should handle errors during user save', async () => {
        req.body = {
          fullName: 'John Doe',
          email: 'test@example.com',
          password: 'password123',
        };

        mockUser.findOne.mockResolvedValue(null);
        mockBcrypt.genSalt.mockResolvedValue('salt');
        mockBcrypt.hash.mockResolvedValue('hashedPassword');

        const mockNewUser = {
          _id: 'user123',
          fullName: 'John Doe',
          email: 'test@example.com',
          profilePic: '',
          save: jest.fn().mockRejectedValue(new Error('Save failed')),
        };

        mockUser.mockImplementation(() => mockNewUser);

        await signup(req, res);

        expect(console.error).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
      });
    });

    describe('Edge Cases', () => {
      test('should handle empty string values as missing fields', async () => {
        req.body = {
          fullName: '',
          email: 'test@example.com',
          password: 'password123',
        };

        await signup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'All fields are required',
        });
      });

      test('should handle whitespace-only strings as valid (for fullName)', async () => {
        req.body = {
          fullName: '   ',
          email: 'test@example.com',
          password: 'password123',
        };

        mockUser.findOne.mockResolvedValue(null);
        mockBcrypt.genSalt.mockResolvedValue('salt');
        mockBcrypt.hash.mockResolvedValue('hashedPassword');

        const mockNewUser = {
          _id: 'user123',
          fullName: '   ',
          email: 'test@example.com',
          profilePic: '',
          save: jest.fn().mockResolvedValue(true),
        };

        mockUser.mockImplementation(() => mockNewUser);

        await signup(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
      });

      test('should handle very long passwords', async () => {
        const longPassword = 'a'.repeat(1000);
        req.body = {
          fullName: 'John Doe',
          email: 'test@example.com',
          password: longPassword,
        };

        mockUser.findOne.mockResolvedValue(null);
        mockBcrypt.genSalt.mockResolvedValue('salt');
        mockBcrypt.hash.mockResolvedValue('hashedLongPassword');

        const mockNewUser = {
          _id: 'user123',
          fullName: 'John Doe',
          email: 'test@example.com',
          profilePic: '',
          save: jest.fn().mockResolvedValue(true),
        };

        mockUser.mockImplementation(() => mockNewUser);

        await signup(req, res);

        expect(mockBcrypt.hash).toHaveBeenCalledWith(longPassword, 'salt');
        expect(res.status).toHaveBeenCalledWith(201);
      });

      test('should handle special characters in fullName', async () => {
        req.body = {
          fullName: "O'Brien-Smith (Jr.)",
          email: 'test@example.com',
          password: 'password123',
        };

        mockUser.findOne.mockResolvedValue(null);
        mockBcrypt.genSalt.mockResolvedValue('salt');
        mockBcrypt.hash.mockResolvedValue('hashedPassword');

        const mockNewUser = {
          _id: 'user123',
          fullName: "O'Brien-Smith (Jr.)",
          email: 'test@example.com',
          profilePic: '',
          save: jest.fn().mockResolvedValue(true),
        };

        mockUser.mockImplementation(() => mockNewUser);

        await signup(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            fullName: "O'Brien-Smith (Jr.)",
          })
        );
      });

      test('should handle email case sensitivity', async () => {
        req.body = {
          fullName: 'John Doe',
          email: 'Test@Example.COM',
          password: 'password123',
        };

        mockUser.findOne.mockResolvedValue(null);
        mockBcrypt.genSalt.mockResolvedValue('salt');
        mockBcrypt.hash.mockResolvedValue('hashedPassword');

        const mockNewUser = {
          _id: 'user123',
          fullName: 'John Doe',
          email: 'Test@Example.COM',
          profilePic: '',
          save: jest.fn().mockResolvedValue(true),
        };

        mockUser.mockImplementation(() => mockNewUser);

        await signup(req, res);

        expect(mockUser.findOne).toHaveBeenCalledWith({
          email: 'Test@Example.COM',
        });
        expect(res.status).toHaveBeenCalledWith(201);
      });

      test('should not expose password in response', async () => {
        req.body = {
          fullName: 'John Doe',
          email: 'test@example.com',
          password: 'password123',
        };

        mockUser.findOne.mockResolvedValue(null);
        mockBcrypt.genSalt.mockResolvedValue('salt');
        mockBcrypt.hash.mockResolvedValue('hashedPassword');

        const mockNewUser = {
          _id: 'user123',
          fullName: 'John Doe',
          email: 'test@example.com',
          password: 'hashedPassword',
          profilePic: '',
          save: jest.fn().mockResolvedValue(true),
        };

        mockUser.mockImplementation(() => mockNewUser);

        await signup(req, res);

        expect(res.json).toHaveBeenCalledWith({
          _id: 'user123',
          fullName: 'John Doe',
          email: 'test@example.com',
          profilePic: '',
        });
        expect(res.json).not.toHaveBeenCalledWith(
          expect.objectContaining({ password: expect.anything() })
        );
      });
    });
  });

  describe('login', () => {
    test('should send "Login endpoint" message', async () => {
      await login(req, res);

      expect(res.send).toHaveBeenCalledWith('Login endpoint');
    });

    test('should be an async function', () => {
      expect(login.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('logout', () => {
    test('should send "Logout endpoint" message', async () => {
      await logout(req, res);

      expect(res.send).toHaveBeenCalledWith('Logout endpoint');
    });

    test('should be an async function', () => {
      expect(logout.constructor.name).toBe('AsyncFunction');
    });
  });
});