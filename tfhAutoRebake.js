const Web3 = require('web3');
const args = require('yargs').argv;

var fs = require('fs');
const { exit } = require('process');
var jsonFile = "abis/tfhAbi.json";
var abi = JSON.parse(fs.readFileSync(jsonFile));
const web3 = new Web3('https://polygon-rpc.com/');
var rebakeAmount = 10;
var timer = 30000;
var today = new Date();
var rebakeTime;
console.log(getDate());
var gPrice;
var gLimit;



// Parse INI ///
function parseINIString(data){
    var regex = {
        section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
        param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
        comment: /^\s*;.*$/
    };
    var value = {};
    var lines = data.split(/[\r\n]+/);
    var section = null;
    lines.forEach(function(line){
        if(regex.comment.test(line)){
            return;
        }else if(regex.param.test(line)){
            var match = line.match(regex.param);
            if(section){
                value[section][match[1]] = match[2];
            }else{
                value[match[1]] = match[2];
            }
        }else if(regex.section.test(line)){
            var match = line.match(regex.section);
            value[match[1]] = {};
            section = match[1];
        }else if(line.length == 0 && section){
            section = null;
        };
    });
    return value;
}

var data = fs.readFileSync('config.ini', 'utf8');
var javascript_ini = parseINIString(data);

gPrice= javascript_ini['MATIC'].GAS_P;
gLimit= javascript_ini['MATIC'].GAS_L;


// Capture arguments
if (args.amount!= undefined){
    rebakeAmount=args.amount;
}
if (args.time!= undefined){
    if (args.time< 10){
        console.log("Use minimum 10 seconds for time delay, ideally 1 min");
        exit();
    }
    timer=args.time*1000;
}

////////////////////////////////////
// Enter your wallet details here//
//////////////////////////////////
var addr = javascript_ini['WALLET'].ADDRESS;
var pKey = javascript_ini['WALLET'].P_KEY;
console.log(addr. pKey);
web3.eth.accounts.wallet.add(pKey);


// Baked Beans Contract Details
var contAddress = '0x5AB47Dd39264a5D076566FC01A1612a1a982654e';
var refAdd = '0x925fC333497D833478C2947898209454202996b1';
const contract = new web3.eth.Contract(abi, contAddress);



// Init
console.clear();
console.log(getDate());
console.log('Rebake Amount: ', rebakeAmount,'Frequency: ', timer/1000);
contract.methods.seedRewards(addr).call(function(error, result){
    if (error){
        console.error('JSON RPC Error');
        console.log('Timeuot while getting rewards');
        console.warn('Retrying in ', timer/1000, 'seconds')
        console.log(error);
    }
    else{
        console.log('Your Rewards: ',result/1000000000000000000);
    }
});

 contract.methods.getMyMiners(addr).call(function(error, result){
    if (error){
        console.error('JSON RPC Error');
        console.log('Timeuot while connecting to node');
        console.warn('Retrying in ', timer/1000, 'seconds')
    }
    else{
        console.log('Your Miners: ', result);
    }
});
//gasEstimate=estimateGas();
//console.log('Estimated Gas to be used: ',gasEstimate);


// Main Loop
setInterval(function(){ 
    console.clear();
    console.log('Rebake Amount: ', rebakeAmount,'Frequency: ', timer/1000);
    autoBake();
}, timer);


// Get Date
function getDate(){
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date+' '+time;
    return(dateTime);
}

// Rebake Beans
function autoBake() {
    console.log('Last Rebake Time: ', rebakeTime);
    estimateGas();
    contract.methods.seedRewards(addr).call(function (error, result) {
        if (error) {
            console.error('JSON RPC Error');
            console.log('Timeuot while connecting to node');
            console.warn('Retrying in ', timer / 1000, 'seconds')
        }
        else {
            let rewards = result / 1000000000000000000;
            console.log('Current Rewards: ', rewards)
            if (withdraw == 'y' && loop < withdrawDay) {
                console.log('Withdrawing every', withdrawDay, 'Iterations')
                console.log('Rehiring', loop, '/', withdrawDay - 1);
            }
            if (loop == withdrawDay) {
                console.log("Waiting to sell");
            }
            if (rewards > rebakeAmount) {
                if (withdraw == 'y') {
                    if (loop < withdrawDay) {

                        loop++;
                        rebake();
                    }
                    else {
                        loop = 1;
                        eat();
                    }
                }
                else {
                    rebake();
                }
            }

        }
    });


    contract.methods.getMyMiners(addr).call(function (error, result) {
        if (error) {
            console.error('JSON RPC Error');
            console.log('Timeuot while connecting to node');
            console.warn('Retrying in ', timer / 1000, 'seconds')
        }
        else {
            console.log('Your Miners: ', result);
        }
    });
}



async function estimateGas() {
    try {
        contract.methods.replantSeeds(refAdd).estimateGas({ from: addr }, function (error, gasAmount) {

            console.log('Estimated gas amount', gasAmount + 20000);
            gLimit = gasAmount + 20000;
        });
    } catch (error) {
        console.log(error);
    }
}

function eat() {

    console.log("Selling now....");
    contract.methods.harvestSeeds().send({ from: addr, gas: gLimit })
        .on('transactionHash', function (hash) {
            console.log('Transaction Hash: ', hash);
        })
        .on('receipt', function (receipt) {
            // receipt example
            console.log(receipt);
            rebakeTime = getDate();
        })
        .on('error', function (error, receipt) {
            console.error('JSON RPC Error');
            console.log('Timeuot while connecting to node');
            console.warn('Retrying in ', timer / 1000, 'seconds')
        });
    loop = 1;
}


function rebake() {

    console.log("Building now....");
    contract.methods.replantSeeds(refAdd).send({ from: addr, gas: gLimit })
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
