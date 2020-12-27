// Get Game number from URL
const url = window.location.href;
const sections = url.split("/");
const gameNumber = sections.length > 0 ? sections[sections.length - 1] : 0;
console.log(gameNumber);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createHeaderCell(value) {
    const header = document.createElement("TH");
    header.setAttribute("style", "border: 1px solid black;padding: 3px")
    header.textContent = value;
    return header;
}

function createNormalCell(value) {
    const cell = document.createElement("TD");
    cell.setAttribute("style", "border: 1px solid black; padding: 3px")
    cell.textContent = value;
    return cell;
}

function createRow(valuesArray) {
    const tableRow = document.createElement("TR")
    for(var i = 0; i < valuesArray.length; i++) {
        tableRow.appendChild(createNormalCell(valuesArray[i]));
    }
    return tableRow;
}

function createTable(attack, defend) {
    const table = document.createElement("TABLE");
    table.setAttribute("style", "width:100%; border-collapse: collapse; border: 1px solid black;")
    const tableHeaderRow = document.createElement("TR")
    const headers = ["Name", "Killed", "Lost", "KD", "Killed Attacking", "Lost Attacking", "Attack KD", "Killed Defending", "Lost Defending", "Defense KD"];
    for (var i =0; i < headers.length; i++) {
        tableHeaderRow.appendChild(createHeaderCell(headers[i]));
    }
    table.appendChild(tableHeaderRow);

    var name;
    for(name in attack) {
        const currAttack = attack[name];
        const currDefend = defend[name];
        const totalKilled = currAttack[0] + currDefend[0];
        const totalLost = currAttack[1] + currDefend[1];
        const kd = totalKilled == 0 ? 0 : totalLost == 0 ? Infinity : (totalKilled/totalLost).toFixed(2);
        const attackKd = currAttack[0] == 0 ? 0 : currAttack[1] == 0 ? Infinity : (currAttack[0]/currAttack[1]).toFixed(2);
        const defendKd = currDefend[0] == 0 ? 0 : currDefend[1] == 0 ? Infinity : (currDefend[0]/currDefend[1]).toFixed(2);

        table.appendChild(createRow([name, totalKilled, totalLost, kd, currAttack[0], currAttack[1], attackKd, currDefend[0], currDefend[1], defendKd]));
    }

    return table;
}

async function runGameAnalysis() {
    const gameLogTab = document.getElementById("game-log-tab-link");
    gameLogTab.click();

    await sleep(2000)

    // Try and click on load button. Not always present
    try {
        const loadMoreButton = document.getElementById("load-log");
        loadMoreButton.click();
    } catch (e) {
        console.log("Load more button was not present or error occured. Error:" + e)
    }

    // Wait for log to load
    await sleep(2000);
    var count = 0;
    while(!!document.getElementById("load-log") && count < 20) {
        await sleep(2000);
        count++
    }

    // Initialize maps
    defend = {};
    attack = {};

    const chatElements = document.getElementsByClassName("chat-message-body");
    var element;

    for (element in chatElements) {
        const message = chatElements[element].textContent;
        if(message && message.indexOf("attacked") > -1) {
            // Use regex to get names and troop counts killed/lost

            const killed = parseInt(message.match(/killing\s(\d{1,2})/g)[0].replace("killing", "").trim())
            const lost = parseInt(message.match(/losing\s(\d{1,2})/g)[0].replace("losing", "").trim())

            // Handle capturing names
            // In some maps, names might be in the format of CountryShortName (CountryLongName) (PlayerName)
            // Elif and Else capture edge cases
            const firstNames = message.split("attacked")[0].match(/\(([a-zA-Z0-9]*)\)/g)
            const secondNames = message.split("attacked")[1].match(/\(([a-zA-Z0-9]*)\)/g)
            var first = firstNames.length > 1 ? firstNames[1] : firstNames[0];
            var second = secondNames.length > 1 ? secondNames[1] : secondNames[0];

            // Remore parenthesis from names
            // TODO this can be fixed in the regex
            first = first.replace("(", "").replace(")", "");
            second = second.replace("(", "").replace(")", "");

            // Initialize players in map if they havent been
            // Tuples are defined as (killed, lost)
            if(!attack[first]) {
                attack[first] = [0, 0]
            }
            if (!defend[first]) {
                defend[first] = [0, 0]
            }
            if (!attack[second]) {
                attack[second] = [0, 0]
            }
            if (!defend[second]) {
                defend[second] = [0, 0]
            }

            // Increment counts
            currCount = attack[first];
            currCount[0] = currCount[0] + killed;
            currCount[1] = currCount[1] + lost;

            defendCurrCount = defend[second]
            defendCurrCount[0] = defendCurrCount[0] + lost;
            defendCurrCount[1] = defendCurrCount[1] + killed;
        }
    }

    // Get tab bodies and create new body
    const tabBodies = document.getElementsByClassName("tabs")[1]
    const newBody = document.createElement("DIV");
    newBody.setAttribute("style", "display: none");
    newBody.appendChild(createTable(attack, defend));
    tabBodies.appendChild(newBody);

    // Get tab bar and create new tab
    const tabBar = document.getElementsByClassName("tab-bar")[1].childNodes[1];
    var node = document.createElement("LI");
    var link = document.createElement("A");
    link.classList.add("tab-link");
    link.textContent = "Risk Analysis";
    link.onclick = function () {
        var tabs
        tabBar.get
        for (tab in tabBar.childNodes) {
            currTab = tabBar.childNodes[tab];
            if(currTab.nodeName == "LI") {
                currTab.classList = [];
            }
        }

        for (tab in tabBodies.childNodes) {
            currTab = tabBodies.childNodes[tab];
            if(currTab.nodeName == "DIV") {
                currTab.setAttribute("style", "display: none");
            }
        }

        node.classList = ["active"];
        newBody.setAttribute("style", "display: block");
    }
    node.appendChild(link);
    tabBar.appendChild(node);
}

runGameAnalysis();
