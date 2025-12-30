// backend/controllers/skillRequestController.js
const SkillRequest = require("../models/SkillRequest");
const User = require("../models/User");

// Get all skill requests with filters
exports.getSkillRequests = async (req, res) => {
  try {
    const { category, priority, status, userId } = req.query;

    let query = {};

    // Filter by category
    if (category && category !== "All Categories") {
      query.category = category;
    }

    // Filter by priority
    if (priority && priority !== "All Urgencies") {
      query.priority = priority;
    }

    // Filter by status
    if (status) {
      query.status = status;
    } else {
      // By default, exclude completed and closed requests
      query.status = { $in: ["open", "in-progress"] };
    }

    // Exclude user's own requests if userId is provided
    if (userId) {
      query.author = { $ne: userId };
    }

    const requests = await SkillRequest.find(query)
      .populate("author", "firstName lastName username profileImage")
      .populate("assignedTo", "firstName lastName username")
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    console.error("Get Skill Requests Error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Get user's own skill requests
exports.getMySkillRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    let query = { author: userId };

    if (status) {
      query.status = status;
    }

    const requests = await SkillRequest.find(query)
      .populate("author", "firstName lastName username profileImage")
      .populate("assignedTo", "firstName lastName username")
      .populate("responses.user", "firstName lastName username profileImage")
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    console.error("Get My Skill Requests Error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Get single skill request by ID
exports.getSkillRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await SkillRequest.findById(id)
      .populate("author", "firstName lastName username profileImage")
      .populate("assignedTo", "firstName lastName username profileImage")
      .populate("responses.user", "firstName lastName username profileImage");

    if (!request) {
      return res.json({ success: false, message: "Skill request not found" });
    }

    res.json({ success: true, request });
  } catch (error) {
    console.error("Get Skill Request Error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Create new skill request
exports.createSkillRequest = async (req, res) => {
  try {
    const {
      title,
      description,
      authorId,
      tags,
      category,
      priority,
      estimatedTime,
      deadline,
    } = req.body;

    if (!title || !description || !authorId) {
      return res.json({
        success: false,
        message: "Title, description, and author are required",
      });
    }

    const request = new SkillRequest({
      title,
      description,
      author: authorId,
      tags: tags || [],
      category: category || "General",
      priority: priority || "Medium",
      estimatedTime: estimatedTime || "",
      deadline: deadline || null,
    });

    await request.save();

    const populated = await SkillRequest.findById(request._id).populate(
      "author",
      "firstName lastName username profileImage"
    );

    res.json({ success: true, request: populated });
  } catch (error) {
    console.error("Create Skill Request Error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Update skill request
exports.updateSkillRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tags, category, priority, estimatedTime, status, userId } = req.body;

    const request = await SkillRequest.findById(id);

    if (!request) {
      return res.json({ success: false, message: "Skill request not found" });
    }

    // Check if user is the author
    if (request.author.toString() !== userId) {
      return res.json({
        success: false,
        message: "You can only edit your own requests",
      });
    }

    if (title) request.title = title;
    if (description) request.description = description;
    if (tags) request.tags = tags;
    if (category) request.category = category;
    if (priority) request.priority = priority;
    if (estimatedTime) request.estimatedTime = estimatedTime;
    if (status) request.status = status;

    await request.save();

    const populated = await SkillRequest.findById(request._id)
      .populate("author", "firstName lastName username profileImage")
      .populate("assignedTo", "firstName lastName username");

    res.json({ success: true, request: populated });
  } catch (error) {
    console.error("Update Skill Request Error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Delete skill request
exports.deleteSkillRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const request = await SkillRequest.findById(id);

    if (!request) {
      return res.json({ success: false, message: "Skill request not found" });
    }

    // Check if user is the author
    if (request.author.toString() !== userId) {
      return res.json({
        success: false,
        message: "You can only delete your own requests",
      });
    }

    await SkillRequest.findByIdAndDelete(id);

    res.json({ success: true, message: "Skill request deleted successfully" });
  } catch (error) {
    console.error("Delete Skill Request Error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Add response to skill request (apply to help)
exports.addResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, message } = req.body;

    if (!message || !userId) {
      return res.json({ success: false, message: "Message and user ID are required" });
    }

    const request = await SkillRequest.findById(id);

    if (!request) {
      return res.json({ success: false, message: "Skill request not found" });
    }

    if (request.status === "closed" || request.status === "completed") {
      return res.json({ success: false, message: "This request is closed" });
    }

    // Check if user already responded
    const alreadyResponded = request.responses.some(
      (r) => r.user.toString() === userId
    );

    if (alreadyResponded) {
      return res.json({ success: false, message: "You have already responded to this request" });
    }

    request.responses.push({
      user: userId,
      message,
      status: "pending",
    });

    await request.save();

    const populated = await SkillRequest.findById(request._id)
      .populate("author", "firstName lastName username profileImage")
      .populate("responses.user", "firstName lastName username profileImage");

    res.json({ success: true, request: populated });
  } catch (error) {
    console.error("Add Response Error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Accept a response (assign helper)
exports.acceptResponse = async (req, res) => {
  try {
    const { id, responseId } = req.params;
    const { userId } = req.body;

    const request = await SkillRequest.findById(id);

    if (!request) {
      return res.json({ success: false, message: "Skill request not found" });
    }

    // Check if user is the author
    if (request.author.toString() !== userId) {
      return res.json({
        success: false,
        message: "Only the request author can accept responses",
      });
    }

    const response = request.responses.id(responseId);

    if (!response) {
      return res.json({ success: false, message: "Response not found" });
    }

    // Update response status
    response.status = "accepted";
    request.assignedTo = response.user;
    request.status = "in-progress";

    // Reject all other responses
    request.responses.forEach((r) => {
      if (r._id.toString() !== responseId) {
        r.status = "rejected";
      }
    });

    await request.save();

    const populated = await SkillRequest.findById(request._id)
      .populate("author", "firstName lastName username profileImage")
      .populate("assignedTo", "firstName lastName username profileImage")
      .populate("responses.user", "firstName lastName username profileImage");

    res.json({ success: true, request: populated });
  } catch (error) {
    console.error("Accept Response Error:", error);
    res.json({ success: false, message: "Server error" });
  }
};
