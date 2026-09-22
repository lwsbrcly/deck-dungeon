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
            bg: "#19191A",
            panelBg: "#0E253D",
            border: "#B0843C",
            text: "#CDA655",
            muted: "#8f8e8d",
            red: "#963221",
            highlight: "#eb6b20",
            rooms: "#a0723f",
        },

        text: {
            gameTitle: 'DECK DUNGEON',
            location: 'Dungeon',
            monster: 'Monster',
            weapon: 'Weapon',
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
    },
    shaun: {
        
        name: 'Shaun of the Deck',
        description: 'Go to the Winchester, have a nice cold pint, and wait for all of this to blow over.',

        artwork: {
            logo: 'assets/shaun/logo.png',
            card: 'assets/shaun/card.png',
            back: 'assets/shaun/back.png',
        },

        //audio: {},
            
        colours: {
            bg: "#19191A",
            panelBg: "#80855e",
            border: "#851819",
            text: "#e4ded0",
            muted: "#847a68",
            red: "#652b27",
            highlight: "#ac8754",
            rooms: "#2c2417",
        },

        text: {
            gameTitle: 'Shaun of the Deck',
            location: 'The Pub',
            monster: 'Zombie',
            weapon: 'Weapon',
            potion: 'Food',
            equip: 'grabs',
            discard: 'chucks',
            fight: 'whacks',
            fist: 'tussles with',
            heal: 'consumes',
            flee: 'Ran for it',
            enter: 'Heads out armed with',
            draw: 'No one survived etc',
            lose: 'The dungeon has defeated you',
            win: 'You have defeated the dungeon!',
        },

        cards: {
            monsters: {
                clubs: {
                    2: 'Jill', 3: 'Derek', 4: 'Spinster', 5: 'Noel',
                    6: 'Danny', 7: 'Snakehips', 8: 'Nelson', 9: 'Mary',
                    10: 'Trish', J: 'John', Q: 'Barbara', K: 'Philip', A: 'Pete'
                },
                spades: {
                    2: 'Football Kid', 3: 'Groom', 4: 'Homeless', 5: 'Shopkeeper',
                    6: 'Hoodie', 7: 'Youth', 8: 'Courier', 9: 'Stalker',
                    10: 'White Lies', J: 'Pigeon Guy', Q: 'Florist', K: 'White Eyes', A: 'The Twins'
                }
            },
            weapons: {
                diamonds: {
                    2: 'Vinyl Record', 3: 'Dart', 4: 'Swingball', 5: 'Golf Club',
                    6: 'Hockey Stick', 7: 'Pool Cue', 8: 'Shovel', 9: 'Cricket Bat', 10: 'Winchester'
                }
            },
            potions: {
                hearts: {
                    2: 'Peanuts', 3: 'Fulcis Fish', 4: 'Guinness', 5: 'Regular Coke',
                    6: 'Toastie', 7: 'Cold Pint', 8: 'Meat Pie', 9: 'Pork Scratchings', 10: 'Cornetto'
                }
            }
        }
    }
};
