import {Contract} from "ethers";

export class Console {
    static logHr() {
        console.log("-----------------------------------------------------------------------------------------------------------------------------------------------")
    }
    static logTitle(message: string) {
        this.logHr();
        console.log("\t\t" +message);
        this.logHr();
    }
    static contractDeploymentInformation(name: string, contract: Contract) {
        this.logTitle(`Contract "${name}" deployed to address: ${contract.address}`);
    }
}