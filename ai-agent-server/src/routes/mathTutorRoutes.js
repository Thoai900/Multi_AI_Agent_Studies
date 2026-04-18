const { Router } = require("express");
const { solve } = require("../controllers/mathTutorController");

const router = Router();

router.post("/math-tutor", solve);

module.exports = router;
