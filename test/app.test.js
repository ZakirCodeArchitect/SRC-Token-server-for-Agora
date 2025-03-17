const request = require('supertest');
const app = require('../app'); // Import the app instance

describe('GET /token-rtc', () => {
  it('should generate a token', async () => {
    const res = await request(app)
      .get('/token-rtc')
      .set('Authorization', process.env.API_SECRET_KEY)
      .query({ channelName: 'test', uid: 1234, role: 'host' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should return 400 for missing parameters', async () => {
    const res = await request(app)
      .get('/token-rtc')
      .set('Authorization', process.env.API_SECRET_KEY);

    expect(res.statusCode).toEqual(400);
  });

  it('should return 401 for unauthorized requests', async () => {
    const res = await request(app)
      .get('/token-rtc')
      .query({ channelName: 'test', uid: 1234, role: 'host' });

    expect(res.statusCode).toEqual(401);
  });
});