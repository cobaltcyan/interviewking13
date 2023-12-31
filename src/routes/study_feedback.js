const { Router } = require('express');
const router = Router();
const studyFeedbackApi = require('../apis/study_feedback');
const userTokenValidate = require('../middlewares/userTokenValidate');
const tokenValidate = require('../middlewares/tokenValidate');

router.post('/create', userTokenValidate, studyFeedbackApi.newFeedback); // 피드백 게시글, 댓글 작성
router.get('/:study_id', studyFeedbackApi.studyFeedback); // 피드백 게시글, 댓글 조회(스터디별)
router.get('/', studyFeedbackApi.allFeedback); // 피드백 게시글, 댓글 조회
router.put('/', userTokenValidate, studyFeedbackApi.updateFeedback); // 피드백 게시글, 댓글 수정
router.delete('/:study_id', userTokenValidate, studyFeedbackApi.deleteFeedback); // 피드백 게시글, 댓글 삭제

module.exports = router;
