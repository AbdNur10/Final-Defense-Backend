// backend/controller/group.controller.js
import Group from "../models/Group.js";
import GroupMessage from "../models/GroupMessage.js";
import User from "../models/User.js";

// CREATE GROUP
export const createGroup = async (req, res) => {
  try {
    const { name, description = "", memberIds = [] } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Group name required" });
    }

    const members = Array.isArray(memberIds)
      ? [...new Set([req.user._id.toString(), ...memberIds])]
      : [req.user._id.toString()];

    const group = await Group.create({
      name,
      description,
      createdBy: req.user._id,
      members,
    });

    // Populate members before sending response
    const populatedGroup = await Group.findById(group._id).populate("members", "fullName profilePicture");

    res.status(201).json({ success: true, group: populatedGroup });
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

// GET GROUPS
export const getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id }).populate(
      "members",
      "fullName profilePicture"
    );

    res.status(200).json(groups);
  } catch (error) {
    console.error("Get groups error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET MESSAGES
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).select("members");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.some((memberId) => memberId.equals(req.user._id))) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    const messages = await GroupMessage.find({ group: groupId })
      .populate("sender", "fullName profilePicture")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Get group messages error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ADD MEMBERS
export const addMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberIds = [] } = req.body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "Select at least one member" });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.some((memberId) => memberId.equals(req.user._id))) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    const requestedIds = [...new Set(memberIds.map((id) => String(id)))];
    const existingIds = new Set(group.members.map((memberId) => memberId.toString()));
    const newIds = requestedIds.filter((id) => !existingIds.has(id));

    if (newIds.length === 0) {
      return res.status(400).json({ message: "All selected users are already members" });
    }

    const users = await User.find({ _id: { $in: newIds } }).select("_id");

    if (users.length !== newIds.length) {
      return res.status(400).json({ message: "One or more selected users could not be found" });
    }

    group.members.push(...users.map((user) => user._id));

    await group.save();
    await group.populate("members", "fullName profilePicture");

    res.status(200).json({ success: true, group });
  } catch (error) {
    console.error("Add members error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// LEAVE GROUP
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const leavingUserId = req.user._id.toString();
    const remainingMembers = group.members.filter(
      (memberId) => memberId.toString() !== leavingUserId
    );

    if (remainingMembers.length === group.members.length) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    if (remainingMembers.length === 0) {
      await GroupMessage.deleteMany({ group: groupId });
      await group.deleteOne();
      return res.status(200).json({ success: true, deleted: true });
    }

    if (group.createdBy.toString() === leavingUserId) {
      group.createdBy = remainingMembers[0];
    }

    group.members = remainingMembers;
    await group.save();

    res.status(200).json({ success: true, group });
  } catch (error) {
    console.error("Leave group error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// SEND GROUP MESSAGE
export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: "Message text required" });
    }
    
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Not a member of this group" });
    }
    
    const message = await GroupMessage.create({
      group: groupId,
      sender: req.user._id,
      text,
    });
    
    const populatedMsg = await message.populate("sender", "fullName profilePicture");
    res.status(201).json(populatedMsg);
  } catch (error) {
    console.error("Send group message error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};