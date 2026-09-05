const jwt = require('jsonwebtoken');
const authMiddleware = require('../../routing/authMiddleware');

jest.mock('jsonwebtoken');

describe('Unit Tests per authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('dovrebbe bloccare la richiesta con 401 se manca l\'header Authorization', () => {
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('dovrebbe bloccare la richiesta con 403 se il token non è valido', () => {
    req.headers.authorization = 'Bearer token-falso-o-scaduto';

    jwt.verify.mockImplementation(() => {
      throw new Error('Token non valido');
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('dovrebbe chiamare next() e autorizzare se il token è valido', () => {
    req.headers.authorization = 'Bearer token-super-segreto-e-valido';

    jwt.verify.mockReturnValue({ id: 123, ruolo: 'Sitter' });

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});