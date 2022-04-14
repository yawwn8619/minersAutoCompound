const Web3 = require('web3');
const args = require('yargs').argv;

var fs = require('fs');
const { exit } = require('process');
var jsonFile = "abis/wizAbi.json";
var abi = JSON.parse(fs.readFileSync(jsonFile));
const web3 = new Web3('https://evm-cronos.crypto.org');
var rebakeAmount = 50;
var timer = 60000;
var rewards;
var today = new Date();
var rebakeTime;
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
web3.eth.accounts.wallet.add(pKey);


// Baked Beans Contract Details
var contAddress = '0x621eFfE756Ea258Db26c9c5c3E2fE5583a469870';
var refAdd = '0x925fC333497D833478C2947898209454202996b1';
const contract = new web3.eth.Contract(abi, contAddress, {gasPrice: gPrice});
var gPrice = '300000000000000';


// Init
console.clear();
console.log(getDate());
console.log('Infuse Amount: ', rebakeAmount,'Frequency: ', timer/1000);
contract.methods.runeRewards(addr).call(function(error, result){
    if (error){
        console.error('JSON RPC Error');
        console.log('Timeuot while connecting to node');
        console.warn('Retrying in ', timer/1000, 'seconds')
    }
    else{
        console.log('Your Rewards: ',result/1000000000000000000);
    }
});


// Main Loop
setInterval(function(){ 
    console.clear();
    console.log('Infuse Amount: ', rebakeAmount,'Frequency: ', timer/1000);
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

    contract.methods.runeRewards(addr).call(function(error, result){
        if (error){
            console.error('JSON RPC Error');
            console.log('Timeuot while getting rewards');
            console.warn('Retrying in ', timer/1000, 'seconds');
            console.log(error);

        }
        else{
            let rewards = result/1000000000000000000;
            console.log('Current Rewards: ', rewards)
                if (rewards>rebakeAmount){
                    console.log('Infusing');
                    contract.methods.infuse(refAdd).send({ from: addr, gas: 100000 })
                    .on('transactionHash', function (hash) {
                        console.log("Transaction Hash: ", hash);
                  })
                    .on('receipt', function(receipt){
                        // receipt example
                        console.log(receipt);
                        rebakeTime=getDate();
                    })
                    .on('error', function (error, receipt) {
                        console.log('Error while infusing');
                        console.log(error);
                    });
                }

        console.log('Last Infuse Time: ', rebakeTime);
        }
    });
}