const express = require("express");
const {adminOnly, protect, adminOrManager} = require("../middlewares/authMiddleware");
const { getUsers, getUserById, deleteUser, updateUserRole, inviteUser } = require("../controller/userController");

const router = express.Router();

router.get("/",protect,getUsers);
router.post("/invite",protect,adminOnly,inviteUser);
router.get("/:id",protect,getUserById);
router.delete("/:id",protect,adminOnly,deleteUser);
router.put("/:id/role",protect,adminOnly,updateUserRole);

module.exports = router;