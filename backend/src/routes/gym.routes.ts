import { Router } from 'express';
import * as gym from '../controllers/gym.controller';

const router = Router();

// planos
router.get('/plans', gym.listPlans);
router.get('/plans/:id', gym.showPlan);
router.post('/plans', gym.storePlan);
router.put('/plans/:id', gym.updatePlan);
router.delete('/plans/:id', gym.destroyPlan);

// matrículas (as rotas fixas vêm antes das que têm :id)
router.get('/memberships/expiring', gym.expiring);
router.get('/memberships', gym.listMemberships);
router.post('/memberships', gym.storeMembership);
router.get('/memberships/:id', gym.showMembership);
router.post('/memberships/:id/cancel', gym.cancelMembership);

// pagamentos de uma matrícula
router.get('/memberships/:id/payments', gym.listPayments);
router.post('/memberships/:id/payments', gym.storePayment);

// peso e altura
router.get('/users/:id/measurements', gym.listMeasurements);
router.post('/users/:id/measurements', gym.storeMeasurement);
router.delete('/measurements/:id', gym.destroyMeasurement);

// resumo
router.get('/gym/summary', gym.summary);

export default router;
