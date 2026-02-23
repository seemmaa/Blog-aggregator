import { User } from "./RSSFeed";
import { CommandHandler } from "./Handlers";
import { UserCommandHandler } from "./Handlers";
import { readConfig } from "./config";
import { getUser } from "./lib/db/quries/users";
type middlewareLoggedIn = (handler: UserCommandHandler) => CommandHandler;

export const loggedIn: middlewareLoggedIn = (handler) => {
    return async (cmdName: string, ...args: string[]) => {
        const user = readConfig().currentUserName;
        if (!user) {
            console.error("You must be logged in to run this command.");
            throw new Error("You must be logged in to run this command.");
        }
        const userRecord = await getUser(user);
        if (!userRecord) {
            console.error(`User '${user}' not found in database. Please register first.`);
            throw new Error(`User '${user}' not found in database. Please register first.`);
        }
        await handler(cmdName, userRecord, ...args);
    };
};
