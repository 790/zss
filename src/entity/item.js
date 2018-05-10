import {Entity} from './entity';

import itemData from '../../assets/ChestHoleTileset/tile_config.json';
import Inventory from './inventory';
import {randomWeightedChoice} from '../utils';

const itemMap = {};

itemData['tiles-new'][0]['tiles'].forEach(t => {
    if(t.id instanceof Array) {
        t.id.forEach(id => {
            itemMap[id] = t;
        })
    } else {
        itemMap[t.id] = t
    }
});

export class Item extends Entity {
    constructor(args) {
        super(args);

        if(args.id) {
            this.id = args.id;
            let t = itemMap[args.id];
            if(!t) {
                this.tile = 0;
                
            } else {
                this.tile = t.fg;
                this.tile_bg = t.bg||null;
            }
            
        }
    }
}

class ItemProcessor extends Entity {
    constructor(args) {
        super(args);
        this.inputs = [];
        this.outputs = [];
        this.processingTime = 0;
        this.inventory = new Inventory(this.inventorySize);
    }
    activate(entity) {
        let hasComponents = this.inputs.filter(component => {
            return entity.inventory.has(component[0], component[1]);
        }).length>0;
        if(hasComponents) {
            let inputs = [
                [ [ "log", 2 ] ],
                [ [ "stick", 3 ], [ "2x4", 6 ] ]
            ];

            this.inputs.inputs.filter(r => {
                return r.filter(component => entity.inventory.has(component[0], component[1])).length>0
            })
            this.inputs.forEach(component => {
                entity.inventory.remove(component[0], component[1]);
            });
            this.outputs.forEach(o => {
                for(let i = 0; i < o[1]; i++) {
                    entity.inventory.push(o[0]);
                }
            })
        }
    }
}
export function ItemResolver(id) {
    let item = {...itemMap[id]};
    if(item.fg instanceof Array && item.fg.length) {
        if(typeof item.fg[0] === 'number') {
            return { id: item.fg[Math.floor(Math.random()*item.fg.length)] };
        }
        item.fg = randomWeightedChoice(item.fg.map(e => { e.id = e.sprite; return e; }));
    }
    return item;
}