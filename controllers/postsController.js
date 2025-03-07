import { UploadPostsImages } from "../middlewares/cloudinary.js";
import { Posts } from "../models/postsModel.js";
import { User } from "../models/userModels.js";
import { v2 as cloudinary } from "cloudinary";

export const createPost = async (req, res, next) => {
  try {
    const files = req.files;

    const { postContent, tags, userId } = req.body;
    const postImagesArray = [];

    const user = await User.findById(userId);
    if (!user)
      return res.status(400).json({
        success: false,
        message: "user not found",
      });

    if (files && files.length > 0) {
      if (files.length > 10)
        return res.status(400).json({
          success: false,
          message: "You can upload a maximum of 10 images",
        });

      const uploadImagesPromise = [];

      files.forEach((img) => {
        let promise = UploadPostsImages(
          img.path,
          `${user?.userName}-${user?._id}`
        );
        uploadImagesPromise.push(promise);
      });

      const imagesUploadResponses = await Promise.all(uploadImagesPromise);
      imagesUploadResponses.forEach((response) => {
        postImagesArray.push({
          url: response?.secure_url,
          public_id: response?.public_id,
        });
      });
    }

    const newPost = await Posts.create({
      postContent,
      tags,
      userId,
      postImages: postImagesArray,
    });

    await user.updateOne({ $push: { posts: newPost._id } });

    res.status(200).json({
      success: true,
      message: "Post Created Successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};

export const getAllPosts = async (req, res, next) => {
  try {
    const posts = await Posts.find()
      .populate("userId")
      .populate("likedBy")
      .sort({ createdAt: -1 })
      .exec();
    if (!posts)
      return res.status(400).json({
        success: false,
        message: "No Posts Found",
      });

    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};

export const likeUnlikePost = async (req, res, next) => {
  try {
    const { postId, userId } = req.body;

    const post = await Posts.findById(postId);

    if (!post)
      return res.status(400).json({
        success: false,
        message: "No Post Found",
      });

    if (post.likedBy.includes(userId)) {
      post.likedBy = post.likedBy.filter((id) => id.toString() !== userId);
    } else {
      post.likedBy.push(userId);
    }

    await post.save();

    res.status(200).json({
      success: true,
      message: "Post liked/unliked successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};

export const editPost = async (req, res, next) => {
  try {
    const { postId, newContent, newTags } = req.body;

    const post = await Posts.findById(postId);

    if (!post)
      return res.status(400).json({
        success: false,
        message: "No Post Found",
      });

    await post.updateOne({
      $set: {
        postContent: newContent,
        tags: newTags,
      },
    });

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const { postId } = req.body;

    const post = await Posts.findById(postId);

    if (!post)
      return res.status(400).json({
        success: false,
        message: "No Post Found",
      });

    if (post?.postImages && post?.postImages.length > 0) {
      let postPromises = [];

      post?.postImages.forEach((post) => {
        if (post?.public_id) {
          let promise = cloudinary.uploader.destroy(post?.public_id);
          postPromises.push(promise);
        }
      });

      await Promise.all(postPromises);
    }

    await Posts.findByIdAndDelete(postId);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};

export const bookmarkPost = async (req, res, next) => {
  try {
    const { postId, userId } = req.body;

    const post = await Posts.findById(postId);

    if (!post)
      return res.status(400).json({
        success: false,
        message: "No Post Found",
      });

    const user = await User.findById(userId);

    if (!user)
      return res.status(400).json({
        success: false,
        message: "No user Found",
      });

    if (user?.bookmarkedPosts?.includes(postId)) {
      user.bookmarkedPosts = user?.bookmarkedPosts.filter(
        (id) => id.toString() !== postId
      );
    } else {
      user?.bookmarkedPosts.push(postId);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Post bookmarked successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};
