import { db } from "./lib/db";
import { loggedIn } from "./logInMiddleware";
import { User } from "./RSSFeed";
import { feed_follows, posts } from "./schema";
import { eq } from "drizzle-orm";

export async function createPost(cmdName: string, user: User, ...args: string[]): Promise<void> {
  
    const title = args[0];
    const content = args[1];
        const url = args[2];
        const feedId = args[3];

    if (!title || !content) {
        console.error("Both title and content are required to create a post.");
        throw new Error("Both title and content are required to create a post.");
    }
   
    await db.insert(posts).values({
        title: title,
        description: content,
       url: url,
       feedId: feedId,
       published_at: new Date(),
    }).execute();
    console.log(`Post '${title}' created by user '${user.name}'.`);
    
}
export async function getPostsForUser(cmdName: string, user: User, ...args: string[]): Promise<void> {
  
    const limit = parseInt(args[0]) || 2; 
    const postsForUser = await db.select().from(posts)
        .innerJoin(feed_follows, eq(feed_follows.feedId, posts.feedId))
        .where(eq(feed_follows.userId, user.id)).orderBy(posts.published_at).limit(limit).execute();
    console.log(`Posts for user '${user.name}':`);
    for (const post of postsForUser) {
        console.log(`- ${post.posts.title}: ${post.posts.description}`);
    }
}
