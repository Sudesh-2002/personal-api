import { Router } from 'express';
import { eventController } from './event.controller';

const router = Router();

router.get('/today', eventController.getToday);
router.get('/week', eventController.getWeek);
router.get('/now', eventController.getCurrent);
router.get('/', eventController.getAll);
router.get('/:id', eventController.getOne);
router.post('/', eventController.create);
router.patch('/:id', eventController.update);
router.delete('/:id', eventController.remove);

export { router as eventRouter };