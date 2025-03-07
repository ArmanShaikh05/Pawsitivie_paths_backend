import express from "express";
import { uploadMiddleware } from "../middlewares/multer.js";
import { bookmarkPost, createPost, deletePost, editPost, getAllPosts, likeUnlikePost } from "../controllers/postsController.js";

const router = express.Router()



router.post("/create-post",uploadMiddleware.array("files",10),createPost)

router.get("/all-posts",getAllPosts)

router.post("/like-unlike",likeUnlikePost)

router.post("/edit-post",editPost)

router.post("/delete",deletePost)

router.post("/bookmark-post",bookmarkPost)


export default router