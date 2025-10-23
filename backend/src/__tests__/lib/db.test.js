import { jest } from '@jest/globals';

const mockMongoose = {
  connect: jest.fn(),
};

jest.unstable_mockModule('mongoose', () => ({
  default: mockMongoose,
}));

const { connectDB } = await import('../../lib/db.js');

describe('Database Connection - connectDB', () => {
  let originalEnv;
  let consoleInfoSpy;
  let consoleErrorSpy;
  let processExitSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Save original env
    originalEnv = { ...process.env };
    
    // Setup default env
    process.env.MONGO_URI = 'mongodb://localhost:27017/testdb';
    
    // Spy on console methods
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Spy on process.exit
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
    
    // Restore console methods
    consoleInfoSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('Successful Connection', () => {
    test('should connect to MongoDB with MONGO_URI from environment', async () => {
      mockMongoose.connect.mockResolvedValue(true);

      await connectDB();

      expect(mockMongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/testdb'
      );
    });

    test('should log success message on successful connection', async () => {
      mockMongoose.connect.mockResolvedValue(true);

      await connectDB();

      expect(consoleInfoSpy).toHaveBeenCalledWith('Mongodb connected');
    });

    test('should not call process.exit on success', async () => {
      mockMongoose.connect.mockResolvedValue(true);

      await connectDB();

      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle different MONGO_URI formats', async () => {
      const mongoUris = [
        'mongodb://localhost:27017/mydb',
        'mongodb://user:pass@localhost:27017/mydb',
        'mongodb+srv://cluster.mongodb.net/mydb',
        'mongodb://mongo1:27017,mongo2:27017,mongo3:27017/mydb?replicaSet=rs0',
      ];

      for (const uri of mongoUris) {
        jest.clearAllMocks();
        process.env.MONGO_URI = uri;
        mockMongoose.connect.mockResolvedValue(true);

        await connectDB();

        expect(mockMongoose.connect).toHaveBeenCalledWith(uri);
      }
    });

    test('should work with connection options if provided by mongoose', async () => {
      mockMongoose.connect.mockResolvedValue({
        connection: { host: 'localhost' },
      });

      await connectDB();

      expect(mockMongoose.connect).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalledWith('Mongodb connected');
    });
  });

  describe('Failed Connection', () => {
    test('should log error message on connection failure', async () => {
      const error = new Error('Connection refused');
      mockMongoose.connect.mockRejectedValue(error);

      await connectDB();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Mongodb connecting error: Error: Connection refused'
      );
    });

    test('should call process.exit(1) on connection failure', async () => {
      const error = new Error('Connection failed');
      mockMongoose.connect.mockRejectedValue(error);

      await connectDB();

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle authentication errors', async () => {
      const authError = new Error('Authentication failed');
      mockMongoose.connect.mockRejectedValue(authError);

      await connectDB();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Mongodb connecting error: Error: Authentication failed'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle network errors', async () => {
      const networkError = new Error('ECONNREFUSED');
      mockMongoose.connect.mockRejectedValue(networkError);

      await connectDB();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Mongodb connecting error: Error: ECONNREFUSED'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle timeout errors', async () => {
      const timeoutError = new Error('Connection timeout');
      mockMongoose.connect.mockRejectedValue(timeoutError);

      await connectDB();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Mongodb connecting error: Error: Connection timeout'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle invalid URI errors', async () => {
      const uriError = new Error('Invalid connection string');
      mockMongoose.connect.mockRejectedValue(uriError);

      await connectDB();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Mongodb connecting error: Error: Invalid connection string'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should call process.exit with status code 1 specifically', async () => {
      const error = new Error('Test error');
      mockMongoose.connect.mockRejectedValue(error);

      await connectDB();

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(processExitSpy).not.toHaveBeenCalledWith(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty MONGO_URI', async () => {
      process.env.MONGO_URI = '';
      mockMongoose.connect.mockResolvedValue(true);

      await connectDB();

      expect(mockMongoose.connect).toHaveBeenCalledWith('');
    });

    test('should handle undefined MONGO_URI', async () => {
      delete process.env.MONGO_URI;
      mockMongoose.connect.mockResolvedValue(true);

      await connectDB();

      expect(mockMongoose.connect).toHaveBeenCalledWith(undefined);
    });

    test('should handle error objects without message', async () => {
      const errorWithoutMessage = { code: 'ERR_CONNECTION' };
      mockMongoose.connect.mockRejectedValue(errorWithoutMessage);

      await connectDB();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle string errors', async () => {
      mockMongoose.connect.mockRejectedValue('String error');

      await connectDB();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Mongodb connecting error: String error'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle null error', async () => {
      mockMongoose.connect.mockRejectedValue(null);

      await connectDB();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('Multiple Calls', () => {
    test('should handle multiple successful connections', async () => {
      mockMongoose.connect.mockResolvedValue(true);

      await connectDB();
      await connectDB();
      await connectDB();

      expect(mockMongoose.connect).toHaveBeenCalledTimes(3);
      expect(consoleInfoSpy).toHaveBeenCalledTimes(3);
    });

    test('should handle multiple failed connections', async () => {
      const error = new Error('Connection failed');
      mockMongoose.connect.mockRejectedValue(error);

      await connectDB();
      await connectDB();

      expect(processExitSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Async Behavior', () => {
    test('should be an async function', () => {
      expect(connectDB.constructor.name).toBe('AsyncFunction');
    });

    test('should wait for mongoose.connect to resolve', async () => {
      let resolved = false;
      mockMongoose.connect.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolved = true;
              resolve(true);
            }, 10);
          })
      );

      await connectDB();

      expect(resolved).toBe(true);
    });

    test('should handle promise rejection', async () => {
      mockMongoose.connect.mockRejectedValue(new Error('Async error'));

      await connectDB();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('Error Message Format', () => {
    test('should include error details in console.error', async () => {
      const detailedError = new Error('ECONNREFUSED: Connection refused at 127.0.0.1:27017');
      mockMongoose.connect.mockRejectedValue(detailedError);

      await connectDB();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Mongodb connecting error:')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ECONNREFUSED')
      );
    });

    test('should log errors with stack trace information if present', async () => {
      const errorWithStack = new Error('Stack error');
      errorWithStack.stack = 'Error: Stack error\n    at connectDB';
      mockMongoose.connect.mockRejectedValue(errorWithStack);

      await connectDB();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Stack error')
      );
    });
  });
});