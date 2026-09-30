import * as gym from '../services/gym.service';
import { handle, parseId } from '../errors/http-error';

// planos
export const listPlans = handle(async (req, res) => {
  res.json(await gym.listPlans(req.query.active === 'true'));
});
export const showPlan = handle(async (req, res) => {
  res.json(await gym.getPlan(parseId(req.params.id)));
});
export const storePlan = handle(async (req, res) => {
  res.status(201).json(await gym.createPlan(req.body));
});
export const updatePlan = handle(async (req, res) => {
  res.json(await gym.updatePlan(parseId(req.params.id), req.body));
});
export const destroyPlan = handle(async (req, res) => {
  await gym.deletePlan(parseId(req.params.id));
  res.status(204).send();
});

// matrículas
export const listMemberships = handle(async (req, res) => {
  res.json(await gym.listMemberships(req.query));
});
export const expiring = handle(async (req, res) => {
  res.json(await gym.expiring(req.query));
});
export const showMembership = handle(async (req, res) => {
  res.json(await gym.getMembership(parseId(req.params.id)));
});
export const storeMembership = handle(async (req, res) => {
  res.status(201).json(await gym.createMembership(req.body));
});
export const cancelMembership = handle(async (req, res) => {
  res.json(await gym.cancelMembership(parseId(req.params.id)));
});

// pagamentos
export const listPayments = handle(async (req, res) => {
  res.json(await gym.listPayments(parseId(req.params.id)));
});
export const storePayment = handle(async (req, res) => {
  res.status(201).json(await gym.payMembership(parseId(req.params.id), req.body));
});

// peso e altura
export const listMeasurements = handle(async (req, res) => {
  res.json(await gym.listMeasurements(parseId(req.params.id)));
});
export const storeMeasurement = handle(async (req, res) => {
  res.status(201).json(await gym.addMeasurement(parseId(req.params.id), req.body));
});
export const destroyMeasurement = handle(async (req, res) => {
  await gym.deleteMeasurement(parseId(req.params.id));
  res.status(204).send();
});

// resumo
export const summary = handle(async (_req, res) => {
  res.json(await gym.summary());
});
