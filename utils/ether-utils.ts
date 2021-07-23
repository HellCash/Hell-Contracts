import {parseEther} from "ethers/lib/utils";

export class EtherUtils {
  public static isValidEtherFormat(amount: string) {
    try {
      parseEther(amount);
      return true;
    } catch (e) {
      return false;
    }
  }
  public static zeroAddress(): string {
    return "0x0000000000000000000000000000000000000000";
  }
}
