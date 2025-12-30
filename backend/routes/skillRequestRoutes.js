// backend/routes/skillRequestRoutes.js
const express = require("express");
const router = express.Router();
const {
  getSkillRequests,
  getMySkillRequests,
  getSkillRequestById,
  createSkillRequest,
  updateSkillRequest,
  deleteSkillRequest,
  addResponse,
  acceptResponse,
} = require("../controllers/skillRequestController");

router.get("/skill-requests", getSkillRequests);
router.get("/skill-requests/my/:userId", getMySkillRequests);
router.get("/skill-requests/:id", getSkillRequestById);
router.post("/skill-requests", createSkillRequest);
router.put("/skill-requests/:id", updateSkillRequest);
router.delete("/skill-requests/:id", deleteSkillRequest);
router.post("/skill-requests/:id/respond", addResponse);
router.post("/skill-requests/:id/response/:responseId/accept", acceptResponse);

module.exports = router;
