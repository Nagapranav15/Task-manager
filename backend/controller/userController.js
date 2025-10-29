const Task = require("../model/Task");
const User = require("../model/User");

// @desc Get all users (Admin only)
// @route GET /api/users
// @access Private (Admin)
const getUsers = async (req, res) => {
    try {
        const users = await User.find({role:'member'}).select("-password");

            const userWithTaskCounts = await Promise.all(
                users.map(async(user) =>{
            const pendingTasks= await Task.countDocuments({
                assignedTo:user._id,status:"Pending"
            });
            const inProgressTasks= await Task.countDocuments({
                assignedTo:user._id,status:"In Progress"
            });
            const completedTasks= await Task.countDocuments({
                assignedTo:user._id,status:"Completed"
            });
            return {
                ...user._doc,
                pendingTasks,
                inProgressTasks,
                completedTasks
            };
        }));
        res.json(userWithTaskCounts );
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }       
};

// @desc Get user by ID 
// @route GET /api/users/:id
// @access Private       
const getUserById = async (req, res) => {   
    try {       
        const user = await User.findById(req.params.id).select("-password");
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// @desc Delete user by ID (Admin only)
// @route DELETE /api/users/:id
// @access Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        await user.deleteOne();
        return res.json({ message: "User deleted successfully" });
    } catch (err) {
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};


module.exports = {
    getUsers,
    getUserById,
    deleteUser,
};