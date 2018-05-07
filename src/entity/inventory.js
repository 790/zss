export default class Inventory {
    constructor(inv=null) {
        this.inventory = inv||[];
        this.inventorySize = 8*8;
    }
    from(inv) {
        this.inventory = inv;
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
    has(item_id, n=1) {
        return this.inventory.filter(i => i.id === item_id).length>=n;
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