export class Entity {
    constructor(args) {
        this.x = args.x||0;
        this.y = args.y||0;
        this.z = args.z||0;
        this.name = args.name||'Unknown Entity';
        this.tile = args.tile||0;
        this.sprite = null;
    }
}

class Inventory {
    constructor(inv=null) {
        this.inventory = inv||[];
        this.inventorySize = 8*8;
    }
    map(f) {
        return this.inventory.map(f);
    }
    list() {
        return this.inventory;
    }
    push(item) {
        let inv = [...this.inventory];
        inv.push(item);
        this.inventory = inv;
    }
    has(item_id) {
        return this.inventory.filter(i => i.id === item_id).length;
    }
    remove(item, n=1) {
        if(n>1) {
            if(this.inventory.filter(i => i.id === item).length<n) {
                return null;
            }
            let ret = [];
            for(let i=0;i<n;i++) {
                let idx = this.inventory.findIndex(i => i.id === item);
                if(idx != null) {
                    ret.push(this.inventory.splice(idx, 1));
                }
            }
            this.inventory = [...this.inventory];
            return ret;
        } else {
            let i = this.inventory.splice(this.inventory.findIndex(i => i.id === item), 1)
            this.inventory = [...this.inventory];
            return i;
        }
        
    }
    canAddToInventory(item) {
        return this.inventory.length < this.inventorySize;
    }
    toArray() {
        return [...this.inventory];
    }
    get length() {
        return this.inventory.length;
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

