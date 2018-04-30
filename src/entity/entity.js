export class Entity {
    constructor(args) {
        this.x = args.x||0;
        this.y = args.y||0;
        this.z = args.z||0;
        this.name = args.name||'Unknown Entity';
        this.tile = args.tile||0;
    }
}

class Inventory {
    constructor(inv=null) {
        this.inventory = inv||[];
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
    }
}

