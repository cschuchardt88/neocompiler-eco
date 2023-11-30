var CONNECTED_WALLET_ID = -1;

//===============================================================
function drawWalletsStatus() {
    var tBodyElements = document.createElement("tbody");
    //table.setAttribute('class', 'table');
    //table.style.width = '20px';

    var tHeadElement = document.createElement('thead');
    var headerRow = document.createElement('tr');
    var headersLabel = document.createElement('th');
    var headersNeoBalance = document.createElement('th');
    var headersGasBalance = document.createElement('th');
    var headersUnclaimed = document.createElement('th');
    var headersAddress = document.createElement('th');

    headersLabel.innerHTML = "<b><center><font size='1'>LABEL</font></b>";
    headerRow.insertCell(-1).appendChild(headersLabel);
    headersAddress.innerHTML = "<b><center><font size='1'>SELECT ADDRESS</font></b>";
    headerRow.insertCell(-1).appendChild(headersAddress);
    headersNeoBalance.innerHTML = "<b><center><font size='1'>NEO</font></b>";
    headerRow.insertCell(-1).appendChild(headersNeoBalance);
    headersGasBalance.innerHTML = "<b><center><font size='1'>GAS</font></b>";
    headerRow.insertCell(-1).appendChild(headersGasBalance);
    headersUnclaimed.innerHTML = "<b><center><font size='1'>UNCLAIMED</font></b>";
    headerRow.insertCell(-1).appendChild(headersUnclaimed);

    tHeadElement.appendChild(headerRow);

    //table.insertCell(-1).appendChild(headerrrrr);
    var numberOfAccounts = ECO_WALLET.length;
    var extraLength = numberOfAccounts - ECO_EXTRA_ACCOUNTS.length;
    for (ka = 0; ka < numberOfAccounts; ka++) {
        if (ECO_WALLET[ka].print == true && !isEncryptedOnly(ka)) {
            var txRow = tBodyElements.insertRow(-1);
            if (ka >= extraLength)
                txRow.classList.add("table-dark");

            //row.insertCell(-1).appendChild(document.createTextNode(i));
            //Insert button that remove rule
            var b = document.createElement('button');
            b.setAttribute('content', 'test content');
            b.setAttribute('class', 'btn btn-danger btn-sm');
            b.setAttribute('value', ka);
            b.onclick = function () {
                removeAccountFromEcoWallet(this.value);
            };
            b.innerHTML = ECO_WALLET[ka].label;
            txRow.insertCell(-1).appendChild(b);

            var addressBase58 = document.createElement('button');
            addressBase58.setAttribute('content', 'test content');
            addressBase58.setAttribute('class', 'btn btn-success btn-sm');
            addressBase58.setAttribute('value', ka);
            addressBase58.setAttribute('id', "btnGetBalanceAddress" + ka);
            addressBase58.onclick = function () {
                changeDefaultWallet(this.value);
            };
            addressBase58.innerHTML = ECO_WALLET[ka].account._address.slice(0, 4) + "..." + ECO_WALLET[ka].account._address.slice(-4);
            txRow.insertCell(-1).appendChild(addressBase58);

            var walletNeo = document.createElement('span');
            walletNeo.setAttribute('id', "walletNEO" + ka);
            walletNeo.setAttribute("class", "badge");
            walletNeo.textContent = "-";
            txRow.insertCell(-1).appendChild(walletNeo);

            var walletGas = document.createElement('span');
            walletGas.setAttribute('id', "walletGAS" + ka);
            walletGas.setAttribute("class", "badge");
            walletGas.textContent = "-";
            txRow.insertCell(-1).appendChild(walletGas);

            var walletUnclaim = document.createElement('span');
            walletUnclaim.setAttribute('id', "walletUnclaim" + ka);
            walletUnclaim.setAttribute("class", "badge");
            walletUnclaim.textContent = "-";
            txRow.insertCell(-1).appendChild(walletUnclaim);
        } //Check print and encrypted status
    } //Finishes loop that draws each relayed transaction

    //Clear previous data
    document.getElementById("tableWalletStatus").innerHTML = "";
    document.getElementById("tableWalletStatus").appendChild(tHeadElement);
    //Append new table
    document.getElementById("tableWalletStatus").appendChild(tBodyElements);
} //Finishe DrawWallets function
//===============================================================

