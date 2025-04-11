import { NextRequest, NextResponse } from "next/server";

let liteDb: any;
let seedDatabaseWithFakeData: any;

if (typeof window === "undefined") {
  import("@/app/db/lite-db").then((module) => {
    liteDb = module.default;
  });
  import("@/app/db/seed-data").then((module) => {
    seedDatabaseWithFakeData = module.seedDatabaseWithFakeData;
  });
}

export async function GET() {
  try {
    if (!liteDb || !seedDatabaseWithFakeData) {
      const liteDbModule = await import("@/app/db/lite-db");
      liteDb = liteDbModule.default;

      const seedModule = await import("@/app/db/seed-data");
      seedDatabaseWithFakeData = seedModule.seedDatabaseWithFakeData;
    }

    await seedDatabaseWithFakeData();

    const posts = liteDb.getAllPosts();

    const postsWithComments = posts.map((post: any) => {
      const comments = liteDb.getCommentsByPostId(post.id);
      return {
        ...post,
        comments,
      };
    });

    return NextResponse.json({
      success: true,
      data: postsWithComments,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Database query error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message || "An error occurred while querying the database.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    if (!liteDb) {
      const liteDbModule = await import("@/app/db/lite-db");
      liteDb = liteDbModule.default;
    }

    const { id, action } = await request.json();

    if (!id || !action) {
      return NextResponse.json(
        {
          success: false,
          error: "ID and action (read/unread/like/unlike) are required.",
        },
        { status: 400 }
      );
    }

    if (!["read", "unread", "like", "unlike"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Must be one of: read, unread, like, unlike.",
        },
        { status: 400 }
      );
    }

    const success = liteDb.updateCommentMetadata(
      id,
      action as "read" | "unread" | "like" | "unlike"
    );

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Comment not found or update failed.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Comment marked as ${
        action === "read"
          ? "read"
          : action === "unread"
          ? "unread"
          : action === "like"
          ? "liked"
          : "unliked"
      }.`,
    });
  } catch (error: any) {
    console.error("Comment update error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while updating the comment.",
      },
      { status: 500 }
    );
  }
}
