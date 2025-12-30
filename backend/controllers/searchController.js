// backend/controllers/searchController.js
const User = require("../models/User");

/**
 * Search users by skills and filters
 * GET /api/search/users
 */
exports.searchUsers = async (req, res) => {
  try {
    const {
      query, // skill search query
      category,
      skillLevel,
      availability,
      minRating,
      verifiedOnly,
      limit = 20,
      page = 1,
    } = req.query;

    // Build search filter
    const filter = {};

    // Search in skills array for matching skill titles
    if (query) {
      filter["skills.title"] = { $regex: query, $options: "i" };
    }

    // Filter by skill category (if skills have categories)
    if (category) {
      filter["skills.sub"] = { $regex: category, $options: "i" };
    }

    // Filter by skill level (stored in skills array)
    // Note: You might need to add a 'level' field to skillSchema
    // For now, we'll skip this or you can add it to the User model

    // Filter by availability (isOnline status)
    if (availability === "Available Now") {
      filter.isOnline = true;
    } else if (availability === "Busy") {
      filter.isOnline = false;
    }

    // Filter by minimum rating (average of all skills)
    // This requires aggregation to calculate average rating
    // For simplicity, we'll fetch all and filter in memory, or you can aggregate

    // Skip password field
    const selectFields = "-password";

    // Execute query with pagination
    const skip = (page - 1) * limit;
    let users = await User.find(filter)
      .select(selectFields)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Post-processing filters
    if (minRating) {
      users = users.filter((user) => {
        if (!user.skills || user.skills.length === 0) return false;
        const avgRating =
          user.skills.reduce((sum, skill) => sum + (skill.rating || 0), 0) /
          user.skills.length;
        return avgRating >= parseFloat(minRating);
      });
    }

    // Calculate average rating and response time for each user
    users = users.map((user) => {
      let avgRating = 0;
      if (user.skills && user.skills.length > 0) {
        avgRating =
          user.skills.reduce((sum, skill) => sum + (skill.rating || 0), 0) /
          user.skills.length;
      }

      // Calculate response time based on last active
      let responseTime = "Unknown";
      if (user.lastActive) {
        const hoursSinceActive = Math.floor(
          (Date.now() - new Date(user.lastActive).getTime()) / (1000 * 60 * 60)
        );
        if (hoursSinceActive < 1) {
          responseTime = "< 1 hour";
        } else if (hoursSinceActive < 3) {
          responseTime = "< 3 hours";
        } else if (hoursSinceActive < 24) {
          responseTime = "< 1 day";
        } else {
          responseTime = "> 1 day";
        }
      }

      return {
        ...user,
        averageRating: avgRating.toFixed(1),
        responseTime,
      };
    });

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search users",
      error: error.message,
    });
  }
};

/**
 * Get unique skill categories from all users
 * GET /api/search/categories
 */
exports.getSkillCategories = async (req, res) => {
  try {
    const categories = await User.distinct("skills.sub");
    res.json({
      success: true,
      data: categories.filter(Boolean), // Remove empty values
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

/**
 * Get all unique skills from all users
 * GET /api/search/skills
 */
exports.getAllSkills = async (req, res) => {
  try {
    const skills = await User.distinct("skills.title");
    res.json({
      success: true,
      data: skills.filter(Boolean), // Remove empty values
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch skills",
      error: error.message,
    });
  }
};

/**
 * Get trending/popular skills based on user count
 * GET /api/search/trending-skills
 */
exports.getTrendingSkills = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Aggregate to count users per skill
    const trendingSkills = await User.aggregate([
      { $unwind: "$skills" },
      {
        $group: {
          _id: "$skills.title",
          count: { $sum: 1 },
          avgRating: { $avg: "$skills.rating" },
        },
      },
      { $match: { _id: { $ne: null, $ne: "" } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $project: {
          skill: "$_id",
          userCount: "$count",
          averageRating: { $round: ["$avgRating", 1] },
          _id: 0,
        },
      },
    ]);

    res.json({
      success: true,
      data: trendingSkills,
    });
  } catch (error) {
    console.error("Error fetching trending skills:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trending skills",
      error: error.message,
    });
  }
};
