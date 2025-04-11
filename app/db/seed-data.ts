import liteDb, { Post, Comment, formatDateKST } from "./lite-db";

let isInitialized = false;

export async function seedDatabaseWithFakeData() {
  if (typeof window !== "undefined") {
    console.warn(
      "seedDatabaseWithFakeData can only be executed on the server side."
    );
    return;
  }

  if (isInitialized) {
    console.log("Database has already been initialized.");
    return;
  }

  const existingPosts = liteDb.getAllPosts();
  if (existingPosts.length > 0) {
    console.log(
      `Database already has ${existingPosts.length} posts. Skipping seed operation.`
    );
    isInitialized = true;
    return;
  }

  try {
    console.log("Adding test data to the database...");

    const posts: Omit<Post, "id">[] = [
      {
        author: "Prof. Kim",
        content:
          "This post summarizes the main activities and achievements of APL in January 2024. This month, two major papers were published, and a new research project was started.",
        createdAt: new Date("2024-01-15T09:00:00+09:00")
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
      },
      {
        author: "Park TA",
        content:
          "Guidelines for lab equipment usage. Includes reservation methods, cleanup procedures, and troubleshooting steps.",
        createdAt: new Date("2023-12-05T14:30:00+09:00")
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
      },
      {
        author: "Prof. Lee",
        content:
          "Spring 2024 seminar schedule and presenter list. All lab members must prepare at least one presentation.",
        createdAt: new Date("2024-01-02T11:15:00+09:00")
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
      },
      {
        author: "Prof. Kim",
        content:
          "Tips for effective paper writing and standard template files used in our lab. Includes a brief guide on LaTeX usage.",
        createdAt: new Date("2023-11-20T16:45:00+09:00")
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
      },
      {
        author: "Choi Admin",
        content:
          "Guidelines for research fund usage reports and submission deadlines. Receipt management and report templates are attached.",
        createdAt: new Date("2024-01-10T10:30:00+09:00")
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
      },
    ];

    for (const post of posts) {
      liteDb.createPost(post);
    }

    const allPosts = liteDb.getAllPosts();

    const comments: Omit<Comment, "id">[] = [
      {
        postId: allPosts[0].id as number,
        author: "Park Researcher",
        content:
          "January paper achievements are really impressive. Especially the Nature paper is a great accomplishment!",
        createdAt: new Date("2024-01-15T10:30:00+09:00")
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
        readAt: "2024-01-15 10:35:00",
        likedAt: null,
      },
      {
        postId: allPosts[0].id as number,
        author: "Kim MS Student",
        content: "Will there be additional meetings regarding the new project?",
        createdAt: new Date("2024-01-15T11:45:00+09:00")
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
        readAt: null,
        likedAt: "2024-01-15 12:00:00",
      },
      {
        postId: allPosts[1].id as number,
        author: "Lee PhD",
        content: "Has the SEM reservation system been updated?",
        createdAt: new Date("2023-12-06T09:20:00+09:00")
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
        readAt: "2023-12-06 10:00:00",
        likedAt: null,
      },
      {
        postId: allPosts[2].id as number,
        author: "Choi MS Student",
        content:
          "My presentation is scheduled for March 15, but I'll be attending a conference then. Can we adjust the schedule?",
        createdAt: new Date("2024-01-03T14:10:00+09:00")
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
        readAt: null,
        likedAt: null,
      },
      {
        postId: allPosts[2].id as number,
        author: "Prof. Kim",
        content:
          "Yes, we can adjust to another date. Please email me your available dates.",
        createdAt: new Date("2024-01-03T16:30:00+09:00")
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
        readAt: "2024-01-03 17:00:00",
        likedAt: "2024-01-03 17:05:00",
      },
      {
        postId: allPosts[3].id as number,
        author: "Jung Researcher",
        content:
          "Could you also add a BibTeX style file to the LaTeX template?",
        createdAt: new Date("2023-11-21T09:05:00+09:00")
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
        readAt: null,
        likedAt: null,
      },
      {
        postId: allPosts[4].id as number,
        author: "Han MS Student",
        content: "Could you clarify the exact deadline for report submission?",
        createdAt: new Date("2024-01-10T13:25:00+09:00")
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
        readAt: "2024-01-10 14:00:00",
        likedAt: null,
      },
      {
        postId: allPosts[4].id as number,
        author: "Choi Admin",
        content:
          "This month's deadline is January 31. Please submit by the deadline.",
        createdAt: new Date("2024-01-10T14:40:00+09:00")
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
        readAt: null,
        likedAt: null,
      },
    ];

    for (const comment of comments) {
      liteDb.createComment(comment);
    }

    console.log("Test data has been added successfully!");
    isInitialized = true;
  } catch (error) {
    console.error("Error while seeding database:", error);
    throw error;
  }
}
