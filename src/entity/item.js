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
            item.fg = item.fg[Math.floor(Math.random()*item.fg.length)];
            return item;
        }
        if(id === 't_wall') console.log("a", item.fg);
        item.fg = parseInt(randomWeightedChoice(item.fg.map(e => { 
            if(e.sprite instanceof Array && e.sprite.length) {
               return {...e, id: e.sprite[Math.floor(Math.random()*e.sprite.length)]};
            } else {
                return {...e, id: e.sprite};
            }
            
        })), 10);
        if(id === 't_wall') console.log("b", item.fg);
    } /*else if (!item.fg && item.bg) {
        item.fg = item.bg;
    }*/
    return item;
}