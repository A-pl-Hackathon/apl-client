import { NextRequest, NextResponse } from "next/server";
import liteDb, { formatDateKST } from "../../../db/lite-db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid comment ID" },
        { status: 400 }
      );
    }

    const comment = liteDb.getCommentById(id);

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Error fetching comment:", error);
    return NextResponse.json(
      { error: "Failed to fetch comment" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid comment ID" },
        { status: 400 }
      );
    }

    const existingComment = liteDb.getCommentById(id);
    if (!existingComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const { action } = await req.json();

    if (!action || !["read", "like", "unlike", "unread"].includes(action)) {
      return NextResponse.json(
        {
          error:
            'Invalid action. Must be "read", "unread", "like", or "unlike"',
        },
        { status: 400 }
      );
    }

    const now = formatDateKST();
    let updatedComment;

    if (action === "read") {
      updatedComment = liteDb.updateCommentMetadata(id, "read");
    } else if (action === "unread") {
      updatedComment = liteDb.updateCommentMetadata(id, "unread");
    } else if (action === "like") {
      updatedComment = liteDb.updateCommentMetadata(id, "like");
    } else if (action === "unlike") {
      updatedComment = liteDb.updateCommentMetadata(id, "unlike");
    }

    return NextResponse.json({ comment: updatedComment });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid comment ID" },
        { status: 400 }
      );
    }

    const comment = liteDb.getCommentById(id);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    liteDb.deleteComment(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
