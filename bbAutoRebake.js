const Web3 = require('web3');
const args = require('yargs').argv;

var fs = require('fs');
const { exit } = require('process');
var jsonFile = "abis/bbAbi.json";
var abi = JSON.parse(fs.readFileSync(jsonFile));
const web3 = new Web3('https://speedy-nodes-nyc.moralis.io/61284c9ef13062eb88064a5a/bsc/mainnet');
var rebakeAmount = 0.1;
var timer = 30000;
var rewards;
var today = new Date();
var rebakeTime;
var gasEstimate;
var walletDetails;
console.log(getDate());



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
var contAddress = '0xE2D26507981A4dAaaA8040bae1846C14E0Fb56bF';
var refAdd = '0x925fC333497D833478C2947898209454202996b1';
const contract = new web3.eth.Contract(abi, contAddress, {gasPrice: gPrice});
var gPrice = '20000000000';


// Init
console.clear();
console.log(getDate());
console.log('Rebake Amount: ', rebakeAmount,'Frequency: ', timer/1000);
contract.methods.beanRewards(addr).call()
.then(result=>console.log('Current Rewards: ', result/1000000000000000000));
contract.methods.getMyMiners(addr).call()
.then(result=>console.log('Miners: ', result));
//gasEstimate=estimateGas();
//console.log('Estimated Gas to be used: ',gasEstimate);


// Main Loop
setInterval(function(){ 
    console.clear();
    console.log('Rebake Amount: ', rebakeAmount,'Frequency: ', timer/1000);
    rebakeBeans();
}, timer);


// Get Date
function getDate(){
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date+' '+time;
    return(dateTime);
}

// Rebake Beans
function rebakeBeans(){
    contract.methods.beanRewards(addr).call()
    .then(function(result){
        let rewards = result/1000000000000000000;
        console.log('Current Rewards: ', rewards)
        if (rewards>rebakeAmount){
            console.log('Rebaking');

            contract.methods.hatchEggs(refAdd).send({from: addr, gasPrice: gPrice, gas: 60000 })
            .on('transactionHash', function (hash) {
                console.log('Transaction Hash: ', hash);
            })
            .on('receipt', function(receipt){
                // receipt example
                console.log(receipt);
                rebakeTime=getDate();
            })
            .on('error', function (error, receipt) {
            });
        }
        contract.methods.getMyMiners(addr).call()
        .then(result=>console.log('Miners: ', result));
        console.log('Last Rebake Time: ', rebakeTime);
    });
}



function estimateGas(){
    contract.methods.hatchEggs(refAdd).estimateGas({from: addr})
    .then(function(gasAmount){
        return(gasAmount);
    })
    .catch(function(error){
        console.log("Error in estimating gas");
    });
    
}