export class Ulid {
  private static readonly ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  private static readonly ENCODING_LEN = Ulid.ENCODING.length;
  private static readonly RANDOM_LEN = 16;

  private static randomChar(): string {
    return Ulid.ENCODING[Math.floor(Math.random() * Ulid.ENCODING_LEN)];
  }

  private static encodeTime(now: number, len: number): string {
    let str = "";
    for (let i = len - 1; i >= 0; i--) {
      const mod = now % Ulid.ENCODING_LEN;
      str = Ulid.ENCODING.charAt(mod) + str;
      now = (now - mod) / Ulid.ENCODING_LEN;
    }
    return str;
  }

  public static generate(): string {
    const now = Date.now();
    const time = Ulid.encodeTime(now, 10);
    let random = "";
    for (let i = 0; i < Ulid.RANDOM_LEN; i++) {
      random += Ulid.randomChar();
    }
    return time + random;
  }

  public static isValid(str: string): boolean {
    // ULID is always 26 characters long
    if (str.length !== 26) {
      return false;
    }

    // ULID uses a specific set of characters
    const validChars = new RegExp(`^[${Ulid.ENCODING}]+$`);
    if (!validChars.test(str)) {
      return false;
    }

    // The first character of the timestamp (first 10 characters)
    // should not be greater than '7' to stay within 48-bit limit
    if (Ulid.ENCODING.indexOf(str[0]) > Ulid.ENCODING.indexOf("7")) {
      return false;
    }

    return true;
  }
}