//===============================================================
//================ ADD NEW ADDRESS ==============================
function addWalletFromForm() {
    var type = $("#type_to_register")[0].value;
    var keyToAdd = $("#accountToAddInfo")[0].value;
    var accountToAdd;
    switch (type) {
        case 'publickey':
        case 'address':
        case 'scripthash':
        case 'privatekey':
        case 'wif':
        case 'encryptedkey':
            accountToAdd = new Neon.wallet.Account(keyToAdd);
            break;
        case 'multisig':
            accountToAdd = getAccountFromMultiSigVerification(keyToAdd);
            break;
        default:
            console.error("Account to with not found type.")
    }

    var labelToAdd = keyToAdd = $("#accountLabelToAddInfo")[0].value;
    if (labelToAdd === "")
        labelToAdd = "ImportedWallet_From_" + type;
    if (addToWallet(accountToAdd, labelToAdd))
        drawPopulateAllWalletAccountsInfo();
}

function addContractToWallet(scriptHashToAdd) {
    var accountToAdd;
    if (scriptHashToAdd != '') {
        accountToAdd = new Neon.wallet.Account(scriptHashToAdd);
        labelToAdd = scriptHashToAdd.slice(0, 3) + "..." + scriptHashToAdd.slice(-3)
        if (addToWallet(accountToAdd, labelToAdd))
            drawPopulateAllWalletAccountsInfo();

        $('.nav a[href="#nav-wallet"]').tab('show');
    } else
        console.log("Nothing to add. Scripthash looks to be empty!");
}

//TODO Add support for adding multisig and specialSC
function addToWallet(accountToAdd, labelToAdd, verificationScriptToAdd = "") {

    if (!accountToAdd.isMultiSig) {
        if (!checkIfAccountAlreadyBelongsToEcoWallet(accountToAdd.address))
            return false;
    } else {
        // Checks for multisig
        var vsToAdd = accountToAdd.contract.script;
        if (vsToAdd == '') {
            alert("Verification script is empty for this multisig!");
            return false;
        }

        if (accountToAdd.address != toBase58(getScriptHashFromAVM(vsToAdd))) {
            alert("Error on converting verification script to base58");
            return false;
        }

        if (!checkIfAccountAlreadyBelongsToEcoWallet(addressBase58ToAdd))
            return false;
    }
    // TODO --- CHECK IF IT IS OK WITHOUT OWNERS FOR MULTI SIGNATURES
    addExtraAccountAndUpdateWallet(accountToAdd, labelToAdd, true);
    return true;
}
//===============================================================

function checkIfAccountAlreadyBelongsToEcoWallet(baseValue) {
    var registeredIndex = searchWalletID(baseValue);

    if (registeredIndex != -1) {
        swal({
            title: "Public addressBase58 already registered for ECO_WALLET.",
            text: "Please, delete index " + registeredIndex + " first.",
            icon: "error",
            button: "Ok!",
            timer: 5500,
        });
        return false;
    }
    return true;
}

