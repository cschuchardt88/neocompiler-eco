function addLocalPrivateNet(){
  const config = {
    name: 'LocalPrivateNet',
    extra: {
      neoscan: FIXED_NEOSCAN_LOCALHOST + "/api/main_net"
    }
  }
  const localprivateNet = new Neon.rpc.Network(config)
  Neon.default.add.network(localprivateNet)
  console.log(Neon.settings.networks['LocalPrivateNet'])
}

function addSharedPrivateNet(){
  const config = {
    name: 'SharedPrivateNet',
    extra: {
      neoscan: FIXED_NEOSCAN_NEOCOMPILER + "/api/main_net"
    }
  }
  const sharedprivateNet = new Neon.rpc.Network(config)
  Neon.default.add.network(sharedprivateNet)
  console.log(Neon.settings.networks['SharedPrivateNet'])
}


function CreateTx( from, fromPrivateKey, to, neo, gas, nodeToCall, networkToCall, sendingFromSCFlag = false){
    //balance = Neon.api.neoscan.getBalance('PrivateNet', from).then(res => console.log(res))
    var intent;
    if(neo > 0 && gas > 0)
        intent = Neon.api.makeIntent({NEO:neo,GAS:gas}, to)

    if(neo == 0 && gas > 0)
        intent = Neon.api.makeIntent({GAS:gas}, to)

    if(neo > 0 && gas == 0)
        intent = Neon.api.makeIntent({NEO:neo}, to)


    //console.log(intent) // This is an array of 2 Intent objects, one for each asset
    const config = {
        net: networkToCall, // The network to perform the action, MainNet or TestNet.
        url: nodeToCall,
        address: from,  // This is the address which the assets come from.
	sendingFromSmartContract: sendingFromSCFlag,
        privateKey: fromPrivateKey,
        intents: intent
    }

    Neon.default.sendAsset(config)
    .then(res => {
        //console.log("network:"+networkToCall);
        console.log(res.response)
    })
    .catch(e => {
        console.log(e)
    })
}

//Private key or signing Function
function CreateClaimGasTX( from, fromPrivateKey, nodeToCall, networkToCall){
    const config = {
        net: networkToCall, // The network to perform the action, MainNet or TestNet.
        url: nodeToCall,
        address: from,  // This is the address which the assets come from.
        privateKey: fromPrivateKey,
    }

    Neon.default.claimGas(config)
    .then(res => {
        //console.log("network:"+networkToCall);
        console.log(res.response)
    })
    .catch(e => {
        console.log(e)
    })
}


//Example of invoke
//Invoke(KNOWN_ADDRESSES[0].publicKey,KNOWN_ADDRESSES[0].privateKey,3,1,1, "24f232ce7c5ff91b9b9384e32f4fd5038742952f", "", BASE_PATH_CLI, getCurrentNetworkNickname())

function Invoke(myaddress, myprivatekey, mygasfee, neo, gas, contract_scripthash, contract_operation, nodeToCall, networkToCall){

  var intent;
  if(neo > 0 && gas > 0)
  	intent = Neon.api.makeIntent({NEO:neo,GAS:gas}, to)

  if(neo == 0 && gas > 0)
  	intent = Neon.api.makeIntent({GAS:gas}, to)

  if(neo > 0 && gas == 0)
  	intent = Neon.api.makeIntent({NEO:neo}, to)
  

  const config = {
    net: networkToCall,
    url: nodeToCall,
    script: Neon.default.create.script({
      scriptHash: contract_scripthash,
      operation: contract_operation,
      args: []
    }),
    intents: intent,
    address: myaddress, //'AK2nJJpJr6o664CWJKi1QRXjqeic2zRp8y',//'ARCvt1d5qAGzcHqJCWA2MxvhTLQDb9dvjQ',
    privateKey: myprivatekey, //'1dd37fba80fec4e6a6f13fd708d8dcb3b29def768017052f6c930fa1c5d90bbb',//'4f0d41eda93941d106d4a26cc90b4b4fddc0e03b396ac94eb439c5d9e0cd6548',
    gas: mygasfee //0
  }

  Neon.default.doInvoke(config).then(res => {
    console.log(res);
    console.log(res.response);

    createNotification("Invoke","Response: " + res.response.result + " of " + contract_scripthash, 2000);

    if(res.response.result)
    	updateVecRelayedTXsAndDraw(res.response.txid,"Invoke of " + contract_scripthash + " Params: TODO ");

  }).catch(err => { 
     //alert(err);
     console.log(err);
     createNotification("Invoke ERR","Response: " + err, 2000);
  });

}


