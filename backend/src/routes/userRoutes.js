import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import {
  createUserController,
  deactivateUserController,
  resetPasswordController,
} from '../controllers/userController.js';

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

// Hanya ADMIN yang bisa reset password user lain
router.patch(
  '/users/:id/reset-password',
  authenticate,
  authorize(['ADMIN']),
  resetPasswordController
);

export default router;