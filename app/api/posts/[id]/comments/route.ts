import { NextRequest, NextResponse } from "next/server";
import liteDb, { formatDateKST } from "../../../../db/lite-db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = parseInt(params.id);
    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post = liteDb.getPostById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comments = liteDb.getCommentsByPostId(postId);

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = parseInt(params.id);
    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post = liteDb.getPostById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const { author, content } = await req.json();

    if (!author || !content) {
      return NextResponse.json(
        { error: "Author and content are required" },
        { status: 400 }
      );
    }

    const comment = liteDb.createComment({
      postId,
      author,
      content,
      createdAt: formatDateKST(),
      readAt: null,
      likedAt: null,
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
