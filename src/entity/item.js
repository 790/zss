import {Entity} from './entity';

import itemData from '../../assets/ChestHoleTileset/tile_config.json';

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

export function ItemResolver(id) {
    return itemMap[id];
}