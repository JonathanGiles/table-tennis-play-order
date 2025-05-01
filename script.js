document.addEventListener('DOMContentLoaded', function() {
    // Initialize sortable lists
    const ourTeamList = document.getElementById('our-team-order');
    const opponentTeamList = document.getElementById('opponent-team-order');
    const combinedRankingList = document.getElementById('combined-player-ranking');
    
    // Our team players (pre-populated, dynamic size)
    let ourPlayers = [
        { id: 1, name: 'Henry', skill: 3, team: 'our' },
        { id: 2, name: 'Khang', skill: 2, team: 'our' },
        { id: 3, name: 'Isaiah', skill: 1, team: 'our' }
    ];
    
    // Opponent players (dynamic size, will be populated by user)
    let opponentPlayers = [
        { id: 1, name: 'Player 1', skill: 3, team: 'opponent' },
        { id: 2, name: 'Player 2', skill: 2, team: 'opponent' },
        { id: 3, name: 'Player 3', skill: 1, team: 'opponent' }
    ];

    // Helper: render team list based on array
    function renderTeamList(listEl, players) {
        listEl.innerHTML = '';
        players.forEach(p => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.setAttribute('data-player-id', p.id);
            li.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="drag-handle me-2"><i class="fas fa-grip-lines"></i></div>
                    <div class="player-name flex-grow-1" data-player-id="${p.id}">${p.name}</div>
                </div>`;
            listEl.appendChild(li);
        });
    }

    // Combined players array
    let combinedPlayers = [...ourPlayers, ...opponentPlayers];
    // Initial render of team lists
    renderTeamList(ourTeamList, ourPlayers);
    renderTeamList(opponentTeamList, opponentPlayers);

    // Initialize Sortable for our team list
    new Sortable(ourTeamList, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: updateStrategy
    });

    // Initialize Sortable for opponent team list
    new Sortable(opponentTeamList, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: updateStrategy
    });

    // Initialize the combined ranking list
    initializeCombinedRanking();

    // Initialize Sortable for combined player ranking
    new Sortable(combinedRankingList, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: function() {
            // Automatically apply rankings when players are reordered
            applyCustomRankings();
        }
    });
    
    // Track current team being edited
    let currentEditTeam = null;
    document.querySelectorAll('.edit-team-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentEditTeam = this.getAttribute('data-team');
            // Pre-fill input with current names
            const input = document.getElementById('team-names-input');
            input.value = currentEditTeam === 'our'
                ? ourPlayers.map(p => p.name).join(' ')
                : opponentPlayers.map(p => p.name).join(' ');
        });
    });
    // Handle Save Changes to apply names
    document.getElementById('save-player-btn').addEventListener('click', function() {
        const inputNames = document.getElementById('team-names-input').value
                            .trim().split(/\s+/);
        if (currentEditTeam === 'our') {
            const old = ourPlayers;
            ourPlayers = inputNames.map((name, i) => {
                const prev = old.find(p => p.id === i+1);
                return {
                    id: i+1,
                    name,
                    skill: prev ? prev.skill : old.length - i,
                    team: 'our'
                };
            });
            renderTeamList(ourTeamList, ourPlayers);
        } else {
            const old = opponentPlayers;
            opponentPlayers = inputNames.map((name, i) => {
                const prev = old.find(p => p.id === i+1);
                return {
                    id: i+1,
                    name,
                    skill: prev ? prev.skill : old.length - i,
                    team: 'opponent'
                };
            });
            renderTeamList(opponentTeamList, opponentPlayers);
        }
        // Rebuild combined players and ranking
        combinedPlayers = [...ourPlayers, ...opponentPlayers];
        initializeCombinedRanking();
        updateStrategy();
        // Hide modal
        const modalEl = document.getElementById('editTeamModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
    });
    // Allow Enter key in modal input to apply changes
    document.getElementById('team-names-input').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('save-player-btn').click();
        }
    });

    // Auto-select text when the edit team modal is shown
    const editModalEl = document.getElementById('editTeamModal');
    editModalEl.addEventListener('shown.bs.modal', function() {
        const input = document.getElementById('team-names-input');
        input.focus();
        input.select();
    });

    // Handle inline editing for player names
    document.body.addEventListener('click', function(e) {
        // Handle edit button clicks
        if (e.target.closest('.edit-btn')) {
            e.preventDefault();
            const btn = e.target.closest('.edit-btn');
            const playerId = parseInt(btn.getAttribute('data-player-id'));
            const isOpponent = btn.closest('#opponent-team-order') !== null;
            const team = isOpponent ? 'opponent' : 'our';
            
            // Find the player element
            const playerNameElement = btn.closest('li').querySelector('.player-name');
            const currentName = playerNameElement.textContent;
            
            // Replace with input field for editing
            const inputField = document.createElement('input');
            inputField.type = 'text';
            inputField.className = 'form-control form-control-sm editing-name';
            inputField.value = currentName;
            inputField.setAttribute('data-player-id', playerId);
            inputField.setAttribute('data-team', team);
            
            // Replace the player name with the input field
            playerNameElement.innerHTML = '';
            playerNameElement.appendChild(inputField);
            inputField.focus();
            inputField.select();
            
            // Add event listeners to save on enter or blur
            inputField.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    saveInlineEdit(this);
                } else if (e.key === 'Escape') {
                    cancelInlineEdit(this, currentName);
                }
            });
            
            inputField.addEventListener('blur', function() {
                saveInlineEdit(this);
            });
        }
    });
    
    // Save inline edit
    function saveInlineEdit(inputElement) {
        const newName = inputElement.value.trim();
        if (!newName) return;
        
        const playerId = parseInt(inputElement.getAttribute('data-player-id'));
        const team = inputElement.getAttribute('data-team');
        const playerNameElement = inputElement.closest('.player-name');
        
        // Update player name in the data model
        updatePlayerName(team, playerId, newName);
        
        // Remove input and restore text
        playerNameElement.textContent = newName;
    }
    
    // Cancel inline edit
    function cancelInlineEdit(inputElement, originalName) {
        const playerNameElement = inputElement.closest('.player-name');
        playerNameElement.textContent = originalName;
    }
    
    // Initialize the combined ranking list
    function initializeCombinedRanking() {
        combinedRankingList.innerHTML = '';
        
        // Sort combined players by current skill
        const sortedPlayers = [...combinedPlayers].sort((a, b) => b.skill - a.skill);
        
        // Add players to the list
        sortedPlayers.forEach((player, index) => {
            const listItem = document.createElement('li');
            listItem.className = `list-group-item ${player.team === 'our' ? 'our-player' : 'opponent-player'}`;
            listItem.setAttribute('data-player-id', player.id);
            listItem.setAttribute('data-team', player.team);
            
            // Improved ranking layout with flex alignment
            const handleDiv = document.createElement('div');
            handleDiv.className = 'drag-handle me-2';
            handleDiv.innerHTML = '<i class="fas fa-grip-lines"></i>';
            
            const rankSpan = document.createElement('span');
            rankSpan.className = 'player-rank';
            rankSpan.textContent = index + 1;
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'ms-2 flex-grow-1 player-name';
            nameSpan.textContent = player.name;
            
            // Use the improved team badge
            const teamBadge = document.createElement('span');
            teamBadge.className = player.team === 'our' 
                ? 'badge team-badge-us' 
                : 'badge team-badge-opposition';
            teamBadge.textContent = player.team === 'our' ? 'Us' : 'Opposition';
            
            // Append all elements in the correct order
            listItem.appendChild(handleDiv);
            listItem.appendChild(rankSpan);
            listItem.appendChild(nameSpan);
            listItem.appendChild(teamBadge);
            
            combinedRankingList.appendChild(listItem);
        });
    }

    // Update player name in all lists
    function updatePlayerName(team, id, name) {
        // Update player object
        let player;
        if (team === 'our') {
            player = ourPlayers.find(p => p.id === id);
            if (player) {
                player.name = name;
            }
        } else {
            player = opponentPlayers.find(p => p.id === id);
            if (player) {
                player.name = name;
            }
        }
        
        if (!player) return;
        
        // Update in team list
        const listSelector = team === 'our' ? '#our-team-order' : '#opponent-team-order';
        const playerElement = document.querySelector(`${listSelector} li[data-player-id="${id}"] .player-name`);
        if (playerElement && !playerElement.querySelector('input')) {
            playerElement.textContent = name;
        }
        
        // Update combined players array
        combinedPlayers = [...ourPlayers, ...opponentPlayers];
        
        // Refresh the combined ranking list
        initializeCombinedRanking();
        
        // Update the strategy table
        updateStrategy();
    }

    // Apply custom rankings from the combined ranking list
    function applyCustomRankings() {
        const items = combinedRankingList.querySelectorAll('li');
        
        // Assign skills based on position in the list (highest skill at the top)
        items.forEach((item, index) => {
            const playerId = parseInt(item.getAttribute('data-player-id'));
            const team = item.getAttribute('data-team');
            const skillValue = items.length - index; // Convert position to skill value (higher is better)
            
            if (team === 'our') {
                const player = ourPlayers.find(p => p.id === playerId);
                if (player) {
                    player.skill = skillValue;
                }
            } else {
                const player = opponentPlayers.find(p => p.id === playerId);
                if (player) {
                    player.skill = skillValue;
                }
            }
        });
        
        // Update combined players array
        combinedPlayers = [...ourPlayers, ...opponentPlayers];
        
        // Refresh the combined ranking list to update the numbers
        initializeCombinedRanking();
        
        // Update strategy
        updateStrategy();
    }

    // Get the current order of players from a sortable list
    function getPlayerOrder(listElement) {
        const items = listElement.querySelectorAll('li');
        const order = [];
        
        for (let i = 0; i < items.length; i++) {
            order.push(parseInt(items[i].getAttribute('data-player-id')));
        }
        
        return order;
    }

    // Determine match prediction result (win, loss, or unsure)
    function predictMatch(ourSkill, opponentSkill) {
        // If skills are equal, result is unsure
        if (ourSkill === opponentSkill) {
            return 'unsure';
        }
        return ourSkill > opponentSkill ? 'win' : 'loss';
    }

    // Calculate the match outcomes for a given team order
    function calculateMatchOutcomes(ourPositions, opponentPositions) {
        const matches = defineMatches(ourPositions, opponentPositions);
        let winCount = 0;
        let lossCount = 0;
        let unsureCount = 0;
        
        matches.forEach(match => {
            let prediction;
            
            if (Array.isArray(match.ourPlayerId)) {
                // Doubles match: compare combined skills
                const ourSkill = ourPlayers.find(p => p.id === match.ourPlayerId[0]).skill + 
                                 ourPlayers.find(p => p.id === match.ourPlayerId[1]).skill;
                const opponentSkill = opponentPlayers.find(p => p.id === match.opponentPlayerId[0]).skill +
                                     opponentPlayers.find(p => p.id === match.opponentPlayerId[1]).skill;
                prediction = predictMatch(ourSkill, opponentSkill);
            } else {
                // Singles match: compare individual skills
                const ourSkill = ourPlayers.find(p => p.id === match.ourPlayerId).skill;
                const opponentSkill = opponentPlayers.find(p => p.id === match.opponentPlayerId).skill;
                prediction = predictMatch(ourSkill, opponentSkill);
            }
            
            if (prediction === 'win') winCount++;
            else if (prediction === 'loss') lossCount++;
            else unsureCount++;
        });
        
        return { 
            winCount, 
            lossCount, 
            unsureCount,
            totalMatches: matches.length,
            score: `${winCount}${unsureCount > 0 ? '-' + unsureCount : ''}-${lossCount}`
        };
    }

    // Define the matches based on the rules
    function defineMatches(ourPositions, opponentPositions) {
        const matches = [];
        
        // Check how many players in each team (in case there are only 2)
        const ourPlayerCount = ourPositions.length;
        const opponentPlayerCount = opponentPositions.length;
        
        // A - 1
        matches.push({
            description: 'Singles 1',
            ourPlayerId: ourPositions.find(p => p.position === 'A').id,
            opponentPlayerId: opponentPositions.find(p => p.position === '1').id
        });
        
        // B - 2
        matches.push({
            description: 'Singles 2',
            ourPlayerId: ourPositions.find(p => p.position === 'B').id,
            opponentPlayerId: opponentPositions.find(p => p.position === '2').id
        });
        
        // Doubles: B&C vs 2&3 (or A&B vs 1&2 if only 2 players)
        if (ourPlayerCount >= 3 && opponentPlayerCount >= 3) {
            // B&C - 2&3 (three players in each team)
            matches.push({
                description: 'Doubles',
                ourPlayerId: [
                    ourPositions.find(p => p.position === 'B').id,
                    ourPositions.find(p => p.position === 'C').id
                ],
                opponentPlayerId: [
                    opponentPositions.find(p => p.position === '2').id,
                    opponentPositions.find(p => p.position === '3').id
                ]
            });
        } else {
            // A&B - 1&2 (two players in each team)
            matches.push({
                description: 'Doubles',
                ourPlayerId: [
                    ourPositions.find(p => p.position === 'A').id,
                    ourPositions.find(p => p.position === 'B').id
                ],
                opponentPlayerId: [
                    opponentPositions.find(p => p.position === '1').id,
                    opponentPositions.find(p => p.position === '2').id
                ]
            });
        }
        
        // A - 3 (or A - 2 if only 2 players)
        if (opponentPlayerCount >= 3) {
            matches.push({
                description: 'Singles 3',
                ourPlayerId: ourPositions.find(p => p.position === 'A').id,
                opponentPlayerId: opponentPositions.find(p => p.position === '3').id
            });
        } else {
            matches.push({
                description: 'Singles 3',
                ourPlayerId: ourPositions.find(p => p.position === 'A').id,
                opponentPlayerId: opponentPositions.find(p => p.position === '2').id
            });
        }
        
        // C - 1 (or B - 1 if only 2 players)
        if (ourPlayerCount >= 3) {
            matches.push({
                description: 'Singles 4',
                ourPlayerId: ourPositions.find(p => p.position === 'C').id,
                opponentPlayerId: opponentPositions.find(p => p.position === '1').id
            });
        } else {
            matches.push({
                description: 'Singles 4',
                ourPlayerId: ourPositions.find(p => p.position === 'B').id,
                opponentPlayerId: opponentPositions.find(p => p.position === '1').id
            });
        }
        
        return matches;
    }

    // Generate all permutations of an array
    function getPermutations(array) {
        if (array.length <= 1) return [array.slice()];
        const perms = [];
        array.forEach((item, index) => {
            const rest = array.slice(0, index).concat(array.slice(index + 1));
            getPermutations(rest).forEach(subPerm => {
                perms.push([item].concat(subPerm));
            });
        });
        return perms;
    }

    // Find the optimal team order based on opponent lineup
    function findOptimalOrder() {
        const opponentOrder = getPlayerOrder(opponentTeamList);
         
        // Map positions to number designations for opponents
        const opponentPositions = opponentOrder.map((id, index) => ({
            id,
            position: (index + 1).toString(),
            player: opponentPlayers.find(p => p.id === id)
        }));
        
        // Generate all possible permutations of our team order dynamically
        const ourIds = ourPlayers.map(p => p.id);
        const permutations = getPermutations(ourIds);
         
        let bestPermutation = null;
        let bestScore = { winCount: -1, unsureCount: -1 };
        
        // Evaluate each permutation
        permutations.forEach(perm => {
            const ourPositions = perm.map((id, index) => {
                return {
                    id: id,
                    position: String.fromCharCode(65 + index), // A, B, C
                    player: ourPlayers.find(p => p.id === id)
                };
            });
            
            const outcome = calculateMatchOutcomes(ourPositions, opponentPositions);
            
            // Prioritize max wins, then max unsure (which may be winnable)
            if (outcome.winCount > bestScore.winCount || 
                (outcome.winCount === bestScore.winCount && outcome.unsureCount > bestScore.unsureCount)) {
                bestScore = {
                    winCount: outcome.winCount,
                    unsureCount: outcome.unsureCount,
                    lossCount: outcome.lossCount,
                    score: outcome.score
                };
                bestPermutation = perm;
            }
        });
        
        // Return the best permutation
        return {
            permutation: bestPermutation,
            score: bestScore
        };
    }

    // Update the optimal order display
    function updateOptimalOrder() {
        const optimal = findOptimalOrder();
        if (optimal) {
            document.getElementById('optimal-a').textContent = ourPlayers.find(p => p.id === optimal.permutation[0]).name;
            document.getElementById('optimal-b').textContent = ourPlayers.find(p => p.id === optimal.permutation[1]).name;
            document.getElementById('optimal-c').textContent = ourPlayers.find(p => p.id === optimal.permutation[2]).name;
            document.getElementById('optimal-score').textContent = optimal.score.score;
            
            // Highlight the optimal-order section
            const optimalOrder = document.getElementById('optimal-order');
            optimalOrder.classList.add('highlight');
            setTimeout(() => {
                optimalOrder.classList.remove('highlight');
            }, 1000);
        }
    }

    // Update the strategy table based on current player orders
    function updateStrategy() {
        const ourOrder = getPlayerOrder(ourTeamList);
        const opponentOrder = getPlayerOrder(opponentTeamList);
        
        // Map positions to letter/number designations
        const ourPositions = ourOrder.map((id, index) => {
            return {
                id: id,
                position: String.fromCharCode(65 + index), // A, B, C
                player: ourPlayers.find(p => p.id === id)
            };
        });
        
        const opponentPositions = opponentOrder.map((id, index) => {
            return {
                id: id,
                position: (index + 1).toString(), // 1, 2, 3
                player: opponentPlayers.find(p => p.id === id)
            };
        });
        
        // Define the matches
        const matches = defineMatches(ourPositions, opponentPositions);
        
        // Generate the table content
        const strategyTable = document.getElementById('strategy-table');
        strategyTable.innerHTML = '';
        
        let winCount = 0;
        let lossCount = 0;
        let unsureCount = 0;
        
        // Add each match to the table
        matches.forEach((match, index) => {
            const row = document.createElement('tr');
            
            // Match description
            const descCell = document.createElement('td');
            descCell.textContent = match.description;
            row.appendChild(descCell);
            
            // Our player(s)
            const ourCell = document.createElement('td');
            if (Array.isArray(match.ourPlayerId)) {
                const player1 = ourPlayers.find(p => p.id === match.ourPlayerId[0]);
                const player2 = ourPlayers.find(p => p.id === match.ourPlayerId[1]);
                ourCell.textContent = `${player1.name} & ${player2.name}`;
            } else {
                const player = ourPlayers.find(p => p.id === match.ourPlayerId);
                ourCell.textContent = player.name;
            }
            row.appendChild(ourCell);
            
            // Opponent player(s)
            const opponentCell = document.createElement('td');
            if (Array.isArray(match.opponentPlayerId)) {
                const player1 = opponentPlayers.find(p => p.id === match.opponentPlayerId[0]);
                const player2 = opponentPlayers.find(p => p.id === match.opponentPlayerId[1]);
                opponentCell.textContent = `${player1.name} & ${player2.name}`;
            } else {
                const player = opponentPlayers.find(p => p.id === match.opponentPlayerId);
                opponentCell.textContent = player.name;
            }
            row.appendChild(opponentCell);
            
            // Prediction
            const predictionCell = document.createElement('td');
            let prediction;
            
            if (Array.isArray(match.ourPlayerId)) {
                // Doubles match: compare combined skills
                const ourSkill = ourPlayers.find(p => p.id === match.ourPlayerId[0]).skill + 
                                 ourPlayers.find(p => p.id === match.ourPlayerId[1]).skill;
                const opponentSkill = opponentPlayers.find(p => p.id === match.opponentPlayerId[0]).skill +
                                     opponentPlayers.find(p => p.id === match.opponentPlayerId[1]).skill;
                prediction = predictMatch(ourSkill, opponentSkill);
            } else {
                // Singles match: compare individual skills
                const ourSkill = ourPlayers.find(p => p.id === match.ourPlayerId).skill;
                const opponentSkill = opponentPlayers.find(p => p.id === match.opponentPlayerId).skill;
                prediction = predictMatch(ourSkill, opponentSkill);
            }
            
            const badge = document.createElement('span');
            
            if (prediction === 'win') {
                badge.className = 'badge prediction-badge-win';
                badge.textContent = 'Win';
                row.classList.add('prediction-win');
                winCount++;
            } else if (prediction === 'loss') {
                badge.className = 'badge prediction-badge-loss';
                badge.textContent = 'Loss';
                row.classList.add('prediction-loss');
                lossCount++;
            } else {
                badge.className = 'badge prediction-badge-unsure';
                badge.textContent = 'Unsure';
                row.classList.add('prediction-unsure');
                unsureCount++;
            }
            
            predictionCell.appendChild(badge);
            row.appendChild(predictionCell);
            strategyTable.appendChild(row);
        });
        
        // Update the predicted result
        const predictedResult = document.getElementById('predicted-result');
        let resultText = `${winCount}`;
        if (unsureCount > 0) {
            resultText += `-${unsureCount}`;
        }
        resultText += `-${lossCount}`;
        
        predictedResult.textContent = resultText;
        
        if (winCount > lossCount) {
            predictedResult.className = 'text-success';
        } else if (winCount < lossCount) {
            predictedResult.className = 'text-danger';
        } else {
            predictedResult.className = 'text-dark';
        }
        
        // Update the optimal order suggestion
        updateOptimalOrder();
        // Also update Optimal Match Predictions table
        updateOptimalPredictions();
    }

    // Populate the optimal predictions side-by-side
    function updateOptimalPredictions() {
        // Build opponent positions from current order
        const opponentOrder = getPlayerOrder(opponentTeamList);
        const opponentPositions = opponentOrder.map((id, index) => ({
            id,
            position: (index + 1).toString(),
            player: opponentPlayers.find(p => p.id === id)
        }));
        // Get optimal permutation
        const optimal = findOptimalOrder();
        const perm = optimal.permutation;
        const ourPositionsOptimal = perm.map((id, index) => ({
            id,
            position: String.fromCharCode(65 + index),
            player: ourPlayers.find(p => p.id === id)
        }));
        // Define matches and build rows
        const matchesOpt = defineMatches(ourPositionsOptimal, opponentPositions);
        const tbodyOpt = document.getElementById('optimal-strategy-table');
        tbodyOpt.innerHTML = '';
        let winOpt = 0, lossOpt = 0, unsureOpt = 0;
        matchesOpt.forEach(match => {
            // reuse prediction logic
            let pred;
            if (Array.isArray(match.ourPlayerId)) {
                const ourSkill = ourPlayers.find(p => p.id === match.ourPlayerId[0]).skill +
                                 ourPlayers.find(p => p.id === match.ourPlayerId[1]).skill;
                const oppSkill = opponentPlayers.find(p => p.id === match.opponentPlayerId[0]).skill +
                                  opponentPlayers.find(p => p.id === match.opponentPlayerId[1]).skill;
                pred = predictMatch(ourSkill, oppSkill);
            } else {
                const ourSkill = ourPlayers.find(p => p.id === match.ourPlayerId).skill;
                const oppSkill = opponentPlayers.find(p => p.id === match.opponentPlayerId).skill;
                pred = predictMatch(ourSkill, oppSkill);
            }
            // count and build row
            const row = document.createElement('tr');
            const descCell = document.createElement('td'); descCell.textContent = match.description; row.appendChild(descCell);
            const ourCell = document.createElement('td');
            ourCell.textContent = Array.isArray(match.ourPlayerId)
                ? `${ourPlayers.find(p => p.id === match.ourPlayerId[0]).name} & ${ourPlayers.find(p => p.id === match.ourPlayerId[1]).name}`
                : ourPlayers.find(p => p.id === match.ourPlayerId).name;
            row.appendChild(ourCell);
            const oppCell = document.createElement('td');
            oppCell.textContent = Array.isArray(match.opponentPlayerId)
                ? `${opponentPlayers.find(p => p.id === match.opponentPlayerId[0]).name} & ${opponentPlayers.find(p => p.id === match.opponentPlayerId[1]).name}`
                : opponentPlayers.find(p => p.id === match.opponentPlayerId).name;
            row.appendChild(oppCell);
            const predCell = document.createElement('td');
            const badge = document.createElement('span');
            if (pred === 'win') { badge.className = 'badge prediction-badge-win'; badge.textContent = 'Win'; winOpt++; }
            else if (pred === 'loss') { badge.className = 'badge prediction-badge-loss'; badge.textContent = 'Loss'; lossOpt++; }
            else { badge.className = 'badge prediction-badge-unsure'; badge.textContent = 'Unsure'; unsureOpt++; }
            predCell.appendChild(badge);
            row.appendChild(predCell);
            tbodyOpt.appendChild(row);
        });
        // Footer result
        const optimalResultEl = document.getElementById('optimal-predicted-result');
        optimalResultEl.textContent = `${winOpt}${unsureOpt>0?'-'+unsureOpt:''}-${lossOpt}`;
        if (winOpt > lossOpt) {
            optimalResultEl.className = 'text-success';
        } else if (winOpt < lossOpt) {
            optimalResultEl.className = 'text-danger';
        } else {
            optimalResultEl.className = 'text-dark';
        }
    }

    // Initial update
    updateStrategy();
});