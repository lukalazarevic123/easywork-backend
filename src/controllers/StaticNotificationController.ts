// import { PushAPI } from "@pushprotocol/restapi";
// import { ENV } from "@pushprotocol/restapi/src/lib/constants";
// import { Wallet } from "ethers";

// export class StaticNotificationController {

//     public static async notifyCategorySubscribers() {

//     }

//     public static async addSubscriber() {
//     }

//     public static async initializePushUser(privateKey: string) {

//         const signer = await this.getSignerFromPrivateKey(privateKey ?? "NA");
//         console.log(signer);

//         const user = await PushAPI.initialize(signer, { env: 'staging' as ENV });

//         console.log(user);
//     }

//     public static async getSignerFromPrivateKey(privateKey:string) {
//         // Ensure the private key is prefixed with '0x'
//         if (!privateKey.startsWith('0x')) {
//             privateKey = '0x' + privateKey;
//         }
    
//         // Create a wallet from the private key
//         const wallet = new Wallet(privateKey);
    
//         // Return the signer object
//         return wallet;
//     }
// }