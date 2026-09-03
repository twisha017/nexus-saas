import { Router } from 'express';
import { TaskController } from './task.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  createTaskSchema,
  listTasksQuerySchema,
  updateTaskSchema,
} from './task.schema';

const router = Router();

router.post('/', validate(createTaskSchema), TaskController.create);
router.get('/', validate(listTasksQuerySchema), TaskController.list);
router.get('/:id', TaskController.getById);
router.patch('/:id', validate(updateTaskSchema), TaskController.update);
router.delete('/:id', TaskController.remove);

export const taskRoutes = router;