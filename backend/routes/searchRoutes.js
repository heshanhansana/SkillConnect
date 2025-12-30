// backend/routes/searchRoutes.js
const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

// Search users by skills and filters
router.get("/users", searchController.searchUsers);

// Get unique skill categories
router.get("/categories", searchController.getSkillCategories);

// Get all unique skills
router.get("/skills", searchController.getAllSkills);

// Get trending/popular skills
router.get("/trending-skills", searchController.getTrendingSkills);

module.exports = router;
