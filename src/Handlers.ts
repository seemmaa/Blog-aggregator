import { create } from "node:domain";
import { setUser } from "./config";
import { createUser, getUser } from "./lib/db/quries/users";
import { get } from "node:http";
import { fetchFeed, scrapeFeeds, User } from "./RSSFeed";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

export type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

export type CommandsRegistry = {
    cmdName: string[];
    handler: CommandHandler[];
    
}

export async function  registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler){
    registry.cmdName.push(cmdName);
    registry.handler.push(handler);

}

export async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]){
    const handlerIndex = registry.cmdName.indexOf(cmdName);
    if (handlerIndex !== -1) {
       await registry.handler[handlerIndex](cmdName, ...args);
    } else {
        throw new Error(`Command '${cmdName}' not found.`);
    }
   
   
}

export  async function handlerLogin(cmdName: string, ...args: string[]): Promise<void> {
    if (args.length === 0){
         console.error("the login handler expects a single argument, the username.");
        throw new Error("the login handler expects a single argument, the username."); 
              
    }
    const username = args[0];
    const userExists = await getUser(username);
    if(!userExists){
        throw new Error(`User with name '${username}' does not exist. Please register first.`);
    }
    setUser(username);
    console.log(`Config updated: User set to ${username}`);
}

export async function registerHandler(cmdName: string, ...args: string[]): Promise<void> {
    if(args.length === 0){
        console.error("the register handler expects a single argument, the username.");
        throw new Error("the register handler expects a single argument, the username."); 
    }
    const username = args[0];
    await createUser(username);
    setUser(username);
    console.log(`user ${username} created. Config updated: User set to ${username}`);

 
}

export async function aggHandler(cmdName: string, ...args: string[]): Promise<void> {
  const time_between_reqs = parseDuration(args[0] || "10s");
  console.log(`Collecting feeds every ${time_between_reqs} ms`);
   scrapeFeeds().catch();

const interval = setInterval(() => {
  scrapeFeeds().catch();
}, time_between_reqs);

await new Promise<void>((resolve) => {
  process.on("SIGINT", () => {
    console.log("Shutting down feed aggregator...");
    clearInterval(interval);
    resolve();
  });
});
}

export  function parseDuration(durationStr: string): number {
   // use regex 1h ->ms
    const regex = /(\d+)([smhd])/;
    const match = durationStr.match(regex);
    if (!match) {
        throw new Error("Invalid duration format. Use formats like '10s', '5m', '2h', or '1d'.");
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
        case "s":
            return value * 1000;
        case "m":
            return value * 60 * 1000;
        case "h":
            return value * 60 * 60 * 1000;
        case "d":
            return value * 24 * 60 * 60 * 1000;
        default:
            throw new Error("Invalid time unit. Use 's' for seconds, 'm' for minutes, 'h' for hours, or 'd' for days.");
    }

}

export async function helpHandler(cmdName: string, ...args: string[]): Promise<void> {
    console.log("\n🐊 Gator Blog Aggregator - Available Commands:");
    console.log("--------------------------------------------------");
    
    const commands = [
        ["register <name>", "Create a new user and log in."],
        ["login <name>",    "Switch to an existing user."],
        ["users",           "List all registered users."],
        ["addfeed <name> <url>", "Add a new RSS feed and follow it."],
        ["feeds",           "List all feeds in the database."],
        ["follow <url>",    "Follow an existing feed."],
        ["unfollow <url>",  "Stop following a feed."],
        ["following",       "Show all feeds you are currently following."],
        ["agg",             "Start the background scraper (updates every 1m)."],
        ["browse <limit>",  "View latest posts (defaults to 2)."],
        ["reset",           "⚠️  Clear all data from the database."],
        ["help",            "Show this menu."]
    ];

    commands.forEach(([cmd, desc]) => {
        console.log(`${cmd.padEnd(25)} : ${desc}`);
    });
    console.log("");
}