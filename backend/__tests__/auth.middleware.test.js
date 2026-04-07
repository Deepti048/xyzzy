const jwt = require('jsonwebtoken');
const { auth, adminOnly } = require('../middleware/auth');

jest.mock('jsonwebtoken');

describe('auth middleware white-box tests', () => {
  const createRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
  });

  test('returns 401 when Authorization header is missing', () => {
    const req = { header: jest.fn().mockReturnValue(undefined) };
    const res = createRes();
    const next = jest.fn();

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No authentication token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  test('attaches decoded user and calls next for a valid bearer token', () => {
    const req = { header: jest.fn().mockReturnValue('Bearer valid_token') };
    const res = createRes();
    const next = jest.fn();
    const decoded = { id: 1, role: 'admin' };

    jwt.verify.mockReturnValue(decoded);

    auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid_token', 'test_secret');
    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('returns 401 when token verification throws', () => {
    const req = { header: jest.fn().mockReturnValue('Bearer bad_token') };
    const res = createRes();
    const next = jest.fn();

    jwt.verify.mockImplementation(() => {
      throw new Error('bad token');
    });

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid authentication token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('adminOnly returns 403 for non-admin users', () => {
    const req = { user: { id: 2, role: 'viewer' } };
    const res = createRes();
    const next = jest.fn();

    adminOnly(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('adminOnly calls next for admin users', () => {
    const req = { user: { id: 1, role: 'admin' } };
    const res = createRes();
    const next = jest.fn();

    adminOnly(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
