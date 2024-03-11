const hre  = require("hardhat");
const config = require('../src/config.json')

const tokens = (n) => { 
    return ethers.utils.parseUnits(n.toString(), 'ether') 
}

const ether = tokens

async function main() { 
    console.log(`Fetching accounts & network....\n`)

    const accounts = await ethers.getSigners()
    const funder = accounts[0]
    const investor1 = accounts[1]
    const investor2 = accounts[2]
    const investor3 = accounts[3]
    const recipient = accounts[4]

    let transaction

    // Fetch networks
    const { chainId } = await ethers.provider.getNetwork()

    console.log(`Fetching token and transferring to accounts....\n`)

    // Fetch deployed token
    const token = await ethers.getContractAt('Token', config[chainId].token.address)    
    console.log(`Token fetched: ${token.address}\n`)

    // Send tokens to investors -each one gets 20%
    transaction = await token.transfer(investor1.address, tokens(200000))
    await transaction.wait()

    transaction = await token.transfer(investor2.address, tokens(200000))
    await transaction.wait()

    transaction = await token.transfer(investor3.address, tokens(200000))
    await transaction.wait()

    console.log(`Fetching dao...\n`)

    // Fetch deployed dao
    const dao = await ethers.getContractAt('DAO', config[chainId].dao.address)
    console.log(`DAO fetched: ${dao.address}\n`)

    // Funder sends ETHER to DAO treasury
    transaction = await funder.sendTransaction({ to: dao.address, value: ether(1000) })
    await transaction.wait()
    console.log(`Sent funds to dao treasury...\n`)
    
    for (var i = 0; i < 3; i++) {

        // Create proposal
        transaction = await dao.connect(investor1).createProposal
        (
            `Proposal  ${i + 1}`, 
            ether(100), 
            recipient.address
        )
        await transaction.wait()

        // Vote on proposal
        transaction = await dao.connect(investor1).vote(i + 1)
        await transaction.wait()

        transaction = await dao.connect(investor2).vote(i + 1) 
        await transaction.wait()

        transaction = await dao.connect(investor3).vote(i + 1)
        await transaction.wait()
        
        // Finalize
        transaction = await dao.connect(investor1).finalizeProposal(i + 1)
        await transaction.wait()

        console.log(`Created, Voted & Finalized Proposal ${i + 1}\n`)
    }

    console.log(`Creating one more proposal...\n`)

    // Create proposal
    transaction = await dao.connect(investor1).createProposal( `Proposal 4`, ether(100), recipient.address)
    await transaction.wait()

    transaction = await dao.connect(investor2).vote(4)
    await transaction.wait()

    transaction = await dao.connect(investor3).vote(4) 
    await transaction.wait()

    console.log(`Finished. \n`)
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