function addExtraAccountAndUpdateWallet(accToAdd, labelToAdd, print) {
    var newAcc = {
        account: accToAdd,
        label: labelToAdd,
        print: print
    };
    ECO_EXTRA_ACCOUNTS.push(newAcc);
    ECO_WALLET.push(newAcc);
    btnWalletSave();
}
/*
//===============================================================
//============= FUNCTION CALLED WHEN SELECTION BOX CHANGES ======
function changeWalletInfo() {
    var wToChangeIndex = $("#wallet_info")[0].selectedOptions[0].index;

    if (isEncryptedOnly(wToChangeIndex)) {
        $("#dialog").show();
        document.getElementById("walletInfoEncrypted").value = ECO_WALLET[wToChangeIndex].account.encrypted;
        document.getElementById("walletInfoAddressBase58").value = "-";
        document.getElementById("walletInfoScripthash").value = "-";
        document.getElementById("walletInfoPubKey").value = "-";
        document.getElementById("walletInfoWIF").value = "-";
        document.getElementById("walletInfoPrivateKey").value = "-";
        document.getElementById("addressPrintInfo").value = "-";
        document.getElementById("addressVerificationScript").value = "-";
        document.getElementById("addressOwners").value = "-";
    } else {

        document.getElementById("walletInfoAddressBase58").value = ECO_WALLET[wToChangeIndex].account.address;

        if (ECO_WALLET[wToChangeIndex].account._encrypted != null) {
            document.getElementById("walletInfoEncrypted").value = ECO_WALLET[wToChangeIndex].account.encrypted;
        } else {
            $("#dialog").hide();
            document.getElementById("walletInfoEncrypted").value = "-";
        }

        document.getElementById("walletInfoScripthash").value = ECO_WALLET[wToChangeIndex].account.scriptHash;

        if (!ECO_WALLET[wToChangeIndex].account.isMultiSig && ECO_WALLET[wToChangeIndex].account._publicKey != null)
            document.getElementById("walletInfoPubKey").value = ECO_WALLET[wToChangeIndex].account.publicKey;
        else
            document.getElementById("walletInfoPubKey").value = "-";

        if (!ECO_WALLET[wToChangeIndex].account.isMultiSig && ECO_WALLET[wToChangeIndex].account._WIF != null)
            document.getElementById("walletInfoWIF").value = ECO_WALLET[wToChangeIndex].account.WIF;
        else
            document.getElementById("walletInfoWIF").value = "-";

        if (!ECO_WALLET[wToChangeIndex].account.isMultiSig && ECO_WALLET[wToChangeIndex].account._privateKey != null)
            document.getElementById("walletInfoPrivateKey").value = ECO_WALLET[wToChangeIndex].account.privateKey;
        else
            document.getElementById("walletInfoPrivateKey").value = "-";

        document.getElementById("addressPrintInfo").value = ECO_WALLET[wToChangeIndex].print;
        document.getElementById("addressVerificationScript").value = ECO_WALLET[wToChangeIndex].account.contract.script;
        document.getElementById("addressOwners").value = JSON.stringify(ECO_WALLET[wToChangeIndex].owners);
    }
}*/
//===============================================================

//===============================================================
//============= UPDATE ALL KNOWN ADDRESSES ======================
function updateInfoMSOwners() {
    for (ka = 0; ka < ECO_WALLET.length; ++ka)
        if (!isEncryptedOnly(ka))
            if (ECO_WALLET[ka].account.isMultiSig)
                if (ECO_WALLET[ka].owners === '')
                    ECO_WALLET[ka].owners = getAddressBase58FromMultiSig(ECO_WALLET[ka].account.contract.script);
}
//===============================================================


//===============================================================
//============= UPDATE ALL SELECTION BOX THAT SHOWS ADDRESSES ===
function addAllKnownAddressesToSelectionBox(walletSelectionBox) {
    document.getElementById(walletSelectionBox).options.length = 0;
    for (ka = 0; ka < ECO_WALLET.length; ++ka) {
        var keyToAdd;
        if (isEncryptedOnly(ka))
            keyToAdd = ECO_WALLET[ka].account.encrypted;
        else
            keyToAdd = ECO_WALLET[ka].account._address;
        //.slice(0, 4) + "..." + keyToAdd.slice(-4)
        var addressInfoToAdd = ECO_WALLET[ka].label + " - " + keyToAdd;
        var titleToOption = "Click to select wallet " + ECO_WALLET[ka].label;

        addOptionToSelectionBox(addressInfoToAdd, "wallet_" + ka, walletSelectionBox, titleToOption);
    }
    document.getElementById(walletSelectionBox).selectedIndex = 0;
    document.getElementById(walletSelectionBox).onchange();
}
//===============================================================

