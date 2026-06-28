import mongoose from 'mongoose';
import { APPLICATION_STAGES } from '../utils/featureInput.js';

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  company: { type: String, default: '', trim: true, maxlength: 200 },
  role: { type: String, default: '', trim: true, maxlength: 200 },
  location: { type: String, default: '', trim: true, maxlength: 200 },
  salaryMin: { type: Number, default: null },
  salaryMax: { type: Number, default: null },
  stage: { type: String, enum: APPLICATION_STAGES, default: 'saved' },
  source: { type: String, default: '', trim: true, maxlength: 100 },
  url: { type: String, default: '', trim: true, maxlength: 500 },
  // References a Resume id (string). Kept loose (not a ref) because an application
  // can outlive the resume it was linked to.
  resumeId: { type: String, default: null },
  excitement: { type: Number, default: 3, min: 0, max: 5 },
  appliedAt: { type: Date, default: null },
  nextStep: { type: String, default: '', trim: true, maxlength: 300 },
  nextStepDate: { type: Date, default: null },
  notes: { type: String, default: '', maxlength: 4000 },
}, { timestamps: true });

applicationSchema.methods.toClientJSON = function toClientJSON() {
  return {
    id: this._id.toString(),
    company: this.company,
    role: this.role,
    location: this.location,
    salaryMin: this.salaryMin,
    salaryMax: this.salaryMax,
    stage: this.stage,
    source: this.source,
    url: this.url,
    resumeId: this.resumeId,
    excitement: this.excitement,
    appliedAt: this.appliedAt,
    nextStep: this.nextStep,
    nextStepDate: this.nextStepDate,
    notes: this.notes,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Application = mongoose.model('Application', applicationSchema);
