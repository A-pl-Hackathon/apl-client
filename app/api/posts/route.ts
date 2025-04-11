import { NextRequest, NextResponse } from "next/server";
import liteDb, { formatDateKST } from "../../db/lite-db";

export async function GET(req: NextRequest) {
  try {
    const allPosts = liteDb.getAllPosts();
    return NextResponse.json({ posts: allPosts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { author, content } = await req.json();

    if (!author || !content) {
      return NextResponse.json(
        { error: "Author and content are required" },
        { status: 400 }
      );
    }

    const post = liteDb.createPost({
      author,
      content,
      createdAt: formatDateKST(),
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
