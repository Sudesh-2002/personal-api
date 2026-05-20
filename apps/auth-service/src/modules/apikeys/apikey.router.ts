import { Router } from 'express';
import { apiKeyController } from './apikey.controller';
import { tokenController } from '@/modules/tokens/token.controller';

const router = Router();

// API key management
router.get('/keys', apiKeyController.getAll);
router.get('/keys/:id', apiKeyController.getOne);
router.post('/keys', apiKeyController.create);
router.post('/keys/:id/revoke', apiKeyController.revoke);
router.delete('/keys/:id', apiKeyController.remove);

// Token operations (public — no user auth required)
router.post('/token', tokenController.exchange);
router.post('/token/refresh', tokenController.refresh);
router.post('/token/revoke', tokenController.revoke);
router.post('/token/verify', tokenController.verify);

export { router as authRouter };