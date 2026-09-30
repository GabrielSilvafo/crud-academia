import { Router } from 'express';
import * as userController from '../controllers/user.controller';

const router = Router();

router.get('/users', userController.index);
router.get('/users/:id', userController.show);
router.post('/users', userController.store);
router.put('/users/:id', userController.update);
router.patch('/users/:id', userController.patch);
router.delete('/users/:id', userController.destroy);

export default router;