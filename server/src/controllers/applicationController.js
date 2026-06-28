import { Application } from '../models/Application.js';
import { sanitizeApplication } from '../utils/featureInput.js';

// Back-fill appliedAt the first time an application leaves the 'saved' stage —
// this used to live in the React handler; it belongs on the server now.
function backfillApplied(data, currentStage = 'saved', currentApplied = null) {
  const nextStage = data.stage || currentStage;
  if (nextStage !== 'saved' && !data.appliedAt && !currentApplied) {
    return new Date();
  }
  return undefined;
}

export const applicationController = {
  async list(req, res, next) {
    try {
      const apps = await Application.find({ user: req.user._id }).sort({ updatedAt: -1 });
      return res.json({ applications: apps.map((a) => a.toClientJSON()) });
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    try {
      const data = sanitizeApplication(req.body);
      const applied = backfillApplied(data);
      if (applied) data.appliedAt = applied;
      const app = await Application.create({ ...data, user: req.user._id });
      return res.status(201).json({ application: app.toClientJSON() });
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      const app = await Application.findOne({ _id: req.params.id, user: req.user._id });
      if (!app) return res.status(404).json({ error: 'Application not found.' });
      const data = sanitizeApplication(req.body);
      const applied = backfillApplied(data, app.stage, app.appliedAt);
      if (applied) data.appliedAt = applied;
      Object.assign(app, data);
      await app.save();
      return res.json({ application: app.toClientJSON() });
    } catch (err) {
      return next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const app = await Application.findOneAndDelete({ _id: req.params.id, user: req.user._id });
      if (!app) return res.status(404).json({ error: 'Application not found.' });
      return res.json({ ok: true, id: app._id.toString() });
    } catch (err) {
      return next(err);
    }
  },
};
