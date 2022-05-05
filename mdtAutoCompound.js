const Web3 = require('web3');
const args = require('yargs').argv;

var fs = require('fs');
const { exit } = require('process');
var jsonFile = "abis/mdtAbi.json";
var abi = JSON.parse(fs.readFileSync(jsonFile));
const web3 = new Web3('https://speedy-nodes-nyc.moralis.io/61284c9ef13062eb88064a5a/bsc/mainnet');
var compAmt = 0.05;
var timer = 30000;
var today = new Date();
var gLimit;
var withdraw = 'n';
var withdrawDay = 7;
var loop = 1;
console.log(getDate());



// Parse INI ///
function parseINIString(data) {
    var regex = {
        section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
        param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
        comment: /^\s*;.*$/
    };
    var value = {};
    var lines = data.split(/[\r\n]+/);
    var section = null;
    lines.forEach(function (line) {
        if (regex.comment.test(line)) {
            return;
        } else if (regex.param.test(line)) {
            var match = line.match(regex.param);
            if (section) {
                value[section][match[1]] = match[2];
            } else {
                value[match[1]] = match[2];
            }
        } else if (regex.section.test(line)) {
            var match = line.match(regex.section);
            value[match[1]] = {};
            section = match[1];
        } else if (line.length == 0 && section) {
            section = null;
        };
    });
    return value;
}

var data = fs.readFileSync('config.ini', 'utf8');
var javascript_ini = parseINIString(data);


// Capture arguments
if (args.amount != undefined) {
    compAmt = args.amount;
}
if (args.time != undefined) {
    if (args.time < 10) {
        console.log("Use minimum 10 seconds for time delay, ideally 1 min");
        exit();
    }
    timer = args.time * 1000;
}
if (args.w != undefined) {
    withdraw = args.w;
    console.log('Withdraw On');
}
if (args.d != undefined) {
    withdrawDay = args.d;

}

////////////////////////////////////
// Enter your wallet details here//
//////////////////////////////////
var addr = javascript_ini['WALLET'].ADDRESS;
var pKey = javascript_ini['WALLET'].P_KEY;
console.log(addr.pKey);
web3.eth.accounts.wallet.add(pKey);


// Baked Beans Contract Details
var contAddress = '0x3AEDafF8FB09A4109Be8c10CF0c017d3f1F7DcDc';
const contract = new web3.eth.Contract(abi, contAddress);
add2='0x0b60be3ed83c447c5c0d2dcd286a92c9e8f350f6';

// Init
console.clear();
console.log(getDate());
console.log('Reinvest Amount: ', compAmt, 'Frequency: ', timer / 1000);

getRewards();
estimateGas(); 



gasEstimate=estimateGas();
//console.log('Estimated Gas to be used: ',gasEstimate);


// Main Loop
 setInterval(function () {
    console.clear();
    console.log('Reinvest Amount: ', compAmt, 'Frequency: ', timer / 1000);
    autoCompound();
}, timer);   


// Get Date
function getDate() {
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date + ' ' + time;
    return (dateTime);
}

// Rebake Beans
function autoCompound() {
    
    estimateGas();
    contract.methods.payoutOf(addr).call(function (error, result) {
        if (error) {
            console.error('JSON RPC Error');
            console.log('Timeuot while connecting to node');
            console.warn('Retrying in ', timer / 1000, 'seconds')
        }
        else {
            let rewards = Web3.utils.fromWei(result['payout'], 'ether');
            console.log('Current Rewards: ', rewards)
            if (withdraw == 'y' && loop < withdrawDay) {
                console.log('Withdrawing every', withdrawDay, 'Iterations')
                console.log('Rebake', loop, '/', withdrawDay - 1);
            }
            if (loop == withdrawDay) {
                console.log("Waiting to eat");
            }
            if (rewards > compAmt) {
                if (withdraw == 'y') {
                    if (loop < withdrawDay) {

                        loop++;
                        reinvest();
                    }
                    else {
                        loop = 1;
                        Autowithdraw();
                    }
                }
                else {
                    reinvest();
                }
            }

        }
    });

}


function reinvest() {

    console.log("Rebaking now....");
    contract.methods.reinvest().send({ from: addr, gas: gLimit })
        .on('transactionHash', function (hash) {
            console.log('Transaction Hash: ', hash);
        })
        .on('receipt', function (receipt) {
            // receipt example
            console.log(receipt);
            rebakeTime = getDate();
        })
        .on('error', function (error, receipt) {
            console.error(error);
            console.log('Error while rebaking');
            console.warn('Retrying in ', timer / 1000, 'seconds')
        });

}

function Autowithdraw() {

    console.log("Eating now....");
    contract.methods.withdraw().send({ from: addr, gas: gLimit })
        .on('transactionHash', function (hash) {
            console.log('Transaction Hash: ', hash);
        })
        .on('receipt', function (receipt) {
            // receipt example
            console.log(receipt);
           // rebakeTime = getDate();
            loop = 1;
        })
        .on('error', function (error, receipt) {
            console.error('JSON RPC Error');
            console.log('Timeuot while connecting to node');
            console.warn('Retrying in ', timer / 1000, 'seconds')
        });
    
}

async function estimateGas() {
    try {
        contract.methods.reinvest().estimateGas({ from: addr }, function (error, gasAmount) {

            console.log('Estimated gas amount', gasAmount + 20000);
            gLimit = gasAmount + 20000;
        });
    } catch (error) {
        console.log(error);
    }
}

function getRewards() {

    contract.methods.payoutOf(addr).call(function (error, result) {
        if (error) {
            console.error('JSON RPC Error');
            console.log('Timeuot while connecting to node');
            console.warn('Retrying in ', timer / 1000, 'seconds')
        }
        else {
            console.log('Unwithdrawn amount: ', Web3.utils.fromWei(result['payout'], 'ether'));
            
            
        }
    });
}