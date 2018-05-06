import Phaser from 'phaser';

import {CraftingRecipes} from './crafting';
import {ItemResolver} from './entity/item';

class UI {
    constructor(args) {
        this.uiState = {
            inventoryOpen: false,
            inventoryCache: null
        }
        this.actionEmitter = new Phaser.EventEmitter();
    }
    create(args) {
        this.game = args.game;
        this.hpText = this.game.add.text(10, 10, 'HP: 0', { font: "20px Arial", fill: "#ffffff", align: "left" });
        this.hpText.setScrollFactor(0,0);

        this.inventoryContainer = this.game.add.container(0, 64);
        this.inventoryContainer.fixedToCamera = true;
        this.inventoryContainer.setScrollFactor(0,0);
        let invBox = this.game.make.graphics();
        
        invBox.fillStyle(0x0000dd, 0.5);
        invBox.fillRect(0, 0, 100, 332);
        invBox.setInteractive();
        invBox.on('pointermove', p => {
            invBox.setTint(0xff0000);
            console.log("oingaogn")
        })
        let itemBoxes = this.updateInventory([]);
        this.itemBoxes = itemBoxes;
        this.inventoryContainer.add(invBox);
        this.inventoryContainer.add(this.game.add.text(0, 0, 'Inventory', {align: 'center'}));
        this.inventoryContainer.add(itemBoxes);

        
        this.craftingContainer = this.game.add.container(this.game.cameras.main.width - 100, 64);
        this.craftingContainer.fixedToCamera = true;
        this.craftingContainer.setScrollFactor(0,0);

        let cBox = this.game.make.graphics();

        cBox.fillStyle(0x00dd00, 0.5);
        cBox.fillRect(0, 0, 100, 332);

        this.craftingContainer.add(cBox);
        this.craftingContainer.add(this.game.add.text(0, 0, 'Crafting', {align: 'center'}));
        let craftBoxes = this.updateCrafting([]);
        this.craftBoxes = craftBoxes;
        this.craftingContainer.add(craftBoxes);


        this.buildingText = this.game.add.text(380, 400, 'Building', {align: 'center'});
        this.buildingText.setScrollFactor(0,0);
        
        /*this.game.input.on('gameobjectdown', function (pointer, gameObject) {
            console.log("afaf", pointer, gameObject);
        }, this);
        this.game.input.on('gameobjectover', function (pointer, gameObject) {

            gameObject.setTint(0x7878ff);
    
        });*/
    
    }
    updateInventory(inv) {
        /* Updates the item sprites for the inventory display */
        let c = this.game.make.container();
        let itemBoxes = this.game.make.graphics();
        let n = 0;
        let sprites = [];
        let offsetY = 16;
        for(let i = 0; i < 10; i++) {
            //itemBoxes.fillStyle(0x0000bb, 0.5);
            //itemBoxes.fillRect(0, offsetY + i*16, 16, 16);
            if(inv[i]) {
                let lineC = this.game.add.container(0, 16);
                let line = this.game.add.graphics();
                line.fillStyle((i%2===0) ? 0xcccccc : 0xdddddd);
                line.fillRect(0, offsetY + i*16, 100, 16);
                lineC.add(line);

                let s = this.game.add.sprite(0, offsetY + i*16, 'tiles', inv[i].tile);
                s.setScale(0.5, 0.5);
                s.setOrigin(0,0);
                lineC.add(s);
                let t = this.game.add.text(16, offsetY + i*16, inv[i].name, {align: 'center', color: '#000', 'font': '16px'});
                t.width = 100;
                t.height = 16;
                line.setInteractive(new Phaser.Geom.Rectangle(0, offsetY +2 + i*16, 100, 16), Phaser.Geom.Rectangle.Contains);
                line.setScrollFactor(0,0);
                line.on('pointerover', p => {
                    console.log("ptr mov");
                    t.setColor('#ff0000');
                })
                line.on('pointerout', p => {
                    console.log("ptr up");
                    t.setColor('#000');
                })
                line.on('pointerdown', p => {
                    console.log("ptr down");
                })
                lineC.add(t);
                sprites.push(lineC);
            }
        }
        itemBoxes.generateTexture('itemBoxes', 16, 16*10);
        c.add(itemBoxes);
        c.add(sprites);
        c.bringToTop(sprites);
        return c;
    }
    updateCrafting(inv) {
        if(!inv.length) {
            return this.game.make.container();
        }
        /* Updates the item sprites for the crafting display */
        let c = this.game.make.container();
        let itemBoxes = this.game.make.graphics();
        let n = 0;
        let sprites = [];
        let offsetY = 16;
        let comps = [];
        let r = CraftingRecipes.map(cr => {
            /*let comps = CraftingRecipes[0].components.reduce(
                function(accumulator, currentValue) {
                  return accumulator.concat(currentValue);
                },
                []
            );*/
            let comps = cr.components;
            return cr;
            if(comps.length === comps.filter(c => inv.has(c[0], c[1])).length) {
                return cr;
            }
            
        });
        console.log(r, comps);
        for(let i = 0; i < 10; i++) {
            if(r[i]) {
                let recipe = r[i];

                let lineC = this.game.add.container(0, 16);
                let line = this.game.add.graphics();
                line.fillStyle((i%2===0) ? 0xcccccc : 0xdddddd);
                line.fillRect(0, offsetY + i*16, 100, 16);
                lineC.add(line);
        
                let s = this.game.add.sprite(0, offsetY + i*16, 'tiles', ItemResolver(recipe.post_terrain).fg);
                s.setScale(0.5, 0.5);
                s.setOrigin(0,0);
                lineC.add(s);
                let t = this.game.add.text(16, offsetY + i*16, recipe.description, {align: 'center', 'font': '16px'});
                lineC.add(t);
                line.setInteractive(new Phaser.Geom.Rectangle(0, offsetY +2 + i*16, 100, 16), Phaser.Geom.Rectangle.Contains);
                line.setScrollFactor(0,0);
                line.on('pointerover', p => {
                    
                    t.setColor('#ff0000');
                })
                line.on('pointerout', p => {
                    
                    t.setColor('#000');
                })
                line.on('pointerdown', p => {
                    
                    this.actionEmitter.emit('build', {
                        recipe: recipe
                    });
                });

                sprites.push(lineC);
            }
        }

        itemBoxes.generateTexture('craftBoxes', 16, 16*10);
        c.add(itemBoxes);
        c.add(sprites);
        return c;
    }
    update(data) {
        if(data.player) {
            this.hpText.setText('HP: '+data.player.hp);
        }
        if(this.uiState.inventoryOpen || this.uiState.craftingOpen) {
            if(this.uiState.inventoryCache !== data.player.inventory.inventory) {
                this.uiState.inventoryCache = data.player.inventory.inventory;
                let itemBoxes = this.updateInventory(data.player.inventory.toArray());
                this.inventoryContainer.remove(this.itemBoxes);
                this.itemBoxes.destroy();
                this.inventoryContainer.add(itemBoxes);
                this.itemBoxes = itemBoxes;

                let craftBoxes = this.updateCrafting(data.player.inventory);
                this.craftingContainer.remove(this.craftBoxes);
                this.craftBoxes.destroy();
                this.craftingContainer.add(craftBoxes);
                this.craftBoxes = craftBoxes;
            }
            
        }
        if(this.uiState.inventoryOpen) {
            this.inventoryContainer.visible = true;
        } else {
            this.inventoryContainer.visible = false;
        }
        
        if(this.uiState.craftingOpen) {
            this.buildingText.visible = true;
            this.craftingContainer.visible = true;
            if(this.uiState.building) {
                this.buildingText.setText('Building... '+this.uiState.building.post_terrain);
            }
        } else {
            this.buildingText.visible = false;
            this.buildingText.setText('Building');
            this.craftingContainer.visible = false;
        }
    }
    setState(args) {
        this.uiState = {...this.uiState, ...args};
    }
}

export default new UI();