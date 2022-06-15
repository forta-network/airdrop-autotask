const ethers = require('ethers');
const axios = require('axios');
const { DefenderRelaySigner, DefenderRelayProvider } = require('defender-relay-client/lib/ethers');

const AIRDROP_ABI = [{
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_index",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      },
      {
        "internalType": "bytes32[]",
        "name": "_proof",
        "type": "bytes32[]"
      }
    ],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}];
const AIRDROP_ADDRESS = '0x988a7Bc24A9D0fa49989FB9734bDa30f55760cEb';
const AIRDROP_BASE_URL = 'https://airdrop-api.forta.network';

function loadContract(signer) {
    const address = AIRDROP_ADDRESS;
    if (!address) {
        throw new Error('Airdrop address not configured')
    }
    return new ethers.Contract(address, AIRDROP_ABI, signer);
}


async function handler(event) {
    // Initialize Relayer provider and signer, and forwarder contract
    const credentials = { ... event };
    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, { speed: 'fast' });
    const airdrop = loadContract(signer);
    const relayerAddress = await signer.getAddress();
    console.log(`Getting merkle leaf for ${relayerAddress}`)

    const leafData = await axios.get(`${AIRDROP_BASE_URL}/proof?address=${relayerAddress}`)
    const { index, amount, proof } = leafData.data;
    if (!proof) {
        throw new Error(`${relayerAddress} is not eligible`)
    }
    const claimTx = await airdrop.claim(index, amount, proof);

    return {
        tx: claimTx
    }

}

module.exports = {
    handler
}
