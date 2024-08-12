/**
 * Create a new Solana account with a balance of some SOL.
 * Transfer 0.1 SOL from the newly created account to `63EEC9FfGyksm7PkVC6z8uAmqozbQcTzbkWJNsgqjkFs` account.
 * Close the newly created account.
 * All of the above steps must be completed in a single transaction.
 */
// Please include the signatures of your executed transactions run on devnet in your submission.


// Signature: 4LmS5A4x6rtG9Xg5pgweTf4jynVgSJavDh4fooFbGBp3cEfJYPDMz2jPkoCRfspKhu2LNpzRZcbspwRSH8XF7wEu

import {
    Keypair,
    LAMPORTS_PER_SOL,
    SystemProgram, 
    TransactionMessage,
    VersionedTransaction
} from "@solana/web3.js";

import { payer, connection, STATIC_PUBLICKEY } from "@/lib/vars"
import { explorerURL, printConsoleSeparator } from "@/lib/helpers"

(async () => {

    //////////////////// Get current lamports //////////////////////////
    console.log("Payer address:", payer.publicKey.toBase58());

    const currentBalance = await connection.getBalance(payer.publicKey);
    console.log("Current balance of 'payer' (in lamports):", currentBalance);
    console.log("Current balance of 'payer' (in SOL):", currentBalance / LAMPORTS_PER_SOL);

    // airdrop on low balance (if needed)
    if (currentBalance <= LAMPORTS_PER_SOL) {
        console.log("Low balance, requesting an airdrop...");
        await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
    }

    // generate a new, random address to create on chain
    const keypair = Keypair.generate(); // public key, private key

    //////////////////// 1. Create new account /////////////////////

    const lamportsStatic = await connection.getBalance(STATIC_PUBLICKEY);

    console.log("Current lmports of newAccount:", 0.3 * LAMPORTS_PER_SOL);
    console.log("Current lamports of staticAccount:", lamportsStatic);

    const space = 0;

    const lamportsForCreateAccount = await connection.getMinimumBalanceForRentExemption(space);
    const lamportsTransaction = 0.3 * LAMPORTS_PER_SOL

    
    const lamportsTransactionTotal = lamportsForCreateAccount + lamportsTransaction

    console.log("Total lamports transacted to new account:", lamportsTransactionTotal);

    const createAccount = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: keypair.publicKey,
        lamports: lamportsTransactionTotal,
        space,
        programId: SystemProgram.programId,
    })

    console.log(1);


    //////////////////// 2. Transfer from newAccount to staticAccount /////////////////////
    
    const transferToStaticWalletIx = SystemProgram.transfer({
        lamports: 0.1 * LAMPORTS_PER_SOL,
        fromPubkey: keypair.publicKey,
        toPubkey: STATIC_PUBLICKEY,
        programId: SystemProgram.programId,
    })
    console.log(2);


    //////////////////// 3. Close newAccount /////////////////////
   
    const lamportsRemain = await connection.getBalance(keypair.publicKey)
    
    const closeAccount = SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: payer.publicKey,
        lamports: lamportsRemain,
        programId: SystemProgram.programId,
    })
    console.log(3);


    const latestBlockhash = await connection.getLatestBlockhash().then((res) => res.blockhash);

    const message = new TransactionMessage({
        payerKey: payer.publicKey,
        recentBlockhash: latestBlockhash,
        instructions: [
            createAccount,
            transferToStaticWalletIx,
            closeAccount,
        ],
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);

    tx.sign([payer, keypair]);

    const sig = await connection.sendTransaction(tx);

    printConsoleSeparator();

    console.log("Transaction completed.");

    const lamportsPayerRemain = await connection.getBalance(payer.publicKey);
    const lamportsStaticRemain = await connection.getBalance(STATIC_PUBLICKEY);

    console.log("Remain lamports of payers:", lamportsPayerRemain);
    console.log("Remain lamports of staticAccount", lamportsStaticRemain);

    try {
        const lamportsNewAccountRemain = await connection.getBalance(keypair.publicKey);
        if (lamportsNewAccountRemain>0){
            console.log("Remain lamports of newAccount", lamportsNewAccountRemain);
        } else {
            console.log("There is no lamport in newAccount (deleted succesfully)");
        }
    } catch (error) {
        console.log("This account was deleted");
    }

    console.log(explorerURL({txSignature: sig}));
})();