//Example of Deploy checkwitness
//Deploy(KNOWN_ADDRESSES[0].publicKey,KNOWN_ADDRESSES[0].privateKey,90,BASE_PATH_CLI, getCurrentNetworkNickname(),script,false,01,'')
//Deploy(KNOWN_ADDRESSES[0].publicKey,KNOWN_ADDRESSES[0].privateKey,500,BASE_PATH_CLI, getCurrentNetworkNickname(),'00c56b611423ba2703c53263e8d6e522dc32203339dcd8eee96168184e656f2e52756e74696d652e436865636b5769746e65737364320051c576000f4f574e45522069732063616c6c6572c46168124e656f2e52756e74696d652e4e6f7469667951616c756600616c7566',false,01,'')
function Deploy(myaddress, myprivatekey, mygasfee, nodeToCall, networkToCall,contract_script, storage, returntype, par = undefined){
  const sb = Neon.default.create.scriptBuilder();
    sb.emitPush(Neon.u.str2hexstring(''))
      .emitPush(Neon.u.str2hexstring(''))
      .emitPush(Neon.u.str2hexstring(''))
      .emitPush(Neon.u.str2hexstring(''))
      .emitPush(Neon.u.str2hexstring(''))
      .emitPush(storage)//storage
      .emitPush(returntype)//return type
      .emitPush(par)//par
      .emitPush(contract_script)//script
      .emitSysCall('Neo.Contract.Create');

    const config = {
      net: networkToCall,
      url: nodeToCall,
      script: sb.str,
      address: myaddress, //'AK2nJJpJr6o664CWJKi1QRXjqeic2zRp8y',//'ARCvt1d5qAGzcHqJCWA2MxvhTLQDb9dvjQ',
      privateKey: myprivatekey, //'1dd37fba80fec4e6a6f13fd708d8dcb3b29def768017052f6c930fa1c5d90bbb',//'4f0d41eda93941d106d4a26cc90b4b4fddc0e03b396ac94eb439c5d9e0cd6548',
      gas: mygasfee //0
    }

    Neon.default.doInvoke(config).then(res => {
      	console.log(res);
	//alert("Deploy TX status: " + res.response.result)

	createNotification("Deploy","Response: " + res.response.result, 2000);

	if(res.response.result)
		updateVecRelayedTXsAndDraw(res.response.txid, "Deploy");
    }).catch(err => { 
     	//alert(err);
     	console.log(err);
	createNotification("Deploy ERR","Response: " + err, 2000);
  });
}

function createNotification(notifyTitle, notifyBody, notifyTime)
{
          if (Notification.permission !== "granted")
          {
            Notification.requestPermission();
          }
          else {
           var notification = new Notification(notifyTitle, {
             icon: 'http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png',
             body: notifyBody,
           });
          }

    	//var notificationInvoke = new Notification(notifyTitle, {body:notifyBody});
    	//setTimeout(function() {notificationInvoke.close()}, notifyTime);
}


function updateVecRelayedTXsAndDraw(relayedTXID, personalNote)
{
	   vecRelayedTXs.push({tx:relayedTXID, note:personalNote});
           drawRelayedTXs();
}

function getStorage( scripthashContext, key, url )
{
  query = Neon.rpc.Query.getStorage( scripthashContext, key );
  response = query.execute(url);
  console.log(response);
  return response;
}


/*
function CreateRawTx( rawData ){
  // just for test
  //query = Neon.rpc.Query.sendRawTransaction(rawData);
  query = Neon.rpc.Query.sendRawTransaction('800000014BFA9098EC9C5B95E4EC3045A2A2D04A10F12228A3267A3AC65265428ABDC1D3010002E72D286979EE6CB1B7E65DFDDFB2E384100B8D148E7758DE42E4168B71792C6000E1F505000000004E75C523C4D431DAFED515E5E230F11A4DB5A80FE72D286979EE6CB1B7E65DFDDFB2E384100B8D148E7758DE42E4168B71792C6000EF54A91C000000 513FF03F3A5648BE47CC82F6571251F57173CF8601060004303231347755C56B6C766B00527AC46C766B51527AC4616168164E656F2E52756E74696D652E47657454726967676572009C6C766B52527AC46C766B52C3642A00616C766B00C30430323134876C766B53527AC46C766B53C3640E00516C766B54527AC4620F0061006C766B54527AC46203006C766B54C3616C7566');
  response = query.execute(BASE_PATH_CLI);
  console.log(response);
}
*/

// =============================================
//First examples of using Neon-JS in connection with neo-scan for broadcasting to private net RPC clients
function neonJSPlayground(){
  var NeonA = Neon.default
  const query = Neon.default.create.query()
  var wallet = Neon.wallet
  console.log("query: " + query)
  console.log("wallet: " + wallet)
  var tx = Neon.tx
  console.log("tx: " + tx)
  let tx2 = Neon.default.create.tx({type: 128})
  console.log("tx2: " + tx2)

  balance = Neon.api.neoscan.getBalance('PrivateNet', "AK2nJJpJr6o664CWJKi1QRXjqeic2zRp8y")
  .then(res => console.log(res))


  const intent = Neon.api.makeIntent({NEO:1,GAS:1000}, 'AK2nJJpJr6o664CWJKi1QRXjqeic2zRp8y')
  console.log(intent) // This is an array of 2 Intent objects, one for each asset
  const configTest = {
    net: 'PrivateNet', // The network to perform the action, MainNet or TestNet.
    url: BASE_PATH_CLI,
    address: 'AK2nJJpJr6o664CWJKi1QRXjqeic2zRp8y',  // This is the address which the assets come from.
    privateKey: 'KxDgvEKzgSBPPfuVfw67oPQBSjidEiqTHURKSDL1R7yGaGYAeYnr',
    intents: intent
  }

  Neon.default.sendAsset(configTest)
  .then(res => {
    console.log(res.response)
  })
  .catch(e => {
    console.log(e)
  })

  const sb = Neon.default.create.scriptBuilder()

  //sb.emitAppCall('35816a2b6f823a28aa6674ca56c28862fe419f8', 'name')
  //const tx3 = Neon.default.create.invocationTx('KxDgvEKzgSBPPfuVfw67oPQBSjidEiqTHURKSDL1R7yGaGYAeYnr', {}, {}, sb.str, 0)
}//END First examples of using Neon-JS in connection with neo-scan for broadcasting to private net RPC clients
// =============================================
