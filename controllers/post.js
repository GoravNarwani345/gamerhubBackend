const Post = require("../models/post");

// Create a new post
exports.createPost = async (req, res) => {
    const { content, mediaUrl, mediaType } = req.body;
    const post = new Post({
        author: req.user.userId, // Fixed from req.user._id
        content,
        mediaUrl,
        mediaType
    });
    await post.save();
    res.status(201).json({ success: true, post });
};

// Get all posts (feed)
exports.getPosts = async (req, res) => {
    const posts = await Post.find()
        .populate("author", "username avatar")
        .populate("comments.user", "username avatar")
        .sort({ createdAt: -1 });
    res.status(200).json({ success: true, posts });
};

// Like/Unlike a post
exports.likePost = async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const index = post.likes.indexOf(req.user.userId);
    if (index === -1) {
        post.likes.push(req.user.userId);
    } else {
        post.likes.splice(index, 1);
    }

    await post.save();
    res.status(200).json({ success: true, likes: post.likes });
};

// Add a comment
exports.addComment = async (req, res) => {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    post.comments.push({
        user: req.user.userId,
        text
    });

    await post.save();
    const updatedPost = await Post.findById(req.params.id).populate("comments.user", "username avatar");
    res.status(201).json({ success: true, comments: updatedPost.comments });
};
