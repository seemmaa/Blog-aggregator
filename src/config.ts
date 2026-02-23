import fs from "fs";
import os from "os";
import path from "path";

const CONFIG_FILE_NAME = ".gatorconfig.json";

export type Config = {
  dbUrl: string;
  currentUserName?: string; 
};


function getConfigFilePath(): string {
  return path.join(os.homedir(), CONFIG_FILE_NAME);
}


function writeConfig(cfg: Config): void {
  const filePath = getConfigFilePath();
  
  const jsonContent = JSON.stringify({
    db_url: cfg.dbUrl,
    current_user_name: cfg.currentUserName,
  }, null, 2);
  
  fs.writeFileSync(filePath, jsonContent, "utf-8");
}

export function setUser(username: string): void {
  const config = readConfig();
  config.currentUserName = username;
  writeConfig(config);
}

export function readConfig(): Config {
  const filePath = getConfigFilePath();
  
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const rawConfig = JSON.parse(fileContent);
    
    
    return {
      dbUrl: rawConfig.db_url,
      currentUserName: rawConfig.current_user_name,
    };
  } catch (err) {
    throw new Error("Could not read config file. Make sure ~/.gatorconfig.json exists.");
  }
}