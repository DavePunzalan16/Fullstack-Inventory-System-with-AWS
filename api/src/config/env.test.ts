import { EnvValidationError, loadConfig } from './env';

/** A complete, valid environment used as a baseline for the tests. */
function validEnv(): NodeJS.ProcessEnv {
  return {
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/inventory?schema=public',
    PORT: '4000',
    ALLOWED_ORIGINS: 'http://localhost:3000, http://localhost:3001',
    AWS_REGION: 'us-east-1',
    AWS_ACCESS_KEY_ID: 'AKIA_TEST',
    AWS_SECRET_ACCESS_KEY: 'secret_test',
  };
}

describe('loadConfig', () => {
  it('builds a typed config from a valid environment', () => {
    const config = loadConfig(validEnv(), { loadDotenv: false });
    expect(config.databaseUrl).toContain('postgresql://');
    expect(config.port).toBe(4000);
    expect(config.allowedOrigins).toEqual([
      'http://localhost:3000',
      'http://localhost:3001',
    ]);
    expect(config.aws).toEqual({
      region: 'us-east-1',
      accessKeyId: 'AKIA_TEST',
      secretAccessKey: 'secret_test',
    });
  });

  it.each([
    'DATABASE_URL',
    'PORT',
    'ALLOWED_ORIGINS',
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
  ])('aborts and names %s when it is absent', (name) => {
    const env = validEnv();
    delete env[name];
    try {
      loadConfig(env, { loadDotenv: false });
      throw new Error('expected loadConfig to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(EnvValidationError);
      expect((err as EnvValidationError).missing).toContain(name);
      expect((err as Error).message).toContain(name);
    }
  });

  it('treats whitespace-only values as empty', () => {
    const env = validEnv();
    env.AWS_SECRET_ACCESS_KEY = '   ';
    expect(() => loadConfig(env, { loadDotenv: false })).toThrow(EnvValidationError);
  });

  it('reports every missing variable at once', () => {
    const env = validEnv();
    delete env.PORT;
    delete env.AWS_REGION;
    try {
      loadConfig(env, { loadDotenv: false });
      throw new Error('expected loadConfig to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(EnvValidationError);
      expect((err as EnvValidationError).missing).toEqual(
        expect.arrayContaining(['PORT', 'AWS_REGION']),
      );
    }
  });

  it('rejects a non-numeric or out-of-range PORT', () => {
    const env = validEnv();
    env.PORT = 'not-a-port';
    expect(() => loadConfig(env, { loadDotenv: false })).toThrow(/Invalid PORT/);
    env.PORT = '70000';
    expect(() => loadConfig(env, { loadDotenv: false })).toThrow(/Invalid PORT/);
  });

  it('rejects ALLOWED_ORIGINS that contains no usable entries', () => {
    const env = validEnv();
    env.ALLOWED_ORIGINS = ' , , ';
    expect(() => loadConfig(env, { loadDotenv: false })).toThrow(/ALLOWED_ORIGINS/);
  });
});
