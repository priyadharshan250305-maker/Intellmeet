import request from 'supertest';
import app from '../index';

describe('AI Summaries & Action Items Extraction', () => {
  let authToken: string;
  let meetingId: string;

  beforeEach(async () => {
    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Dr. Sarah Connor',
      email: 'sarah@intellmeet.com',
      password: 'password123',
    });
    authToken = userRes.body.token;

    const meetingRes = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Q4 Product Roadmap & Infrastructure Review',
      });
    meetingId = meetingRes.body.meeting._id;

    // Seed sample transcript
    await request(app)
      .post(`/api/transcripts/${meetingId}/sample`)
      .set('Authorization', `Bearer ${authToken}`);
  });

  it('should generate an AI meeting summary with all required sections', async () => {
    const res = await request(app)
      .post(`/api/ai/summary/${meetingId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary).toBeDefined();

    const summary = res.body.summary;
    expect(summary.overview).toBeTruthy();
    expect(Array.isArray(summary.discussionPoints)).toBe(true);
    expect(Array.isArray(summary.keyDecisions)).toBe(true);
    expect(Array.isArray(summary.importantQuestions)).toBe(true);
    expect(Array.isArray(summary.risksAndIssues)).toBe(true);
    expect(Array.isArray(summary.nextSteps)).toBe(true);
  });

  it('should extract action items and allow status updates', async () => {
    const extractRes = await request(app)
      .post(`/api/ai/action-items/extract/${meetingId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(extractRes.status).toBe(201);
    expect(extractRes.body.success).toBe(true);
    expect(Array.isArray(extractRes.body.actionItems)).toBe(true);
    expect(extractRes.body.actionItems.length).toBeGreaterThan(0);

    const firstTask = extractRes.body.actionItems[0];
    expect(firstTask.title).toBeDefined();
    expect(firstTask.status).toBe('Pending');

    // Update status to 'Completed'
    const updateRes = await request(app)
      .put(`/api/ai/action-items/${firstTask._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'Completed',
        assignee: 'David Chen',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.actionItem.status).toBe('Completed');
    expect(updateRes.body.actionItem.assignee).toBe('David Chen');
  });
});
