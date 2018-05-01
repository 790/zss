import Phaser from 'phaser';
import { CLIENT_RENEG_LIMIT } from 'tls';

class UI {
    constructor(args) {
        this.uiState = {
            inventoryOpen: false,
            inventoryCache: null
        }
    }
    create(args) {
        this.game = args.game;
        this.hpText = this.game.add.text(10, 10, 'HP: 0', { font: "20px Arial", fill: "#ffffff", align: "left" });
        this.inventoryText = this.game.add.text(10, 40, 'Inventory\n---------');
        this.hpText.setScrollFactor(0,0);
        this.inventoryText.fixedToCamera = true;
        this.inventoryText.setScrollFactor(0,0);


        this.inventoryContainer = this.game.add.container(100, 100);
        this.inventoryContainer.fixedToCamera = true;
        this.inventoryContainer.setScrollFactor(0,0);
        let invBox = this.game.make.graphics();
        
        invBox.fillStyle(0x0000dd, 0.5);
        invBox.fillRect(0, 0, 300, 332);

        let itemBoxes = this.updateInventory([]);
        this.itemBoxes = itemBoxes;
        this.inventoryContainer.add(invBox);
        this.inventoryContainer.add(this.game.add.text(10, 10, 'Inventory'));
        this.inventoryContainer.add(itemBoxes);

        this.buildingText = this.game.add.text(380, 400, 'Building', {align: 'center'});
        this.buildingText.setScrollFactor(0,0);
        

    }
    updateInventory(inv) {
        /* Updates the item sprites for the inventory display */
        let c = this.game.make.container();
        let itemBoxes = this.game.make.graphics();
        let n = 0;
        let sprites = [];
        for(let j = 0; j < 8; j++) {
            for(let i = 0; i < 8; i++) {
                itemBoxes.fillStyle(0x0000bb, 0.5);
                itemBoxes.fillRect(8 + 36*i, 32 + j*36, 32, 32);
                if(inv[n]) {
                    let s = this.game.add.sprite(8 + 36*i, 32 + j*36, 'tiles', inv[n].tile);
                    
                    s.setOrigin(0,0);
                    sprites.push(s);
                }
                n++;
            }
        }
        
        itemBoxes.generateTexture('itemBoxes', 36*8, 400);
        c.add(itemBoxes);
        c.add(sprites);
        return c;
    }
    update(data) {
        if(data.player) {
            this.hpText.setText('HP: '+data.player.hp);
            this.inventoryText.setText('Inventory\n---------\n'+data.player.inventory.map(i => i.name).join('\n'));
        }
        if(this.uiState.inventoryOpen) {
            if(this.uiState.inventoryCache !== data.player.inventory.inventory) {
                this.uiState.inventoryCache = data.player.inventory.inventory;
                let itemBoxes = this.updateInventory(data.player.inventory.toArray());
                this.inventoryContainer.remove(this.itemBoxes);
                this.inventoryContainer.add(itemBoxes);
                this.itemBoxes = itemBoxes;
            }
            this.inventoryContainer.visible = true;
        } else {
            this.inventoryContainer.visible = false;
        }
        if(this.uiState.building) {
            this.buildingText.visible = true;
        } else {
            this.buildingText.visible = false;
        }
    }
    setState(args) {
        this.uiState = {...this.uiState, ...args};
    }
}

export default new UI();