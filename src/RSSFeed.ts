import { XMLParser } from "fast-xml-parser";
import { getUser } from "./lib/db/quries/users";
import { read } from "node:fs";
import { readConfig } from "./config";
import { feed_follows, feeds, posts, users } from "./schema";
import { db } from "./lib/db";
import { eq } from "drizzle-orm";
import { loggedIn } from "./logInMiddleware";


type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export async function fetchFeed(feedURL: string) : Promise<RSSFeed> {
    const response = await fetch(feedURL,
        {
            headers: {
                "User-Agent": "gator"
            },

        }
    );
    if (!response.ok) {
        throw new Error(`Failed to fetch feed: ${response.statusText}`);
    }
    const xmlText = await response.text();
    const parser = new XMLParser();
    const feed = parser.parse(xmlText);
    if(!feed.rss || !feed.rss.channel){
        throw new Error("Invalid RSS feed format.");
    }
    if(!feed.rss.channel.title || !feed.rss.channel.link || !feed.rss.channel.description || !feed.rss.channel.item){
        throw new Error("RSS feed is missing required fields (title, link, description, item).");
    }
    const rssFeed: RSSFeed = {
        channel: {
            title: feed.rss.channel.title,
            link: feed.rss.channel.link,
            description: feed.rss.channel.description,
            item: Array.isArray(feed.rss.channel.item) ? feed.rss.channel.item.map((item: any) => ({
                title: item.title,
                link: item.link,
                description: item.description,
                pubDate: item.pubDate,
            })) : [],
        },
    };
    return rssFeed;
    

}
export async function createFeed(cmdName: string,user: User, ...args: string[]): Promise<void> {
    try {
      const user =  readConfig().currentUserName;
        if (!user) {
            throw new Error("No user is currently logged in. Please log in to create a feed.");
        }
        const name = args[0];
        const feedURL = args[1];
        if (!name || !feedURL) {
            throw new Error("Feed name and URL are required to create a feed.");
        }
        const feed = await fetchFeed(feedURL);
        const userRecord = await getUser(user);
        if (!userRecord) {
            throw new Error(`User '${user}' not found in database.`);
        }
        await db.insert(feeds).values({
            url: feedURL,
            name: name,
            user_id: userRecord.id,
        }).execute();
        await createFeedFollow(cmdName, userRecord, feedURL);
        console.log(`Feed '${name}' created and followed by user '${user}'.`);
        

    } catch (error) {
        console.error("Error creating feed:", error);
        throw error;
    }
}
export type Feed = typeof feeds.$inferSelect;
export type User = typeof users.$inferSelect;

export async function printFeed(feed: Feed, user: User) : Promise<void> {
    console.log(`Feed: ${feed.name} (${feed.url}) - User: ${user.name}`);
}

export async function printAllFeeds() : Promise<void> {
    const allFeeds = await db.select().from(feeds).execute();
    for (const feed of allFeeds) {
        const user = await db.select().from(users).where(eq(users.id, feed.user_id)).execute();
        if (user.length > 0) {
            await printFeed(feed, user[0]);
        }
    }
}

export async function createFeedFollow(cmdName: string,user: User, ...args: string[]): Promise<void> {
    try {
        const feedURL = args[0];
        if (!feedURL) {
            throw new Error("Feed URL is required to follow a feed.");
        }
        const feedRecord = await db.select().from(feeds).where(eq(feeds.url, feedURL)).execute();
        if (feedRecord.length === 0) {
            throw new Error(`Feed with URL '${feedURL}' not found.`);
        }
        const feedId = feedRecord[0].id;
        const userRecord = await getUser(user.name);
        if (!userRecord) {
            throw new Error(`User '${user.name}' not found in database.`);
        }
        await db.insert(feed_follows).values({
            userId: userRecord.id,
            feedId: feedId,
        }).execute();
        console.log(`feed`, feedURL, `followed by user`, user);
    } catch (error) {
        console.error("Error following feed:", error);
        throw error;
    }
}

export async function getFeedFollowsForUser(cmdName: string,user: User, ...args: string[]): Promise<void> {
    
    const userRecord = await getUser(user.name);
    const feedss = await db.select().from(feed_follows).innerJoin(feeds, eq(feed_follows.feedId, feeds.id)).where(eq(feed_follows.userId, userRecord.id)).execute();
    console.log(`Feeds followed by ${userRecord.name}:`);
    for (const feed of feedss) {
        console.log(`- ${feed.feeds.name} (${feed.feeds.url})`);
    }
}
export async function unfollowFeed(cmdName: string,user: User, ...args: string[]): Promise<void> {
    try {
        const user =  readConfig().currentUserName;
        if (!user) {
            throw new Error("No user is currently logged in. Please log in to unfollow a feed.");
        }
        const feedURL = args[0];
        if (!feedURL) {
            throw new Error("Feed URL is required to unfollow a feed.");
        }
        const feedRecord = await db.select().from(feeds).where(eq(feeds.url, feedURL)).execute();
        if (feedRecord.length === 0) {
            throw new Error(`Feed with URL '${feedURL}' not found.`);
        }
        const feedId = feedRecord[0].id;
        const userRecord = await getUser(user);
        if (!userRecord) {
            throw new Error(`User '${user}' not found in database.`);
        }
        await db.delete(feed_follows).where(eq(feed_follows.userId, userRecord.id)).execute();
        console.log(`feed`, feedURL, `unfollowed by user`, user);
    } catch (error) {
        console.error("Error unfollowing feed:", error);
        throw error;
    }
}

export async function markFeedFetched(feedId: string): Promise<void> {
    await db.update(feeds).set({ last_fetched_at: new Date() , updatedAt: new Date()    }).where(eq(feeds.id, feedId)).execute();
}

export async function getNextFeedToFetch(): Promise<Feed[]> {
    const feedsToFetch = await db.select().from(feeds).orderBy(feeds.last_fetched_at).execute();
    return feedsToFetch;
}



export async function scrapeFeeds(): Promise<void> {
    const feedsToFetch = await getNextFeedToFetch();
    
    for (const feed of feedsToFetch) {
        try {
            console.log(`Fetching feed: ${feed.name} (${feed.url})`);
            const rssFeed = await fetchFeed(feed.url);
            
            for (const item of rssFeed.channel.item) {
                try {
                    await db.insert(posts).values({
                        title: item.title,
                        url: item.link,
                        description: item.description || "",
                        feedId: feed.id,
                        published_at: new Date(item.pubDate), 
                    })
                    .onConflictDoNothing({ target: posts.url }); 
                } catch (postError) {
                    console.error(`Error saving post ${item.title}:`, postError);
                }
            }

            console.log(`Successfully updated ${feed.name}: Saved ${rssFeed.channel.item.length} items.`);
            await markFeedFetched(feed.id);
        } catch (error) {
            console.error(`Error fetching feed '${feed.name}':`, error);
        }
    }
}
