import { eq } from "drizzle-orm";
import { db } from "..";
import { feeds, users } from "../../../schema";
import { get } from "node:http";
import { readConfig } from "src/config";


export async function createUser(name: string) {
    if(!name){
        throw new Error("Username is required to create a user.");
    }
    const existingUser = await getUser(name);
    if (existingUser) {
        throw new Error(`User with name '${name}' already exists.`);
    }
  const [result] = await db.insert(users).values({ name: name }).returning();
  return result;
}
export async function getUser(name: string) {
    if(!name){
        throw new Error("Username is required to fetch user.");
    }
  const results = await db.select().from(users).where(eq(users.name, name));
    console.log(`Checking for ${name}, found:`, results.length); // DEBUG LINE
    return results[0];
}

export async function truncateUsers() {
     await db.delete(feeds).execute();
  await db.delete(users).execute();
 
}

export async function getAllUsers() {
  const results = await db.select().from(users);
 results.forEach(user => {
    
    console.log(user.name,readConfig().currentUserName==user.name?"(current)":"");
  });
  
}