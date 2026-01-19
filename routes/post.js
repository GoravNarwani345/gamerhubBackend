const express = require("express");
const router = express.Router();
const postController = require("../controllers/post");
const auth = require("../middleware/auth");

router.post("/", auth, postController.createPost);
router.get("/", postController.getPosts);
router.post("/:id/like", auth, postController.likePost);
router.post("/:id/comment", auth, postController.addComment);

module.exports = router;
