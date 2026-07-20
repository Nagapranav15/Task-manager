const Holiday = require("../model/Holiday");

// @desc    Get all public holidays
// @route   GET /api/holidays
// @access  Private
const getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find()
      .sort({ date: 1 })
      .lean();
    res.status(200).json(holidays);
  } catch (error) {
    console.error("Get Holidays Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create a public holiday (Admin Only)
// @route   POST /api/holidays
// @access  Private (Admin Only)
const createHoliday = async (req, res) => {
  try {
    const { title, date, type, description } = req.body;

    if (!title || !date) {
      return res.status(400).json({ message: "Title and date are required." });
    }

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "long" });

    const holiday = await Holiday.create({
      title,
      date: dateObj,
      dayOfWeek,
      type: type || "Mandatory",
      description: description || "",
      createdBy: req.user._id,
    });

    res.status(201).json({ message: "Public holiday added successfully.", holiday });
  } catch (error) {
    console.error("Create Holiday Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update a public holiday (Admin Only)
// @route   PUT /api/holidays/:id
// @access  Private (Admin Only)
const updateHoliday = async (req, res) => {
  try {
    const { title, date, type, description } = req.body;
    const holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found." });
    }

    if (title) holiday.title = title;
    if (date) {
      const dateObj = new Date(date);
      holiday.date = dateObj;
      holiday.dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "long" });
    }
    if (type) holiday.type = type;
    if (description !== undefined) holiday.description = description;

    await holiday.save();
    res.status(200).json({ message: "Holiday updated successfully.", holiday });
  } catch (error) {
    console.error("Update Holiday Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a public holiday (Admin Only)
// @route   DELETE /api/holidays/:id
// @access  Private (Admin Only)
const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found." });
    }
    res.status(200).json({ message: "Holiday deleted successfully." });
  } catch (error) {
    console.error("Delete Holiday Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
};
