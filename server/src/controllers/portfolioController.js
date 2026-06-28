import { Portfolio } from '../models/Portfolio.js';
import { sanitizePortfolio } from '../utils/featureInput.js';

// One portfolio per user. All handlers are scoped to req.user (set by requireAuth).
export const portfolioController = {
  // The signed-in user's portfolio, or null if they haven't created one yet.
  async getMine(req, res, next) {
    try {
      const portfolio = await Portfolio.findOne({ user: req.user._id });
      return res.json({ portfolio: portfolio ? portfolio.toClientJSON() : null });
    } catch (err) {
      return next(err);
    }
  },

  // Create-or-update the user's single portfolio (idempotent PUT). Absent keys fall
  // back to schema defaults on insert; present keys overwrite on update.
  async save(req, res, next) {
    try {
      const data = sanitizePortfolio(req.body);
      const portfolio = await Portfolio.findOneAndUpdate(
        { user: req.user._id },
        { $set: data, $setOnInsert: { user: req.user._id } },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
      );
      return res.json({ portfolio: portfolio.toClientJSON() });
    } catch (err) {
      return next(err);
    }
  },
};
