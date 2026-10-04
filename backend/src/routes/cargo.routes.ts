import { Router } from 'express';
import { cargoController } from '../controllers/cargo.controller';

const router = Router();

router.get('/', (req, res, next) => cargoController.getAll(req, res, next));
router.get('/:id', (req, res, next) => cargoController.getById(req, res, next));

export default router;
