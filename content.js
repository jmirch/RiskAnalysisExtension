function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createHeaderCell(value, hoverText) {
    const header = document.createElement("TH");
    const span = document.createElement("SPAN");
    span.title = hoverText;
    span.textContent = value;
    header.appendChild(span)
    header.setAttribute("style", "border: 1px solid black;padding: 3px; word-wrap: normal")
    
    return header;
}

function createNormalCell(value, colors) {
    const cell = document.createElement("TD");
    cell.setAttribute("style", "border: 1px solid black; padding: 3px")
    if(colors[value]) {
        cell.style.color = colors[value];
    }
    cell.textContent = value;
    return cell;
}

function createRow(valuesArray, colors) {
    const tableRow = document.createElement("TR")
    for(var i = 0; i < valuesArray.length; i++) {
        tableRow.appendChild(createNormalCell(valuesArray[i], colors));
    }
    return tableRow;
}

function createTable(attack, defend, colors, troopsGained) {
    const table = document.createElement("TABLE");
    table.setAttribute("style", "width:100%; border-collapse: collapse; border: 1px solid black;")
    const tableHeaderRow = document.createElement("TR")
    const headers = ["Name", "Troops Gained", "Killed", "Lost", "KD", "Killed Attacking", "Lost Attacking", "Attack KD", "Killed Defending", "Lost Defending", "Defense KD"];
    const hoverText = [
        "Player's username",
        "Total number of troops each player has gained from area bonus or card turn ins",
        "Total number of opponent's troops each player has killed",
        "Total number of troops each player has lost",
        "Kill death ratio = Killed / Lost",
        "Total number of troops each player has killed while attacking an opponent",
        "Total number of troops each player has lost while attacking an opponent",
        "Attack kill death ratio = Killed Attacking / Lost Attacking", 
        "Total number of opponent's troops that have been killed while defending an area",
        "Total number of troops each player has lost while defending an area",
        "Defense kill death ratio = Killed Defending / Lost Defending"
    ];
    for (var i =0; i < headers.length; i++) {
        tableHeaderRow.appendChild(createHeaderCell(headers[i], hoverText[i]));
    }
    table.appendChild(tableHeaderRow);

    var name;
    const names = Object.keys(attack).sort();
    for(index in names) {
        name = names[index];
        const currAttack = attack[name];
        const currDefend = defend[name];
        const totalKilled = currAttack[0] + currDefend[0];
        const totalLost = currAttack[1] + currDefend[1];
        const kd = totalKilled == 0 ? 0 : totalLost == 0 ? Infinity : (totalKilled/totalLost).toFixed(2);
        const attackKd = currAttack[0] == 0 ? 0 : currAttack[1] == 0 ? Infinity : (currAttack[0]/currAttack[1]).toFixed(2);
        const defendKd = currDefend[0] == 0 ? 0 : currDefend[1] == 0 ? Infinity : (currDefend[0]/currDefend[1]).toFixed(2);
        const troopsGainedForPlayer = troopsGained[name] || 0;

        table.appendChild(createRow([name, troopsGainedForPlayer, totalKilled, totalLost, kd, currAttack[0], currAttack[1], attackKd, currDefend[0], currDefend[1], defendKd], colors));
    }

    return table;
}

function runAnalysis(attack, defend, colors, troopsGained) {
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
            const firstNames = message.split("attacked")[0].match(/\(([a-zA-Z0-9_-]*)\)/g)
            const secondNames = message.split("attacked")[1].match(/\(([a-zA-Z0-9_-]*)\)/g)
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
        } else if (message && message.indexOf("received") > 0 && message.indexOf("troop") > 0) {
            const segments = message.trim().split(" ");
            const name = segments[0];
            const troops = parseInt(segments[2]);
            if (!troopsGained[name]) {
                troopsGained[name] = troops
            } else {
                troopsGained[name] = troopsGained[name] + troops;
            }
        }
    }

    const playerLinks = document.getElementsByClassName("player");
    var link;
    for(link in playerLinks) {
        const currLink = playerLinks[link];
        const playerName = currLink.textContent;
        var style; 
        var color;
        try {
            style = window.getComputedStyle(currLink)
            color = style && style.getPropertyValue('color');
        } catch (e) {
            console.log("Error getting color of element: " + e)
        }
        if(!colors[playerName] && color) {
            colors[playerName] = color;
        }
    }
}

async function main() {
    // Get current scroll position
    var scroll = window.pageYOffset

    // Click on Game Log Tab
    var attempts = 0;
    while(attempts < 20) {
        try {
            const gameLogTab = document.getElementById("game-log-tab-link");
            gameLogTab.click();
            break;
        } catch (e) {
            attempts++
            console.log("Game log tab does not exists attempt: " + attempts)
        }
    }
 
    // Try and click on load button. Not always present
    try {
        const loadMoreButton = document.getElementById("load-log");
        loadMoreButton.click();     
    } catch (e) {
        console.log("Load more button was not present or error occured. Error:" + e)
    }
    
    // Return to default tab
    try {
        const teamChatTab = document.getElementById("team-chat-tab-link");
        teamChatTab.click();
    } catch {
        const gameChatTab = document.getElementById("game-chat-tab-link");
        gameChatTab.click();
    }

    // Move to previous scroll position
    window.scrollTo(0 ,scroll)

    // Initialize maps
    var defend = {};
    var attack = {};
    var troopsGained = {}
    var colors = {}

    // Run analysis
    runAnalysis(attack, defend, colors, troopsGained)

    // Get tab bodies and create new body
    const tabBodies = document.getElementsByClassName("tabs")[1]
    const newBody = document.createElement("DIV");
    newBody.setAttribute("style", "display: none");
    
    newBody.appendChild(createTable(attack, defend, colors, troopsGained));
    tabBodies.appendChild(newBody);

    // Get tab bar and create new tab
    const tabBar = document.getElementsByClassName("tab-bar")[1].childNodes[1];
    var node = document.createElement("LI");
    var link = document.createElement("A");
    link.classList.add("tab-link");
    link.textContent = "Risk Analysis";
    link.onclick = function () {
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
        newBody.style = "display: block; overflow-y: scroll; height: 295px;overflow-wrap: break-word";
    }

    // Observe for changes in tabs to ensure the new tab disappears 
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    var observer = new MutationObserver(function(mutations, observer) {
        activeTabs = tabBar.getElementsByClassName("active");
        if(activeTabs.length > 1) {
            node.classList = [];
            newBody.setAttribute("style", "display: none");
        }
    });

    observer.observe(tabBodies, {
      subtree: true,
      attributes: true
    });

    //Observe changes in the game log
    var gameLogObserver = new MutationObserver(function(mutations, observer) {
        newBody.removeChild(newBody.firstChild)
        attack = {};
        defend = {};
        colors = {};
        troopsGained = {};
        runAnalysis(attack, defend, colors, troopsGained)
        console.log("In game log changes")
        newBody.appendChild(createTable(attack, defend, colors, troopsGained));
    });

    const gameLog = document.getElementById("game-log-list");
    gameLogObserver.observe(gameLog, {
        childList: true
    });

    node.appendChild(link);
    tabBar.appendChild(node);
}

main();
