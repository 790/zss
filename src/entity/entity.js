export class Entity {
    constructor(args) {
        this.x = args.x||0;
        this.y = args.y||0;
        this.z = args.z||0;
        this.name = args.name||'Unknown Entity';
        this.tile = args.tile||0;
    }
}

export class LivingEntity extends Entity {
    constructor(args) {
        super(args);
        this.hp = args.hp||100;
        this.maxHp = args.maxHp||100;
        this.speed = args.speed||1;
        this.inventory = [];
    }
}

export class Item extends Entity {
    constructor(args) {
        super(args);
    }
}