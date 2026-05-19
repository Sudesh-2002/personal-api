import { Router } from 'express';
import { contextController } from './context.controller';

const router = Router();

router.get('/', contextController.getSnapshot);
router.get('/time', contextController.getTime);
router.get('/preferences', contextController.getPreferences);
router.get('/schedule', contextController.getSchedule);
router.get('/tags', contextController.getTags);
router.post('/invalidate', contextController.invalidate);

export { router as contextRouter };