import { jest } from '@jest/globals';

const mockJwt = {
  sign: jest.fn(),
};

jest.unstable_mockModule('jsonwebtoken', () => mockJwt);

const { generateToken } = await import('../../lib/utils.js');

describe('Utils - generateToken', () => {
  let res;
  let originalEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Save original env
    originalEnv = { ...process.env };
    
    // Setup default env
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'development';
    
    // Setup response mock
    res = {
      cookie: jest.fn(),
    };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('Token Generation', () => {
    test('should generate JWT token with userId', () => {
      const userId = 'user123';
      mockJwt.sign.mockReturnValue('generated-token');

      generateToken(userId, res);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 'user123' },
        'test-secret',
        { expiresIn: '7d' }
      );
    });

    test('should return the generated token', () => {
      const userId = 'user456';
      mockJwt.sign.mockReturnValue('test-token-456');

      const token = generateToken(userId, res);

      expect(token).toBe('test-token-456');
    });

    test('should use JWT_SECRET from environment', () => {
      process.env.JWT_SECRET = 'super-secret-key';
      const userId = 'user789';
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.anything(),
        'super-secret-key',
        expect.anything()
      );
    });

    test('should set expiration to 7 days', () => {
      const userId = 'user123';
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: '7d' }
      );
    });
  });

  describe('Cookie Settings', () => {
    test('should set cookie with correct name and token', () => {
      const userId = 'user123';
      mockJwt.sign.mockReturnValue('my-token');

      generateToken(userId, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'jwt',
        'my-token',
        expect.any(Object)
      );
    });

    test('should set cookie maxAge to 7 days in milliseconds', () => {
      const userId = 'user123';
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      expect(res.cookie).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ maxAge: sevenDaysInMs })
      );
    });

    test('should set httpOnly flag to true', () => {
      const userId = 'user123';
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      expect(res.cookie).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ httpOnly: true })
      );
    });

    test('should set sameSite to strict', () => {
      const userId = 'user123';
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      expect(res.cookie).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ sameSite: 'strict' })
      );
    });

    test('should set secure to false in development mode', () => {
      process.env.NODE_ENV = 'development';
      const userId = 'user123';
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      expect(res.cookie).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ secure: false })
      );
    });

    test('should set secure to true in production mode', () => {
      process.env.NODE_ENV = 'production';
      const userId = 'user123';
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      expect(res.cookie).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ secure: true })
      );
    });

    test('should set secure to true when NODE_ENV is not development', () => {
      process.env.NODE_ENV = 'staging';
      const userId = 'user123';
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      expect(res.cookie).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ secure: true })
      );
    });

    test('should set secure to true when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      const userId = 'user123';
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      expect(res.cookie).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ secure: true })
      );
    });
  });

  describe('Edge Cases', () => {
    test('should handle numeric userId', () => {
      const userId = 12345;
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 12345 },
        expect.anything(),
        expect.anything()
      );
    });

    test('should handle ObjectId-like userId', () => {
      const userId = '507f1f77bcf86cd799439011';
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: '507f1f77bcf86cd799439011' },
        expect.anything(),
        expect.anything()
      );
    });

    test('should handle empty string userId', () => {
      const userId = '';
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: '' },
        expect.anything(),
        expect.anything()
      );
    });

    test('should handle null userId', () => {
      const userId = null;
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: null },
        expect.anything(),
        expect.anything()
      );
    });

    test('should handle undefined userId', () => {
      const userId = undefined;
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: undefined },
        expect.anything(),
        expect.anything()
      );
    });

    test('should work when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      const userId = 'user123';
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      expect(res.cookie).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ secure: true })
      );
    });

    test('should handle long token values', () => {
      const userId = 'user123';
      const longToken = 'a'.repeat(1000);
      mockJwt.sign.mockReturnValue(longToken);

      const result = generateToken(userId, res);

      expect(result).toBe(longToken);
      expect(res.cookie).toHaveBeenCalledWith('jwt', longToken, expect.any(Object));
    });
  });

  describe('Security Features', () => {
    test('should include all security headers for XSS protection', () => {
      const userId = 'user123';
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      const cookieOptions = res.cookie.mock.calls[0][2];
      expect(cookieOptions.httpOnly).toBe(true);
    });

    test('should include sameSite for CSRF protection', () => {
      const userId = 'user123';
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      const cookieOptions = res.cookie.mock.calls[0][2];
      expect(cookieOptions.sameSite).toBe('strict');
    });

    test('should not set secure flag in development for localhost testing', () => {
      process.env.NODE_ENV = 'development';
      const userId = 'user123';
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      const cookieOptions = res.cookie.mock.calls[0][2];
      expect(cookieOptions.secure).toBe(false);
    });
  });

  describe('Integration', () => {
    test('should call res.cookie exactly once', () => {
      const userId = 'user123';
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      expect(res.cookie).toHaveBeenCalledTimes(1);
    });

    test('should call jwt.sign exactly once', () => {
      const userId = 'user123';
      mockJwt.sign.mockReturnValue('token');

      generateToken(userId, res);

      expect(mockJwt.sign).toHaveBeenCalledTimes(1);
    });

    test('should work with multiple consecutive calls', () => {
      mockJwt.sign.mockReturnValue('token1');
      generateToken('user1', res);

      mockJwt.sign.mockReturnValue('token2');
      generateToken('user2', res);

      mockJwt.sign.mockReturnValue('token3');
      generateToken('user3', res);

      expect(res.cookie).toHaveBeenCalledTimes(3);
      expect(mockJwt.sign).toHaveBeenCalledTimes(3);
    });
  });
});