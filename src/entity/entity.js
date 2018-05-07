import Inventory from './inventory';

export class Entity {
    constructor(args) {
        this.id = args.id;
        this.x = args.x||0;
        this.y = args.y||0;
        this.z = args.z||0;
        this.name = args.name||'Unknown Entity';
        this.tile = args.tile||0;
        this.sprite = null;
    }
}

export class LivingEntity extends Entity {
    constructor(args) {
        super(args);
        this.hp = args.hp||100;
        this.maxHp = args.maxHp||100;
        this.speed = args.speed||1;
        this.inventory = new Inventory();

        this.lastTick = 0;
    }
    update(time, delta) {
        this.sprite.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-100, 100));
        this.lastTick = time;
    }
}

