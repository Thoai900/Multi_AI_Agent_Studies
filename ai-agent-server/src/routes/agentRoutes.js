const { Router } = require("express");
const agentController = require("../controllers/agentController");

const router = Router();

router.post("/ask", agentController.ask);

module.exports = router;
