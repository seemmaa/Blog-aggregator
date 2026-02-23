import { exit } from "node:process";
import { setUser, readConfig } from "./config.js";
import { CommandsRegistry, aggHandler, helpHandler, registerCommand, runCommand } from "./Handlers.js";
import { handlerLogin } from "./Handlers.js";
import { argv } from "node:process";
import { register } from "node:module";
import { registerHandler } from "./Handlers.js";
import { truncate } from "node:fs";
import { getAllUsers, truncateUsers } from "./lib/db/quries/users.js";
import { createFeed, createFeedFollow, getFeedFollowsForUser, printAllFeeds, unfollowFeed } from "./RSSFeed.js";
import { loggedIn } from "./logInMiddleware.js";
import { getPostsForUser } from "./posts.js";


async function main() {
 
 

  const config = readConfig();

  const commandsRegistry: CommandsRegistry = {
    cmdName: ["login"],
    handler: [handlerLogin],
   
  };
  registerCommand(commandsRegistry, "register", registerHandler);
  
  registerCommand(commandsRegistry, "reset", truncateUsers);
 
  registerCommand(commandsRegistry, "users", getAllUsers);

  registerCommand(commandsRegistry, "agg", aggHandler);
  registerCommand(commandsRegistry, "addfeed", loggedIn(createFeed));
  registerCommand(commandsRegistry, "feeds", printAllFeeds);
  registerCommand(commandsRegistry, "follow", loggedIn(createFeedFollow));
  registerCommand(commandsRegistry, "following", loggedIn(getFeedFollowsForUser));
  registerCommand(commandsRegistry, "unfollow", loggedIn(unfollowFeed));
  registerCommand(commandsRegistry, "browse", loggedIn(getPostsForUser));
  registerCommand(commandsRegistry, "help", helpHandler);

  const args = argv.slice(2);
  if(args.length === 0){
   console.log("the login handler expects a single argument, the username.");    
   exit(1);    
  }
  const cmdName = args[0];
  const argArray = args.slice(1);


  try{
    await runCommand(commandsRegistry, cmdName, ...argArray);
  }catch(e){
    console.error(e);
    exit(1);
  }
 
  

 
  process.exit(0);  
}

main();