const { Schema } = require('mongoose');
const mongoose = require('mongoose');

const StudyFeedbackSchema = new Schema(
  {
    study_id: { type: mongoose.Types.ObjectId, unique: false, ref: 'Study' }, // reference
    user_id: { type: mongoose.Types.ObjectId, unique: false, ref: 'User' }, // reference
    user_name: { type: String, unique: false, ref: 'User' }, // reference
    content_type: { type: Boolean }, // 0: 피드백 본문, 1: 피드백 댓글
    content: { type: String },
  },
  {
    timestamps: true, // 댓글작성일시: date
  },
);

module.exports = StudyFeedbackSchema;
