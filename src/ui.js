import Phaser from 'phaser';

import {CraftingRecipes} from './crafting';
import {ItemResolver} from './entity/item';

class UI {
    constructor(args) {
        this.uiState = {
            inventoryOpen: false,
            inventoryCache: null,
            debug: true
        }
        this.actionEmitter = new Phaser.EventEmitter();
    }
    create(args) {
        
        this.game = args.game;
        let uiContainer = this.game.add.container();
        this.layers = args.layers;
        this.hpText = this.game.add.text(10, 10, 'HP: 0', { font: "20px Arial", fill: "#ffffff", align: "left" });
        this.hpText.setScrollFactor(0,0);
        uiContainer.add(this.hpText);

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

        uiContainer.add(this.inventoryContainer);
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

        uiContainer.add(this.craftingContainer);
        this.buildingText = this.game.add.text(380, 400, 'Building', {align: 'center'});
        this.buildingText.setScrollFactor(0,0);
        uiContainer.add(this.buildingText);
        
        this.errorText = this.game.add.text(380, 480, 'Error', {align: 'center', fill: '#cc0000'}).setFontStyle('bold').setBackgroundColor('#000000af');
        this.errorText.setScrollFactor(0,0);
        this.errorTextTween = this.game.tweens.add({
            targets: this.errorText,
            alpha: 0,
            delay: 1000
        });
        uiContainer.add(this.errorText);
        /*this.game.input.on('gameobjectdown', function (pointer, gameObject) {
            console.log("afaf", pointer, gameObject);
        }, this);
        this.game.input.on('gameobjectover', function (pointer, gameObject) {

            gameObject.setTint(0x7878ff);

        });*/
        this.debugText = this.game.add.text(0, 0, '', {font: '12px monospace', fill: '#ffffff'}).setBackgroundColor('#000000af');
        this.debugText.setScrollFactor(0,0);
        this.debugText.visible = false;
        uiContainer.add(this.debugText);
        this.dialog = this.game.add.container(200, 200);
        this.dialog.width = 200;
        this.dialog.height = 200;
        this.dialog.fixedToCamera = true;
        this.dialog.setScrollFactor(0,0);
        this.dialog.visible = false;
        uiContainer.add(this.dialog);
        this.uiContainer = uiContainer;
        
    }
    createDialog(text, buttons, opts={}) {
        this.dialog.removeAll(true);
        if(!text || !buttons || !buttons.length) {
            return;
        }
        let width = this.dialog.width;
        let height = 24 + buttons.length * 32 + 24;

        let dialogBackground = this.game.make.graphics().fillStyle(0x0000dd, 0.5).fillRect(0, 0, width, height);
        this.dialog.add(dialogBackground);
        let dialogText = this.game.add.text(0, 0, text);
        this.dialog.add(dialogText);
        let y = 32;
        buttons.map(b => {
            let btn = this.game.make.graphics().fillStyle(0xff0000).fillRect(12, y, this.dialog.width - 24, 24);
            btn.setInteractive(new Phaser.Geom.Rectangle(12, y, this.dialog.width-24, 24), Phaser.Geom.Rectangle.Contains);
            let yScoped = y;
            let btnText = this.game.add.text(16, y, b.label);
            btn.on('pointerover', () => {
                console.log("hello")
                btn.fillStyle(0x44ff44).fillRect(12, yScoped, this.dialog.width - 24, 24);
                btnText.setColor('0x000');
            });
        
            btn.on('pointerout', () => {
                btn.fillStyle(0xff0000).fillRect(12, yScoped, this.dialog.width - 24, 24);
                btnText.setColor('0xfff');
            });

            btn.on('pointerdown', () => {
                if(b.onClick != null) {
                    b.onClick(b.id);
                }
            });
            btn.setScrollFactor(0,0);
            y += 32;
            this.dialog.add([btn,btnText]);
        });
        this.dialog.bringToTop();
        this.dialog.visible = true;
    }
    removeDialog() {
        this.dialog.removeAll(true);
        this.dialog.visible = false;
        this.uiState.dialogOpen = false;
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

                let s = this.game.add.sprite(0, offsetY + i*16, 'tiles', ItemResolver(inv[i].id).fg);
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
            if(!comps) {
                return null;
            }
            const hasComponents = comps.filter(r => {
                return r.filter(component => inv.has(component[0], component[1])).length>0
            }).length==comps.length;

            return hasComponents?cr:null;
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
        if(this.uiState.debug) {
            const worldPoint = this.game.input.activePointer.positionToCamera(this.game.cameras.main);
            const layers = ['background','structure','item'];
            let tiles = {};
            const pointerTileX = data.layers['background'].worldToTileX(worldPoint.x);
            const pointerTileY = data.layers['background'].worldToTileY(worldPoint.y);
            layers.map(i => {
                const map = data.layers[i];
                const pointerTileX = map.worldToTileX(worldPoint.x);
                const pointerTileY = map.worldToTileY(worldPoint.y);

                tiles[i] = map.getTileAt(pointerTileX, pointerTileY);
            })
            if(tiles) {
                this.debugText.setText(pointerTileX+', '+pointerTileY+'\n'+layers.map((l,i) => {
                    let t = tiles[l];
                    if(t) {
                        return l+': '+tiles[l].index+' '+tiles[l].properties.id+' rot: '+Phaser.Math.RadToDeg(tiles[l].rotation);// + '\n'+JSON.stringify(tiles[l].properties, null, 2);
                    } else {
                        return l+': null';
                    }

                }).join('\n'))
                this.debugText.visible = true;
            }
        } else {
            this.debugText.visible = false;
        }
        if(this.uiState.dialogOpen) {
            this.dialog.visible = true;
        } else {
            this.dialog.visible = false;
        }
    }
    setState(args) {
        if(args.errorText) {
            this.errorText.setText(args.errorText);
            this.errorText.setAlpha(1);
            this.errorTextTween.restart();
        }
        this.uiState = {...this.uiState, ...args};
    }
}

export default new UI();
