import Phaser from 'phaser';

class UI {
    constructor(args) {

    }
    create(args) {
        this.game = args.game;
        this.hpText = this.game.add.text(10, 10, 'HP: 0', { font: "20px Arial", fill: "#ffffff", align: "left" });
        this.inventoryText = this.game.add.text(10, 40, 'Inventory\n---------');
    }
    update(data) {
        if(data.player) {
            this.hpText.setText('HP: '+data.player.hp);
            this.inventoryText.setText('Inventory\n---------\n'+data.player.inventory.map(i => i.name).join('\n'));
        }
    }
}

export default new UI();