function populateAllWalletData() {
    for (ka = 0; ka < ECO_WALLET.length; ++ka)
        if (ECO_WALLET[ka].print == true && !isEncryptedOnly(ka)) {
            addressToGet = ECO_WALLET[ka].account.address;
            queryNep17BalancesFromNeoCsharpNodeJsonRPC(addressToGet, ka);
            callUnclaimedFromNeoCli(addressToGet, ka);
        }
}

//===============================================================
function deleteAccount(idToRemove) {
    ECO_WALLET.splice(idToRemove, 1);
    drawPopulateAllWalletAccountsInfo();
}

function removeAccountFromEcoWallet(idToRemove) {
    if (idToRemove < ECO_WALLET.length && idToRemove > -1) {
        swal({
            title: "Delete " + ECO_WALLET[idToRemove].label + "?",
            text: " Address " + ECO_WALLET[idToRemove].account.address + " will be removed.",
            type: "warning",
            buttons: ["Cancel", "Delete it!"],
            dangerMode: true,
        }).then((willDelete) => {
            if (willDelete) {
                deleteAccount(idToRemove);
                swal("Address has been deleted!", {
                    icon: "success",
                });
            } else {
                swal("Safe! Account " + ECO_WALLET[idToRemove].label + " was not deleted.");
            }
        });
    } else {
        alert("Cannot remove TX with ID " + idToRemove + " from set of known addresses with size " + ECO_WALLET.length)
    }
}
//===============================================================


function getAddressBase58FromMultiSig(verificationScript) {
    jssonArrayWithAddr = [];
    var jssonArrayWithPubKey = getPubKeysFromMultiSig(verificationScript);
    for (a = 0; a < jssonArrayWithPubKey.length; a++)
        jssonArrayWithAddr.push(new Neon.wallet.Account(jssonArrayWithPubKey[a].pubKey));
    return jssonArrayWithAddr;
}

function getAccountFromMultiSigVerification(verificationScript) {
    var jssonArrayWithAddr = getAddressBase58FromMultiSig(verificationScript);
    var rawPubKeysForNeonJS = [];

    // Create publicKeys: string[]
    for (var a = 0; a < jssonArrayWithAddr.length; a++)
        rawPubKeysForNeonJS.push(jssonArrayWithAddr[a].publicKey);

    var nRequiredSignatures = getNRequiredSignatures(verificationScript);
    return Neon.wallet.Account.createMultiSig(Number(nRequiredSignatures), rawPubKeysForNeonJS);
}

function generateRandomAccounts(nAccounts) {
    var randomAccounts = [];

    for (var o = 0; o < nAccounts; o++)
        randomAccounts.push(new Neon.wallet.Account(Neon.wallet.generatePrivateKey()));

    return randomAccounts;
}

function generateMultiSigFromAccounts(threshold, accounts) {
    var pubKeys = [];

    for (var o = 0; o < accounts.length; o++)
        pubKeys.push(accounts[o].publicKey)

    return Neon.wallet.Account.createMultiSig(threshold, pubKeys);
}

function createWallet(walletName, accounts) {
    return Neon.default.create.wallet({ name: walletName, accounts: accounts });
}

function createRandomWalletsForValidators(nAccounts, threshold) {
    var randomAccount = generateRandomAccounts(nAccounts);
    randomAccount.push(generateMultiSigFromAccounts(threshold, randomAccount));
    var randomWallets = [];

    for (var o = 0; o < (randomAccount.length - 1); o++) {
        var tempAccounts = [];
        tempAccounts.push(randomAccount[0]);
        tempAccounts.push(randomAccount[randomAccount.length - 1]);
        randomWallets.push(createWallet("wallet" + o, tempAccounts));
    }


    for (var w = 0; w < randomWallets.length; w++) {
        randomWallets[w].accounts[0].encrypt(w);
    }

    return randomWallets;
}

