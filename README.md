# Table Tennis Strategy Tool

A simple personal project for optimizing player orders in table tennis competitions.

## Overview

This tool helps you set up team lineups, rank players by skill, generate match predictions for both current and optimal orders, and find the best player order to maximize your chances of winning.

## Features

- Edit team names and player lineups
- Drag & drop to reorder “Our Team” and “Opposition Team” lineups
- Combine both teams into a single ranking and adjust by skill
- View “Current Match Predictions” based on your lineup
- Get an “Optimal Team Order” recommendation
- Compare predictions for current vs. optimal orders

## Built With

- HTML5 & CSS3 with [Bootstrap 5](https://getbootstrap.com/)
- Vanilla JavaScript (ES6+) with [SortableJS](https://github.com/SortableJS/Sortable)
- [Font Awesome](https://fontawesome.com/) for icons

## Getting Started

1. Clone or download this repository.
2. Open `index.html` in your web browser, or serve the folder via a local HTTP server:
   ```bash
   # Using Python 3
   python3 -m http.server 8080
   ```
3. Navigate to `http://localhost:8080` (if serving) or open the file directly.

## Usage

1. Click **Edit** on either team card to enter three player names.
2. Drag players in each team to set the playing order.
3. Drag players in the combined ranking list to adjust skill-based ranking.
4. View the **Current Match Predictions** table for expected outcomes.
5. Check the **Optimal Team Order** box to see recommended positions.
6. Compare against **Optimal Match Predictions** for the best lineup.

## Author

Jonathan Giles – [jonathangiles.net](http://jonathangiles.net)

## License

This is a personal project and is not licensed for redistribution.