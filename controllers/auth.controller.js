const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//REGISTER
exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Email, password, and role are required." });
    }

    //email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({ email, password: hash, role });

    res.status(201).json({
      message: "User created",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // is user is already exist
    const user = await User.findOne({ email });
    // is lock
    if (!user) return res.status(403).json({ message: "Unauthorized" });

    if (user.isLocked)
      return res
        .status(403)
        .json({ message: "This account has been locked locked" });

    // is valid
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      user.failedAttempts++;
      if (user.failedAttempts >= 5) user.isLocked = true;
      await user.save();
      return res.status(403).json({ message: "Invalid credentials" });
    }

    user.failedAttempts = 0;
    await user.save();
    // token generation
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );
    res.json({
      email: user.email,
      role: user.role,
      token: token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