function fillSpanTextOrInputBox(boxToFill, contentToFill, amountUnclaimable = -1) {
    if (boxToFill != "") {
        if (boxToFill != "#createtx_NEO" && boxToFill != "#createtx_GAS") {
            $(boxToFill)[0].innerHTML = contentToFill;
            if (amountUnclaimable != -1)
                $(boxToFill).val(amountUnclaimable);
        } else {
            $(boxToFill).val(contentToFill);
        }
    }
}

function addAssetsToTransfer(valueToOption) {
    var option = document.createElement("option");
    option.text = valueToOption;
    option.value = valueToOption;
    $("#nep17_asset")[0].appendChild(option);
}

function updateTransferAssetInfo() {
    var selectedAsset = $("#nep17_asset")[0].value;
    $("#labelForTransferAsset")[0].textContent = selectedAsset;
    $("#transfer_nep17_amount")[0].value = 0;
    $("#transfer_nep17_amount_range")[0].value = 0;
    updateTransferAmountInfo();
}

function getIdOfNep17AssetFromBalances(assetToFind) {
    var nep17BalancesOfConnectedWallet = ECO_WALLET[CONNECTED_WALLET_ID].nep17balances;

    for (i = 0; i < nep17BalancesOfConnectedWallet.length; ++i)
        if (nep17BalancesOfConnectedWallet[i].symbol == assetToFind)
            return i;

    return -1;
}

function getAdjustNep17Balance(assetToFind) {
    var assetIdFromBalances = getIdOfNep17AssetFromBalances(assetToFind);
    if (assetIdFromBalances == -1) {
        swal({
            title: "Error when getting nep17 balance",
            icon: "error",
            button: "Ok!",
            timer: 5500,
        });
        console.log("Error updateTransferAmountInfoFromPercentage");
        return;
    }

    var assetDecimals = ECO_WALLET[CONNECTED_WALLET_ID].nep17balances[assetIdFromBalances].decimals;
    var rawBalance = ECO_WALLET[CONNECTED_WALLET_ID].nep17balances[assetIdFromBalances].amount;
    return rawBalance / Math.pow(10, assetDecimals);
}

function updateTransferAmountInfoFromPercentage() {
    if (!checkIfWalletIsConnected())
        return false;
    var nep17AssetName = $("#nep17_asset")[0].value;
    var availableAmountForThisNEP17asset = getAdjustNep17Balance(nep17AssetName);

    var percentage = $("#transfer_nep17_amount_range")[0].value / 100;
    $("#transfer_nep17_amount")[0].value = percentage * availableAmountForThisNEP17asset;

    var assetIdFromBalances = getIdOfNep17AssetFromBalances(nep17AssetName);
    var assetDecimals = ECO_WALLET[CONNECTED_WALLET_ID].nep17balances[assetIdFromBalances].decimals;
    var amount = parseFloat($("#transfer_nep17_amount")[0].value);
    $("#transfer_nep17_amount")[0].value = amount.toFixed(assetDecimals)
    updateTransferAmountInfo();
    //$("#wallet" + $("#nep17_asset")[0].value + CONNECTED_WALLET_ID)[0].style = "border: 1px solid #0aac7c"
    /*@keyframes pulse {
        0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
        }
    
        70% {
            transform: scale(1);
            box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
        }
    
        100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
        }
    }*/
}

function updateTransferAmountInfo() {
    var currentAmount = $("#transfer_nep17_amount")[0].value;
    $("#labelForTransferAmount")[0].textContent = "Transferring " + currentAmount;
    $("#transfer_nep17_amount")[0].style = "color: white!important;";

    var nep17AssetName = $("#nep17_asset")[0].value;
    var availableAmountForThisNEP17asset = getAdjustNep17Balance(nep17AssetName);

    if (parseFloat(currentAmount) > parseFloat(availableAmountForThisNEP17asset))
        $("#transfer_nep17_amount")[0].style = "color: #ff0000!important;"
}

