const router = require("express").Router();
const protect = require("../middleware/auth.middleware");
const { getAllUsers } = require("../controllers/userController");

router.get("/profile", protect, (req, res) => {
  res.json({ user: req.user });
});
router.get("/all", getAllUsers);
module.exports = router;
