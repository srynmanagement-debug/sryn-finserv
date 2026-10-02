import { Router } from 'express';
import { sendSuccess } from '../../common/utils/response.util';

export const workflowsRouter = Router();

workflowsRouter.get('/definitions', (req, res) => {
  return sendSuccess(res, [], 'Workflow state machine definitions');
});
