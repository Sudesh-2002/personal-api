import { Router } from 'express';
import { preferenceController } from './preference.controller';

const router = Router();

router.get('/', preferenceController.getAll);
router.get('/:id', preferenceController.getOne);
router.post('/', preferenceController.create);
router.patch('/:id', preferenceController.update);
router.put('/', preferenceController.upsert);
router.delete('/:id', preferenceController.remove);

export { router as preferenceRouter };