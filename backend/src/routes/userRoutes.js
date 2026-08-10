import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { createUserController, deactivateUserController } from '../controllers/userController.js';

const router = Router();

// Hanya ADMIN yang bisa create user
router.post(
  '/users',
  authenticate,
  authorize(['ADMIN']),
  createUserController
);

// Hanya ADMIN yang bisa deactivate user
router.patch(
  '/users/:id/deactivate',
  authenticate,
  authorize(['ADMIN']),
  deactivateUserController
);

export default router;