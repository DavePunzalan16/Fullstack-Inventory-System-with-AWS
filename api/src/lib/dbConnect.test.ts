import {
  DatabaseConnectionError,
  verifyDatabaseConnection,
} from './dbConnect';

describe('verifyDatabaseConnection', () => {
  it('resolves when the client connects successfully', async () => {
    const client = { $connect: jest.fn().mockResolvedValue(undefined) };
    await expect(verifyDatabaseConnection(client, 1000)).resolves.toBeUndefined();
    expect(client.$connect).toHaveBeenCalledTimes(1);
  });

  it('rejects with a DatabaseConnectionError when the connection fails', async () => {
    const client = {
      $connect: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    };
    await expect(verifyDatabaseConnection(client, 1000)).rejects.toBeInstanceOf(
      DatabaseConnectionError,
    );
  });

  it('rejects with a DatabaseConnectionError when the connection times out (no partial init)', async () => {
    // $connect never settles -> the timeout path must fire.
    const client = { $connect: jest.fn(() => new Promise<void>(() => undefined)) };
    await expect(verifyDatabaseConnection(client, 20)).rejects.toBeInstanceOf(
      DatabaseConnectionError,
    );
  });
});
