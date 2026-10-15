import request from 'supertest';
import app from '../index';

describe('Meeting API Endpoints', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Host User',
      email: 'host@intellmeet.com',
      password: 'hostpassword',
    });
    authToken = res.body.token;
    userId = res.body.user.id;
  });

  it('should create an instant meeting with unique roomId', async () => {
    const res = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Quarterly Architecture Sync',
        description: 'Discuss Q3 scale and AI pipeline',
        isPrivate: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.meeting.roomId).toMatch(/^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/);
    expect(res.body.meeting.status).toBe('live');
  });

  it('should create a scheduled private meeting with passcode', async () => {
    const scheduledTime = new Date(Date.now() + 86400000).toISOString();
    const res = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Executive Board Review',
        scheduledStartTime: scheduledTime,
        isPrivate: true,
        passcode: '8899',
      });

    expect(res.status).toBe(201);
    expect(res.body.meeting.status).toBe('scheduled');
    expect(res.body.meeting.isPrivate).toBe(true);

    const roomId = res.body.meeting.roomId;

    // Joining without passcode should fail
    const joinFail = await request(app)
      .post(`/api/meetings/room/${roomId}/join`)
      .send({ guestName: 'External Auditor', passcode: 'wrong' });

    expect(joinFail.status).toBe(403);

    // Joining with correct passcode should succeed
    const joinSuccess = await request(app)
      .post(`/api/meetings/room/${roomId}/join`)
      .send({ guestName: 'External Auditor', passcode: '8899' });

    expect(joinSuccess.status).toBe(200);
    expect(joinSuccess.body.success).toBe(true);
  });

  it('should allow host to end meeting and compute duration', async () => {
    const createRes = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Standup Sync',
      });

    const roomId = createRes.body.meeting.roomId;

    const endRes = await request(app)
      .post(`/api/meetings/room/${roomId}/end`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(endRes.status).toBe(200);
    expect(endRes.body.success).toBe(true);
    expect(endRes.body.meeting.status).toBe('completed');
    expect(endRes.body.meeting.actualEndTime).toBeDefined();
  });
});