function updateTransferLabel() {
    $("#labelForTransferFrom")[0].textContent = " from " + ECO_WALLET[CONNECTED_WALLET_ID].label;
    // Updating with all know NEP 17 options
    $("#nep17_asset")[0].length = 0;

    var nep17BalancesOfConnectedWallet = ECO_WALLET[CONNECTED_WALLET_ID].nep17balances;
    if (nep17BalancesOfConnectedWallet.length > 0) {
        $('#transferNep17ModuleCollapse').collapse('show');
        for (i = 0; i < nep17BalancesOfConnectedWallet.length; ++i)
            addAssetsToTransfer(nep17BalancesOfConnectedWallet[i].symbol);

        // Update label
        updateTransferAssetInfo();

        if (isWatchOnlyAndNotDapi(CONNECTED_WALLET_ID)) {
            $("#createTransferButton")[0].disabled = true;
        } else {
            $("#createTransferButton")[0].disabled = false;
        }

    } else {
        $('#transferNep17ModuleCollapse').collapse('hide');
    }
}


function fillTransferToLabel() {
    var addrToIndex = $("#createtx_to")[0].selectedOptions[0].index;
    $("#labelForTransferTo")[0].textContent = "To " + ECO_WALLET[addrToIndex].label;
}

function selfTransfer(idToTransfer) {
    if (idToTransfer < ECO_WALLET.length && idToTransfer > -1) {
        // Perform Self Transfer of NEO and GAS will be claimed
    } else {
        swal({
            title: "Cannot self-transfer anything from " + idToTransfer + " from set of known addresses with size " + ECO_WALLET.length,
            icon: "error",
            button: "Ok!",
            timer: 5500,
        });
    }
}

function drawPopulateAllWalletAccountsInfo() {
    drawWalletsStatus();
    populateAllWalletData();
    addAllKnownAddressesToSelectionBox("createtx_to");
}

function connectWallet() {
    goToTabAndClick("nav-wallet");

    var walletToSelectByDefault = 0;
    if (CONNECTED_WALLET_ID != -1)
        walletToSelectByDefault = CONNECTED_WALLET_ID;
    changeDefaultWallet(walletToSelectByDefault, true, true);
}

function changeDefaultWallet(walletID, skipSwal = false, tryDapi = false) {
    CONNECTED_WALLET_ID = walletID;
    $("#button-connect-wallet")[0].textContent = ECO_WALLET[CONNECTED_WALLET_ID].account.address.slice(0, 4) + "..." + ECO_WALLET[CONNECTED_WALLET_ID].account.address.slice(-4);
    updateTransferLabel();

    var isWatchOnly = false;
    if (ECO_WALLET[CONNECTED_WALLET_ID].account._privateKey === undefined && !isMultiSig(CONNECTED_WALLET_ID))
        isWatchOnly = true;

    var dapiWalletConnected = getDapiConnectedWallet() == CONNECTED_WALLET_ID;

    if (ECO_WALLET[CONNECTED_WALLET_ID]) {
        if (!skipSwal) {
            var swalText = "Wallet changed to " + ECO_WALLET[CONNECTED_WALLET_ID].label;
            if (isWatchOnly && !dapiWalletConnected)
                swalText += "!!! - BE CAREFUL - WATCH ONLY";
            else if (dapiWalletConnected)
                swalText += "!!! - BE CAREFUL - YOU ARE CONNECTING TO YOUR PROVIDER";
            swal({
                title: swalText,
                text: "Current selected address is " + ECO_WALLET[CONNECTED_WALLET_ID].account.address + " - " + ECO_WALLET[CONNECTED_WALLET_ID].account.scriptHash,
                icon: "success",
                timer: 5500,
            });
        }

        if (isWatchOnly) {
            $("#relay_btn")[0].disabled = true;

            // but check if it is dapi from neoline or o3
            if (dapiWalletConnected)
                $("#relay_btn")[0].disabled = false;
        } else {
            $("#relay_btn")[0].disabled = false;
        }
    }

    if (tryDapi) {
        if (dapiWalletConnected) {
            swal({
                title: "Already connected to a dAPI wallet",
                text: "Do you want to change wallet provider?",
                icon: "warning",
                buttons: ["Yes", "No. Keep connected!"],
                dangerMode: true,
            }).then((willchange) => {
                if (!willchange) {
                    askToConnectToDapi();
                    $("#relay_btn")[0].disabled = false;
                } else {
                    swal("Default has been kept!");
                }
            });
        } else {
            askToConnectToDapi();
            $("#relay_btn")[0].disabled = false;
        }
    }
}


