const THEMES = {

    dungeon: {
        
        name: 'Deck Dungeon',
        description: 'Monsters. Weapons. Potions. Can you escape alive?',

        artwork: {
            logo: 'assets/dungeon/logo.png',
            card: 'assets/dungeon/card.png',
            back: 'assets/dungeon/back.png',
            background: 'assets/dungeon/background.png',
            portraits: 'assets/dungeon/portraits/',
            portraitCount: 15,
        
            monsters: {
                'clubs_2': 'assets/dungeon/monsters/rat.png',
                'clubs_3': 'assets/dungeon/monsters/cave_spider.png',
                'clubs_4': 'assets/dungeon/monsters/wolf.png',
                'clubs_5': 'assets/dungeon/monsters/goblin.png',
                'clubs_6': 'assets/dungeon/monsters/something.png',
                'clubs_7': 'assets/dungeon/monsters/shaman.png',
                'clubs_8': 'assets/dungeon/monsters/bandit.png',
                'clubs_9': 'assets/dungeon/monsters/gladiator.png',
                'clubs_10': 'assets/dungeon/monsters/dark_wizard.png',
                'clubs_J': 'assets/dungeon/monsters/minotaur.png',
                'clubs_Q': 'assets/dungeon/monsters/ogre.png',
                'clubs_K': 'assets/dungeon/monsters/giant.png',
                'clubs_A': 'assets/dungeon/monsters/dragon.png',

                'spades_2': 'assets/dungeon/monsters/fog.png',
                'spades_3': 'assets/dungeon/monsters/slime.png',
                'spades_4': 'assets/dungeon/monsters/snakes.png',
                'spades_5': 'assets/dungeon/monsters/skeleton.png',
                'spades_6': 'assets/dungeon/monsters/zombie.png',
                'spades_7': 'assets/dungeon/monsters/ghost.png',
                'spades_8': 'assets/dungeon/monsters/ghoul.png',
                'spades_9': 'assets/dungeon/monsters/wraith.png',
                'spades_10': 'assets/dungeon/monsters/necromancer.png',
                'spades_J': 'assets/dungeon/monsters/vampire.png',
                'spades_Q': 'assets/dungeon/monsters/mummy.png',
                'spades_K': 'assets/dungeon/monsters/lich_king.png',
                'spades_A': 'assets/dungeon/monsters/bone_dragon.png'
            },
            
            weapons: {
                'diamonds_2': 'assets/dungeon/weapons/dagger.png',
                'diamonds_3': 'assets/dungeon/weapons/club.png',
                'diamonds_4': 'assets/dungeon/weapons/short_sword.png',
                'diamonds_5': 'assets/dungeon/weapons/mace.png',
                'diamonds_6': 'assets/dungeon/weapons/long_sword.png',
                'diamonds_7': 'assets/dungeon/weapons/battle_axe.png',
                'diamonds_8': 'assets/dungeon/weapons/warhammer.png',
                'diamonds_9': 'assets/dungeon/weapons/great_axe.png',
                'diamonds_10': 'assets/dungeon/weapons/greatsword.png',
            },

            food: {
                'hearts_2': 'assets/dungeon/food/stale_bread.png',
                'hearts_3': 'assets/dungeon/food/sus_mushrooms.png',
                'hearts_4': 'assets/dungeon/food/apple.png',
                'hearts_5': 'assets/dungeon/food/fresh_bread.png',
                'hearts_6': 'assets/dungeon/food/cooked_meats.png',
                'hearts_7': 'assets/dungeon/food/roast_chicken.png',
                'hearts_8': 'assets/dungeon/food/hearty_stew.png',
                'hearts_9': 'assets/dungeon/food/healing_elixir.png',
                'hearts_10': 'assets/dungeon/food/magic_potion.png',
            },
        },

        colours: {
            rules: {
                bg: "#19191a",
                panelBg: "#4b4131",
                border: "#d89f3f",
                text: "#CDA655",
                muted: "#000000",
                highlight: "#474b14",
            },
            game: {
                bg: "#19191a",
                border: "#d89f3f",
                text: "#CDA655",
                muted: "#79731B",
                logText: "#CDA655",
                red: "#FD0201",
                highlight: "#DC8618",
            },
        },


        endGame: {

                win: {

                    title: 'Dungeon Complete!',

                    body: 'You have defeated the dungeon!'

                },

                lose: {

                    title: 'You Have Fallen',

                    body: 'The dungeon has beaten you this time, Adventurer.'

                },

                draw: {

                    title: 'A Pyrrhic Victory!',

                    body: 'You struck down the final beast of the dungeon, but took a mortal blow in the process. The dungeon is cleared, though none survived to tell the tale!'

                }

            },

        text: {
            gameTitle: 'DECK DUNGEON',
            location: 'Dungeon',
            monster: 'Monster',
            weapon: 'Weapon',
            potion: 'Food',
            equip: 'equips',
            discard: 'discards',
            fight: 'swings their weapon at',
            fist: 'enters fist fight with',
            heal: 'consumes',
            enter: 'Enters Dungeon weilding',
        },

        actions: {
            monster: { primary: 'Weapon', secondary: 'Fist Fight' },
            weapon: { primary: 'Equip', secondary: 'Discard' },
            consumable: { primary: 'Consume', secondary: 'Discard' },
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
                    2: { name: 'Dagger', animation: 'melee' }, 3: { name: 'Club', animation: 'melee' }, 
                    4: { name: 'Short Sword', animation: 'melee' }, 5: { name: 'Mace', animation: 'melee' },
                    6: { name: 'Longsword', animation: 'melee' }, 7: { name: 'Battle Axe', animation: 'melee' }, 
                    8: { name: 'Warhammer', animation: 'melee' }, 9: { name: 'Great Axe', animation: 'melee' }, 
                    10: { name: 'Greatsword', animation: 'melee' }
                }
            },
            potions: {
                hearts: {
                    2: { name: 'Stale Bread', animation: 'eat' }, 3: { name: 'Sus Mushrooms', animation: 'eat' }, 
                    4: { name: 'Apple', animation: 'eat' }, 5: { name: 'Fresh Bread', animation: 'eat' },
                    6: { name: 'Cooked Meats', animation: 'eat' }, 7: { name: 'Roast Chicken', animation: 'eat' }, 
                    8: { name: 'Hearty Stew', animation: 'eat' }, 9: { name: 'Healing Elixir', animation: 'drink' }, 
                    10: { name: 'Magic Potion', animation: 'drink' }
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
            background: 'assets/shaun/background.png',
            portraits: 'assets/shaun/portraits/',
            portraitCount: 20,

            monsters: {
                'clubs_2': 'assets/shaun/monsters/jill.png',
                'clubs_3': 'assets/shaun/monsters/derek.png',
                'clubs_4': 'assets/shaun/monsters/spinster.png',
                'clubs_5': 'assets/shaun/monsters/noel.png',
                'clubs_6': 'assets/shaun/monsters/danny.png',
                'clubs_7': 'assets/shaun/monsters/snakehips.png',
                'clubs_8': 'assets/shaun/monsters/nelson.png',
                'clubs_9': 'assets/shaun/monsters/mary.png',
                'clubs_10': 'assets/shaun/monsters/trish.png',
                'clubs_J': 'assets/shaun/monsters/john.png',
                'clubs_Q': 'assets/shaun/monsters/barbara.png',
                'clubs_K': 'assets/shaun/monsters/philip.png', 
                'clubs_A': 'assets/shaun/monsters/pete.png',
                'spades_2': 'assets/shaun/monsters/football_kid.png',
                'spades_3': 'assets/shaun/monsters/groom.png',
                'spades_4': 'assets/shaun/monsters/homeless.png',
                'spades_5': 'assets/shaun/monsters/shopkeeper.png',
                'spades_6': 'assets/shaun/monsters/hoodie.png',
                'spades_7': 'assets/shaun/monsters/youth.png',
                'spades_8': 'assets/shaun/monsters/courier.png',
                'spades_9': 'assets/shaun/monsters/stalker.png',
                'spades_10': 'assets/shaun/monsters/white_lies.png',
                'spades_J': 'assets/shaun/monsters/pigeon_guy.png',
                'spades_Q': 'assets/shaun/monsters/florist.png',
                'spades_K': 'assets/shaun/monsters/white_eyes.png',
                'spades_A': 'assets/shaun/monsters/twins.png',
            },

            weapons: {
                'diamonds_2': 'assets/shaun/weapons/vinyl.png',
                'diamonds_3': 'assets/shaun/weapons/darts.png',
                'diamonds_4': 'assets/shaun/weapons/swingball.png',
                'diamonds_5': 'assets/shaun/weapons/golf_club.png',
                'diamonds_6': 'assets/shaun/weapons/hockey_stick.png',
                'diamonds_7': 'assets/shaun/weapons/pool_cue.png',
                'diamonds_8': 'assets/shaun/weapons/spade.png',
                'diamonds_9': 'assets/shaun/weapons/cricket_bat.png',
                'diamonds_10': 'assets/shaun/weapons/winchester.png',
            },

            food: {
                'hearts_2': 'assets/shaun/food/peanuts.png',
                'hearts_3': 'assets/shaun/food/fish.png',
                'hearts_4': 'assets/shaun/food/guinness.png',
                'hearts_5': 'assets/shaun/food/coke.png',
                'hearts_6': 'assets/shaun/food/toastie.png',
                'hearts_7': 'assets/shaun/food/pint.png',
                'hearts_8': 'assets/shaun/food/meat_pie.png',
                'hearts_9': 'assets/shaun/food/pork_scratchings.png',
                'hearts_10': 'assets/shaun/food/cornetto.png',
            },
        },

        colours: {
            rules: {
                bg: "#19191a",
                panelBg: "#972B1E",
                border: "#E88B20",
                text: "#EFD3AE",
                muted: "#000000",
                highlight: "#C86801",
            },
            game: {
                bg: "#19191a",
                border: "#e48a41",
                text: "#efcfa6",
                muted: "#b0181c",
                logText: "#efcfa6",
                red: "#b0181c",
                highlight: "#fbcb3e",
            },
        },


        endGame: {

                win: {

                    title: 'You survived!',

                    body: 'The army arrived and averted the apocolypse!'

                },

                lose: {

                    title: 'You got bitten!',

                    body: 'You\'ve been turned into a zombie. Hope you get a nice job somewhere.'

                },

                draw: {

                    title: 'You\'ve got red on you!',

                    body: 'You killed all the zombies, but became one yourself. Hope it was all worth it!'

                }

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
            enter: 'Heads out, armed with',
        },

        actions: {
            monster: { primary: 'Bash', secondary: 'Heroics' },
            weapon: { primary: 'Grab', secondary: 'Chuck' },
            consumable: { primary: 'Snack', secondary: 'Chuck' },
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
                    2: { name: 'Vinyl Record', animation: 'thrown' }, 3: { name: 'Darts', animation: 'thrown' }, 
                    4: { name: 'Swingball', animation: 'melee' }, 5: { name: 'Golf Club', animation: 'melee' },
                    6: { name: 'Hockey Stick', animation: 'melee' }, 7: { name: 'Pool Cue', animation: 'melee' }, 
                    8: { name: 'Spade', animation: 'melee' }, 9: { name: 'Cricket Bat', animation: 'melee' }, 
                    10: { name: 'Winchester', animation: 'ranged' }
                }
            },
            potions: {
                hearts: {
                    2: { name: 'Peanuts', animation: 'eat' }, 3: { name: 'Fulci\'s Fish', animation: 'eat' },
                    4: { name: 'Guinness', animation: 'drink' }, 5: { name: 'Regular Coke', animation: 'drink' },
                    6: { name: 'Toastie', animation: 'eat' }, 7: { name: 'Cold Pint', animation: 'drink' }, 
                    8: { name: 'Meat Pie', animation: 'eat' }, 9: { name: 'Pork Scratchings', animation: 'eat' }, 
                    10: { name: 'Cornetto', animation: 'eat' }
                }
            }
        }
    },
    space: {
        
        name: 'Space Deck',
        description: 'You dock your mercenary ship and enter the derelict freighter. Wait. Something\'s moving...',

        artwork: {
            logo: 'assets/space/logo.png',
            card: 'assets/space/card.png',
            back: 'assets/space/back.png',
            background: 'assets/space/background.png',
            portraits: 'assets/space/portraits/',
            portraitCount: 16,
            
            monsters: {
                'clubs_2': 'assets/space/monsters/2.png',
                'clubs_3': 'assets/space/monsters/3.png',
                'clubs_4': 'assets/space/monsters/4.png',
                'clubs_5': 'assets/space/monsters/5.png',
                'clubs_6': 'assets/space/monsters/6.png',
                'clubs_7': 'assets/space/monsters/7.png',
                'clubs_8': 'assets/space/monsters/8.png',
                'clubs_9': 'assets/space/monsters/9.png',
                'clubs_10': 'assets/space/monsters/10.png',
                'clubs_J': 'assets/space/monsters/J.png',
                'clubs_Q': 'assets/space/monsters/Q.png',
                'clubs_K': 'assets/space/monsters/K.png',
                'clubs_A': 'assets/space/monsters/AC.png',
        
                'spades_2': 'assets/space/monsters/2.png',
                'spades_3': 'assets/space/monsters/3.png',
                'spades_4': 'assets/space/monsters/4.png',
                'spades_5': 'assets/space/monsters/5.png',
                'spades_6': 'assets/space/monsters/6.png',
                'spades_7': 'assets/space/monsters/7.png',
                'spades_8': 'assets/space/monsters/8.png',
                'spades_9': 'assets/space/monsters/9.png',
                'spades_10': 'assets/space/monsters/10.png',
                'spades_J': 'assets/space/monsters/J.png',
                'spades_Q': 'assets/space/monsters/Q.png',
                'spades_K': 'assets/space/monsters/K.png',
                'spades_A': 'assets/space/monsters/AS.png'
            },
            
            weapons: {
                'diamonds_2': 'assets/space/weapons/2.png',
                'diamonds_3': 'assets/space/weapons/3.png',
                'diamonds_4': 'assets/space/weapons/4.png',
                'diamonds_5': 'assets/space/weapons/5.png',
                'diamonds_6': 'assets/space/weapons/6.png',
                'diamonds_7': 'assets/space/weapons/7.png',
                'diamonds_8': 'assets/space/weapons/8.png',
                'diamonds_9': 'assets/space/weapons/9.png',
                'diamonds_10': 'assets/space/weapons/10.png',
            },

            food: {
                'hearts_2': 'assets/space/food/2.png',
                'hearts_3': 'assets/space/food/3.png',
                'hearts_4': 'assets/space/food/4.png',
                'hearts_5': 'assets/space/food/5.png',
                'hearts_6': 'assets/space/food/6.png',
                'hearts_7': 'assets/space/food/7.png',
                'hearts_8': 'assets/space/food/8.png',
                'hearts_9': 'assets/space/food/9.png',
                'hearts_10': 'assets/space/food/10.png',
            },
        },

        colours: {
            rules: {
                bg: "#19191a",
                panelBg: "#2b292b",
                border: "#853237",
                text: "#F4C61F",
                muted: "#00000",
                highlight: "#22618F ",
            },
            game: {
                bg: "#19191a",
                border: "#a6711f",
                text: "#fd2f20",
                muted: "#a6711f",
                logText: "#52d65b",
                red: "#fd2f20",
                highlight: "#52d65b",
            },
        },


        endGame: {

                win: {

                    title: 'You have survived!',

                    body: 'Time to loot the ship of any worthy cargo, and get the hell out of here!'

                },

                lose: {

                    title: 'You have been enslaved by the hive.',

                    body: 'At least you can rest assured your body will live on to feed hundreds more hideous aliens.'

                },

                draw: {

                    title: 'You put up a good fight!',

                    body: 'The threats are subdued. Too bad you couldn\'t send out that HAZARDOUS SHIP alert to warn the others...!'

                }

            },

        text: {
            gameTitle: 'Space Deck',
            location: 'Derelict Freighter',
            monster: 'Xenomorph',
            weapon: 'Weapon',
            potion: 'Med-kit',
            equip: 'loads up',
            discard: 'jetisons',
            fight: 'targets',
            fist: 'engages in close combat with',
            heal: 'applies',
            flee: 'Escapes',
            enter: 'Boards ship armed with',
        },

        actions: {
            monster: { primary: 'Target', secondary: 'Engage' },
            weapon: { primary: 'Gear Up', secondary: 'Jettison' },
            consumable: { primary: 'Use', secondary: 'Jettison' },
        },

        cards: {
            monsters: {
                clubs: {
                    2: 'Sporeling', 3: 'Scuttler', 4: 'Drone', 5: 'Stinger',
                    6: 'Skitterer', 7: 'Ravager', 8: 'Stalker', 9: 'Broodguard',
                    10: 'Warrior', J: 'Crusher', Q: 'Matriarch', K: 'Overmind', A: 'Hive Queen'
                },
                spades: {
                    2: 'Sporeling', 3: 'Scuttler', 4: 'Drone', 5: 'Stinger',
                    6: 'Skitterer', 7: 'Ravager', 8: 'Stalker', 9: 'Broodguard',
                    10: 'Warrior', J: 'Crusher', Q: 'Matriarch', K: 'Overmind', A: 'Broodlord'
                }
            },
            weapons: {
                diamonds: {
                    2: { name: 'Combat Knife', animation: 'melee' }, 3: { name: 'Shock Baton', animation: 'melee' },
                    4: { name: 'Scattergun', animation: 'ranged' }, 5: { name: 'Pulse Rifle', animation: 'ranged' },
                    6: { name: 'Plasma Launcher', animation: 'ranged' }, 7: { name: 'Grav Hammer', animation: 'melee' }, 
                    8: { name: 'Arc Cannon', animation: 'ranged' }, 9: { name: 'Sonic Railgun', animation: 'ranged' },
                    10: { name: 'Disruptor™ MkII', animation: 'ranged' }
                }
            },
            potions: {
                hearts: {
                    2: { name: 'Nutrient Gel', animation: 'drink' }, 3: { name: 'Field Rations', animation: 'eat' }, 
                    4: { name: 'Med-Kit', animation: 'use' }, 5: { name: 'Adrenal Shot', animation: 'use' },
                    6: { name: 'Pulse Battery', animation: 'use' }, 7: { name: 'Armour Plate', animation: 'use' }, 
                    8: { name: 'Nanobot Tube', animation: 'use' }, 9: { name: 'Combat Stimulant', animation: 'use' },
                    10: { name: 'MechSuit™', animation: 'use' }
                }
            }
        }
    },
    pirate: {
        
        name: 'All Hands On Deck',
        description: 'Arrgh me hearties! Sail the 7 seas and protect yer booty from the sea folk!',

        artwork: {
            logo: 'assets/pirate/logo.png',
            card: 'assets/pirate/card.png',
            back: 'assets/pirate/back.png',
            background: 'assets/pirate/background.png',
            portraits: 'assets/pirate/portraits/',
            portraitCount: 16,
        },

        colours: {
            rules: {
                bg: "#19191a",
                panelBg: "#a0723f",
                border: "#6a5a56",
                text: "#ecd7de",
                muted: "#493231",
                highlight: "#1a1a1a",
            },
            game: {
                bg: "#19191a",
                border: "#6a5a56",
                text: "#ecd7de",
                muted: "#493231",
                logText: "#493231",
                red: "#ab0431",
                highlight: "#1a1a1a",
            },
        },


        endGame: {

                win: {

                    title: 'Plundering, complete!',

                    body: 'You have defeated every ship in the sea, time to hoard some gold and bury it!'

                },

                lose: {

                    title: 'Avast, ye have be slain',

                    body: 'One too many boardings, Captain. Your legacy will be told throughout the ages.'

                },

                draw: {

                    title: 'Your ship is captainless!',

                    body: 'You died doing what you loved - pillaging. At least your crew will spend all the gold in your honour!'

                }

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
        },

        actions: {
            monster: { primary: 'Duel', secondary: 'Fisticuffs' },
            weapon: { primary: 'Arm', secondary: 'Cast Away' },
            consumable: { primary: 'Drink', secondary: 'Cast Away' },
        },

        cards: {
            monsters: {
                clubs: {
                    2: 'Merman', 3: 'Merman', 4: 'Merman', 5: 'Merman',
                    6: 'Merman', 7: 'Merman', 8: 'Merman', 9: 'Merman',
                    10: 'Merman', J: 'Merman', Q: 'Merman', K: 'Merman', A: 'Merman'
                },
                spades: {
                    2: 'Merman', 3: 'Merman', 4: 'Merman', 5: 'Merman',
                    6: 'Merman', 7: 'Merman', 8: 'Merman', 9: 'Merman',
                    10: 'Merman', J: 'Merman', Q: 'Merman', K: 'Merman', A: 'Merman'
                }
            },
            weapons: {
                diamonds: {
                    2: { name: 'Cutlass', animation: 'melee' }, 3: { name: 'Cutlass', animation: 'melee' },
                    4: { name: 'Cutlass', animation: 'melee' }, 5: { name: 'Cutlass', animation: 'thrown' },
                    6: { name: 'Cutlass', animation: 'thrown' }, 7: { name: 'Cutlass', animation: 'thrown' },
                    8: { name: 'Cutlass', animation: 'ranged' }, 9: { name: 'Cutlass', animation: 'ranged' },
                    10: { name: 'Cutlass', animation: 'ranged' }
                }
            },
            potions: {
                hearts: {
                    2: { name: 'Rum', animation: 'drink' }, 3: { name: 'Rum', animation: 'drink' }, 
                    4: { name: 'Rum', animation: 'drink' }, 5: { name: 'Rum', animation: 'drink' },
                    6: { name: 'Rum', animation: 'drink' }, 7: { name: 'Rum', animation: 'drink' }, 
                    8: { name: 'Rum', animation: 'drink' }, 9: { name: 'Rum', animation: 'drink' }, 
                    10: { name: 'Rum', animation: 'drink' }
                }
            }
        }
    },
    ninja: {
        
        name: 'Deck of Shadows',
        description: 'Don\'t get caught!',

        artwork: {
            logo: 'assets/ninja/logo.png',
            card: 'assets/ninja/card.png',
            back: 'assets/ninja/back.png',
            background: 'assets/ninja/background.png',
            portraits: 'assets/ninja/portraits/',
            portraitCount: 16,
        },

        colours: {
            rules: {
                bg: "#19191a",
                panelBg: "#a0723f",
                border: "#6a5a56",
                text: "#ecd7de",
                muted: "#493231",
                highlight: "#1a1a1a",
            },
            game: {
                bg: "#19191a",
                border: "#6a5a56",
                text: "#ecd7de",
                muted: "#493231",
                logText: "#493231",
                red: "#ab0431",
                highlight: "#1a1a1a",
            },
        },


        endGame: {

                win: {

                    title: 'Quest Successful!',

                    body: 'You have found your way to the Lord\'s inner chamber and stolen back your family heirloom!'

                },

                lose: {

                    title: 'You have been discovered',

                    body: 'Your quest was unsuccessful. Now run back home and train harder for your next attempt!'

                },

                draw: {

                    title: 'You were only one person away!',

                    body: 'You were discovered by the very last guard of the inner chamber. Escape now and return even stealthier, shinobi!'

                }

            },

        text: {
            gameTitle: 'Deck of Shadows',
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
        },

        actions: {
            monster: { primary: 'Sneak', secondary: 'Subdue' },
            weapon: { primary: 'Keep', secondary: 'Throw' },
            consumable: { primary: 'Learn', secondary: 'Ignore' },
        },

        cards: {
            monsters: {
                clubs: {
                    2: 'Servant', 3: 'Messenger', 4: 'Guard', 5: 'Archer',
                    6: 'Sentry', 7: 'Captain', 8: 'Guard dog', 9: 'Steward',
                    10: 'Royal Guard', J: 'Heir', Q: 'Courtier', K: 'Chamberlain', A: 'Lord'
                },
                spades: {
                    2: 'Servant', 3: 'Messenger', 4: 'Guard', 5: 'Archer',
                    6: 'Sentry', 7: 'Captain', 8: 'Guard dog', 9: 'Steward',
                    10: 'Royal Guard', J: 'Heir', Q: 'Courtier', K: 'Chamberlain', A: 'Lord'
                }
            },
            weapons: {
                diamonds: {
                    2: { name: 'Sneaking shoes', animation: 'melee' }, 3: { name: 'Face covering', animation: 'melee' },
                    4: { name: 'Hood', animation: 'melee' }, 5: { name: 'Cloth', animation: 'melee' },
                    6: { name: 'Straw Hat', animation: 'melee' }, 7: { name: 'Fire Kit', animation: 'melee' },
                    8: { name: 'Smoke bomb', animation: 'melee' }, 9: { name: 'Disguise', animation: 'melee' },
                    10: { name: 'Grappling Hook', animation: 'melee' }
                }
            },
            potions: {
                hearts: {
                    2: { name: 'Silent walk', animation: 'use' }, 3: { name: 'Keen hearing', animation: 'use' }, 
                    4: { name: 'Trap sense', animation: 'use' }, 5: { name: 'Lock picking', animation: 'use' },
                    6: { name: 'Night vision', animation: 'use' }, 7: { name: 'Cat\'s landing', animation: 'use' }, 
                    8: { name: 'Wall climbing', animation: 'use' }, 9: { name: 'Roof running', animation: 'use' }, 
                    10: { name: 'Shadow agility', animation: 'use' }
                }
            }
        }
    },

    ocean: {
        
        name: 'Ocean Deck',
        description: 'Dive deep. Discover what lies beneath.',

        artwork: {
            logo: 'assets/ocean/logo.png',
            card: 'assets/ocean/card.png',
            back: 'assets/ocean/back.png',
            background: 'assets/ocean/background.png',
            portraits: 'assets/ocean/portraits/',
            portraitCount: 16,
            
            monsters: {
                'clubs_2': 'assets/ocean/monsters/C2.png',
                'clubs_3': 'assets/ocean/monsters/C3.png',
                'clubs_4': 'assets/ocean/monsters/C4.png',
                'clubs_5': 'assets/ocean/monsters/C5.png',
                'clubs_6': 'assets/ocean/monsters/C6.png',
                'clubs_7': 'assets/ocean/monsters/C7.png',
                'clubs_8': 'assets/ocean/monsters/C8.png',
                'clubs_9': 'assets/ocean/monsters/C9.png',
                'clubs_10': 'assets/ocean/monsters/C10.png',
                'clubs_J': 'assets/ocean/monsters/CJ.png',
                'clubs_Q': 'assets/ocean/monsters/CQ.png',
                'clubs_K': 'assets/ocean/monsters/CK.png',
                'clubs_A': 'assets/ocean/monsters/CA.png',

                'spades_2': 'assets/ocean/monsters/S2.png',
                'spades_3': 'assets/ocean/monsters/S3.png',
                'spades_4': 'assets/ocean/monsters/S4.png',
                'spades_5': 'assets/ocean/monsters/S5.png',
                'spades_6': 'assets/ocean/monsters/S6.png',
                'spades_7': 'assets/ocean/monsters/S7.png',
                'spades_8': 'assets/ocean/monsters/S8.png',
                'spades_9': 'assets/ocean/monsters/S9.png',
                'spades_10': 'assets/ocean/monsters/S10.png',
                'spades_J': 'assets/ocean/monsters/SJ.png',
                'spades_Q': 'assets/ocean/monsters/SQ.png',
                'spades_K': 'assets/ocean/monsters/SK.png',
                'spades_A': 'assets/ocean/monsters/SA.png'
            },

            weapons: {
                'diamonds_2': 'assets/ocean/weapons/2.png',
                'diamonds_3': 'assets/ocean/weapons/3.png',
                'diamonds_4': 'assets/ocean/weapons/4.png',
                'diamonds_5': 'assets/ocean/weapons/5.png',
                'diamonds_6': 'assets/ocean/weapons/6.png',
                'diamonds_7': 'assets/ocean/weapons/7.png',
                'diamonds_8': 'assets/ocean/weapons/8.png',
                'diamonds_9': 'assets/ocean/weapons/9.png',
                'diamonds_10': 'assets/ocean/weapons/10.png',
            },

            food: {
                'hearts_2': 'assets/ocean/food/2.png',
                'hearts_3': 'assets/ocean/food/3.png',
                'hearts_4': 'assets/ocean/food/4.png',
                'hearts_5': 'assets/ocean/food/5.png',
                'hearts_6': 'assets/ocean/food/6.png',
                'hearts_7': 'assets/ocean/food/7.png',
                'hearts_8': 'assets/ocean/food/8.png',
                'hearts_9': 'assets/ocean/food/9.png',
                'hearts_10': 'assets/ocean/food/10.png',
            },
        },

        colours: {
            rules: {
                bg: "#19191a",
                panelBg: "#0b4366",
                border: "#1f9bd1",
                text: "#d7f5ff",
                muted: "#041822",
                highlight: "#0c7aa8",
            },
            game: {
                bg: "#19191a",
                border: "#1f9bd1",
                text: "#d7f5ff",
                muted: "#187ea2",
                logText: "#d7f5ff",
                red: "#000000",
                highlight: "#fa9500",
            },
        },

        endGame: {

                win: {
                    title: 'Dive Complete!',
                    body: 'You reached the depths and returned safely.'
                },

                lose: {
                    title: 'Lost at Sea',
                    body: 'The depths claimed your expedition.'
                },

                draw: {
                    title: 'A Narrow Escape',
                    body: 'You completed the dive, but barely made it back.'
                }

            },

        text: {
            gameTitle: 'Ocean Deck',
            location: 'The Deep',
            monster: 'Sea Creature',
            weapon: 'Equipment',
            potion: 'Supplies',
            equip: 'deploys',
            discard: 'stows',
            fight: 'explores',
            fist: 'freedives down to the',
            heal: 'installs',
            flee: 'Ascends',
            enter: 'Descends with',
        },

        actions: {
            monster: { primary: 'Explore', secondary: 'Freedive' },
            weapon: { primary: 'Select', secondary: 'Stow' },
            consumable: { primary: 'Install', secondary: 'Stow' },
        },

        cards: {
            monsters: {
                clubs: {
                    2: 'Shoal of fish', 3: 'Seagrass Meadow', 4: 'Kelp Forest', 5: 'Manta Ray',
                    6: 'Blue Whale', 7: 'Tiger Shark', 8: 'Sea Fan Garden', 9: 'Plane Wreck',
                    10: 'Whale Fall', J: 'Ghost Crabs', Q: 'Hydrothermal Vent', K: 'Bioluminescent Plume', A: 'Giant Isopods'
                },
                spades: {
                    2: 'Giant Turtle', 3: 'Coral Reef', 4: 'Dolphin Pod', 5: 'Sunken Boat',
                    6: 'Sea Cave', 7: 'Deep Shelf', 8: 'Sunfish', 9: 'Jellyfish Bloom',
                    10: 'Vampire Squid', J: 'Seamount', Q: 'Deep Trench', K: 'Sponge Garden', A: 'Abyssal Plain'
                }
            },
            weapons: {
                diamonds: {
                    2: { name: 'Dive Light', animation: 'discover' },
                    3: { name: 'Sample Kit', animation: 'discover' },
                    4: { name: 'Underwater Camera', animation: 'discover' },
                    5: { name: 'Sonar Scanner', animation: 'discover' },
                    6: { name: 'Water Sampler', animation: 'discover' },
                    7: { name: 'Long-range Imaging', animation: 'discover' },
                    8: { name: 'Deep-sea Telescope', animation: 'discover' },
                    9: { name: 'R.O.V.', animation: 'discover' },
                    10: { name: 'Submarine', animation: 'discover' }
                }
            },
            potions: {
                hearts: {
                    2: { name: 'CO₂ Scrubber', animation: 'use' },
                    3: { name: 'Electrolyzer', animation: 'use' },
                    4: { name: 'Oxygen Storage', animation: 'use' },
                    5: { name: 'Oxygen Generator', animation: 'use' },
                    6: { name: 'Pressure Regulator', animation: 'use' },
                    7: { name: 'Air Purifier', animation: 'use' },
                    8: { name: 'Oxygen Compressor', animation: 'use' },
                    9: { name: 'Emergency Oxygen', animation: 'use' },
                    10: { name: 'Life Support Unit', animation: 'use' }
                }
            }
        }
    },
};
