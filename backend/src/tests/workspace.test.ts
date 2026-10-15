import request from 'supertest';
import app from '../index';

describe('Team Workspaces & RBAC API Endpoints', () => {
  let ownerToken: string;
  let workspaceId: string;

  beforeEach(async () => {
    const ownerRes = await request(app).post('/api/auth/register').send({
      name: 'Workspace Owner',
      email: 'owner@intellmeet.com',
      password: 'ownerpassword123',
    });
    ownerToken = ownerRes.body.token;

    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'AI Engineering Core',
        description: 'Core AI algorithms and model fine-tuning team',
      });

    workspaceId = wsRes.body.workspace._id;
  });

  it('should list workspaces for the authenticated user', async () => {
    const res = await request(app)
      .get('/api/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.workspaces)).toBe(true);
    expect(res.body.workspaces.length).toBeGreaterThan(0);
  });

  it('should invite a new member to the workspace', async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/invite`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        email: 'collaborator@intellmeet.com',
        role: 'member',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.membership.invitedEmail).toBe('collaborator@intellmeet.com');
  });

  it('should update shared collaborative workspace notes', async () => {
    const res = await request(app)
      .put(`/api/workspaces/${workspaceId}/notes`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        sharedNotes: '## Sprint Objectives\n1. Finalize WebRTC TURN relay\n2. Integrate Whisper STT',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.sharedNotes).toContain('Sprint Objectives');
  });
});
