"use server";

import { prisma } from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";
import { tree } from "next/dist/build/templates/app-page";

const createPost = async (content: string, imageUrl: string) => {
  try {
    const userId = await getDbUserId();
    if (!userId) return;

    const post = await prisma.post.create({
      data: {
        content: content,
        image: imageUrl || null,
        authorId: userId,
      },
    });

    revalidatePath("/"); // purge the cache for the homepage
    return { success: true, post };
  } catch (error) {
    console.error("Failed to create post:", JSON.stringify(error, null, 2));
    return { success: false, error: "Failed to create post" };
  }
};

const getPosts = async () => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id:true,
            name: true,
            username: true,
            image: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return posts;
  } catch (error) {
    console.error("", JSON.stringify(error));
    throw new Error("Failed to fetch posts");
  }
};

const toggleLike = async (postId: string) => {
  try {
    const userId = await getDbUserId();
    if (!userId) return;

    //check if  like exists
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: postId,
          userId: userId,
        },
      },
    });

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        author: true,
      },
    });

    if (!post) throw new Error("Post not found");

    if (existingLike) {
      //unlike
      await prisma.like.delete({
        where: {
          postId_userId: {
            postId: postId,
            userId: userId,
          },
        },
      });
    } else {
      //like and create notification(only if liking someone else's post)
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId: userId,
            postId: postId,
          },
        }),
        ...(post.author.id !== userId
          ? [
              prisma.notification.create({
                data: {
                  type: "LIKE",
                  userId: post.author.id, // receipt (post author)
                  creatorId: userId, //person who like
                  postId,
                },
              }),
            ]
          : []),
      ]);
    }
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle like", JSON.stringify(error));
    return { success: false, error: "failed to toggle like" };
  }
};

const createComment = async (postId: string, content: string) => {
  try {
    const userId = await getDbUserId();
    if (!userId) return;
    if (!content) throw new Error("Content is required");

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        authorId: true,
      },
    });

    if(!post) throw new Error("Post not found");

    //create comment and notification in transaction
    const [comment] = await prisma.$transaction(async(tx)=>{
      //create comment first
      const newComment = await tx.comment.create({
        data:{
          content: content,
          authorId: userId,
          postId
        },
      });
      //create notification if commenting on somone else's post
      if(post.authorId !== userId){
        await tx.notification.create({
          data:{
            type:'COMMENT',
            userId: post.authorId,
            creatorId: userId,
            postId,
            commentId: newComment.id
          },
        });
      }
      
      return [newComment];
    });

    revalidatePath('/'); // pruge the cache 
    return {success:true, comment};

  } catch (error) {
    console.error("Failed to create comment", JSON.stringify(error));
    return {success: false, error:"Failed to create comment"}
  }
};

const deletePost = async(postId:string)=>{
  try {
    const userId = await getDbUserId();

    const post = await prisma.post.findUnique({
      where:{
        id:postId
      },
      select:{
        authorId:true
      },
    });
    if(!post) throw new Error("Post not found");

    if(post.authorId !== userId) throw new Error("Unauthorized - no delete permission");

    await prisma.post.delete({
      where:{
        id:postId
      },
    });

    revalidatePath("/");
    return {success:true}

  } catch (error) {
    console.log("Failed to delete post error", error);
    return {success:false, error:"Failed to delete post"}
  }
}

export { createPost, 
  getPosts, 
  toggleLike, 
  createComment,
  deletePost,
 };