function createButton(text, cb) {
    return $('<button>' + text + '</button>').on('click', cb);
}

function askToConnectToDapi() {
    var dapiToPush = { cancel: "No" };
    if (neolineN3 && READY_DAPI_WALLETS.NEOLINE)
        Object.assign(dapiToPush, { nl: "NeoLine" });
    if (neo3Dapi && READY_DAPI_WALLETS.O3WALLET)
        Object.assign(dapiToPush, { o3: "O3 Wallet" });

    swal({
        title: "Want to try to Connect a DAPI?",
        text: "NeoLine or O3 may appear (if available)",
        icon: "warning",
        buttons: dapiToPush,
        dangerMode: true,
    }).then((buttonOption) => {
        //console.log("Button is: " + buttonOption);
        switch (buttonOption) {
            case "nl":
                CONNECTED_DAPI_WALLET_OBJ = neolineN3;
                CONNECTED_DAPI_WALLET = "NeoLine";
                getAccountDAPI(CONNECTED_DAPI_WALLET_OBJ);
                break;
            case "o3":
                CONNECTED_DAPI_WALLET_OBJ = neo3Dapi;
                CONNECTED_DAPI_WALLET = "O3Wallet";
                getAccountDAPI(CONNECTED_DAPI_WALLET_OBJ);
                break;
            default:
                swal("Default has been kept!");
        }
    });
}

function checkIfWalletIsConnected() {
    if (CONNECTED_WALLET_ID == -1) {
        swal("Connect a wallet and select an account first.", {
            icon: "error",
            buttons: false,
            timer: 5500,
        });
        // Blink Wallet button for some couple of time
        addBlinkToElement("#button-connect-wallet");
        return false;
    }
    return true;
}

function createNep17Tx() {
    if (!checkIfWalletIsConnected())
        return false;

    var rawAmountToTransfer = $("#transfer_nep17_amount")[0].value;

    var amountToTransferAdjusted = rawAmountToTransfer;
    if ($("#nep17_asset")[0].value == "GAS")
        amountToTransferAdjusted = getFixed8Integer(rawAmountToTransfer);

    if ($("#transfer_nep17_amount")[0].value == 0) {
        swal("Transfer amount is currently 0", {
            icon: "error",
            buttons: false,
            timer: 5500,
        });
        return false;
    }

    swal({
        title: "Transfer from " + ECO_WALLET[CONNECTED_WALLET_ID].label,
        text: rawAmountToTransfer + " " + $("#labelForTransferAsset")[0].textContent + " " + $("#labelForTransferTo")[0].textContent,
        icon: "info",
        buttons: ["Cancel", "Proceed",],
    }).then((willTransfer) => {
        if (willTransfer) {

            var addrToIndex = $("#createtx_to")[0].selectedOptions[0].index;

            var params = [{
                type: "Hash160",
                value: ECO_WALLET[CONNECTED_WALLET_ID].account.scriptHash
            },
            {
                type: "Hash160",
                value: ECO_WALLET[addrToIndex].account.scriptHash
            },
            {
                type: "Integer",
                value: amountToTransferAdjusted
            },
            {
                type: "Integer",
                value: 1
            },
            ];

            var contractHash = getNep17HashByName($("#labelForTransferAsset")[0].textContent);
            var method = "transfer";

            var autoRelay = false;
            invokeFunctionWithParams(contractHash, method, params, autoRelay);

            swal({
                icon: "success",
                title: "Transfer has been created!",
                text: "If you want to proceed to Blockchain you must Relay it.",
                timer: 5500,
            });

            addBlinkToElement("#relay_btn");
        } else {
            //swal("Ok! Cancelled.");
        }
    });
}
