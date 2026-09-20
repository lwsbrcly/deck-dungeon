const THEMES = {

    dungeon: {

        id: 'kdungeon',
        name: 'Deck Dungeon',
        description: 'Fight monsters, find weapons, and escape the dungeon.',

        colours: {
            bg: '#121214',
            cardBg: '#1e1e24',
            panelBg: '#18181c',
            border: '#2e2e38',
            text: '#e1e1e6',
            muted: '#8d8d99',
            accent: '#6A557F',
            gold: '#f1c40f',
            danger: '#e55555',
            success: '#47d16c'
        },

        terminology: {
            gameTitle: 'DECK DUNGEON',
            location: 'Dungeon',
            enemy: 'Monster',
            weapon: 'Weapon',
            healing: 'Food',
            flee: 'Flee',
            enter: 'Enter Dungeon'
        },

        cards: {
            'clubs-2': {
                name: 'Rat',
                type: 'monster'
            },

            'clubs-3': {
                name: 'Cave Spider',
                type: 'monster'
            },

            'spades-A': {
                name: 'Bone Dragon',
                type: 'monster',
                art: 'bone-dragon.svg'
            },

            'diamonds-2': {
                name: 'Dagger',
                type: 'weapon'
            }

            // ...
        }
    }

};
