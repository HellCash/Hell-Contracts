import {parseEther} from "ethers/lib/utils";

export const zeroBytes32: string = '0x0000000000000000000000000000000000000000000000000000000000000000';
export const zeroAddress: string = '0x0000000000000000000000000000000000000000';

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
