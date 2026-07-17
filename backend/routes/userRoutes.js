const express = require("express");
const {adminOnly, protect, adminOrManager} = require("../middlewares/authMiddleware");
const { getUsers, getUserById, deleteUser, updateUserRole } = require("../controller/userController");

const router = express.Router();

router.get("/",protect,getUsers);
router.get("/:id",protect,getUserById);
router.delete("/:id",protect,adminOnly,deleteUser);
router.put("/:id/role",protect,adminOnly,updateUserRole);

module.exports = router;