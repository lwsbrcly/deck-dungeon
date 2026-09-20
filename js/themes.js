const THEMES = {

    dungeon: {
        
        name: 'Deck Dungeon',
        description: 'Monsters. Weapons. Potions. Can you escape alive?',

        artwork: {
            logo: 'assets/dungeon/logo.png',
            card: 'assets/dungeon/card.png',
            back: 'assets/dungeon/back.png',
        },

        //audio: {},
            
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

        text: {
            gameTitle: 'DECK DUNGEON',
            location: 'Dungeon',
            monster: 'Monster',
            weapon: 'Weaon',
            potion: 'Food',
            equip: 'equips',
            discard: 'discards',
            fight: 'uses',
            fist: 'enters fist fight with',
            heal: 'consumes',
            flee: 'Fled the room',
            enter: 'Enters Dungeon weilding',
            draw: 'No one survived etc',
            lose: 'The dungeon has defeated you',
            win: 'You have defeated the dungeon!',
        },

        cards: {
            monsters: {
                clubs: {
                    2: 'Rat', 3: 'Cave Spider', 4: 'Wolf', 5: 'Goblin',
                    6: 'Orc', 7: 'Shaman', 8: 'Bandit', 9: 'Gladiator',
                    10: 'Dark Wizard', J: 'Minotaur', Q: 'Ogre', K: 'Giant', A: 'Dragon'
                },
                spades: {
                    2: 'Spooky Fog', 3: 'Slime', 4: 'Snakes', 5: 'Skeleton',
                    6: 'Zombie', 7: 'Ghost', 8: 'Ghoul', 9: 'Wraith',
                    10: 'Necromancer', J: 'Vampire', Q: 'Mummy', K: 'Lich King', A: 'Bone Dragon'
                }
            },
            weapons: {
                diamonds: {
                    2: 'Dagger', 3: 'Club', 4: 'Short Sword', 5: 'Mace',
                    6: 'Longsword', 7: 'Battle Axe', 8: 'Warhammer', 9: 'Great Axe', 10: 'Greatsword'
                }
            },
            potions: {
                hearts: {
                    2: 'Stale Bread', 3: 'Sus Mushrooms', 4: 'Apple', 5: 'Fresh Bread',
                    6: 'Cooked Meats', 7: 'Roast Chicken', 8: 'Hearty Stew', 9: 'Healing Elixir', 10: 'Magic Potion'
                }
            }
        }
    }
};
