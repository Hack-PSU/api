export class Util {
  public static readEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }
}
