const fs = require('fs');
const glob = require('glob');
const pathToPrefabs = '../data/json/mapgen/';
import {randomWeightedChoice} from '../src/utils';

let mapList = [];

const itemGroups = {};

function loadItemGroups() {
    glob.sync('{../item_groups.json,**/*.json}', {cwd: __dirname +'//'+ '../data/json/itemgroups'}).forEach(filename => {
        console.log("Loading item group: "+filename);
        let itemGroup = JSON.parse(fs.readFileSync(__dirname +'//'+'../data/json/itemgroups/' + filename));
        itemGroup.filter(ig => ig.type === 'item_group' && ig.items).forEach(ig => {
            itemGroups[ig.id] = ig;
        })
    });
}

function getItemFromGroup(id) {
    let ig = itemGroups[id];
    if(ig && ig.items) {
        let filterItems = ig.items.filter(item => item instanceof Array)
                                    .map(item => {
                                        return {id: item[0], weight: item[1]}
                                    });
        return randomWeightedChoice(filterItems);
    }
}
loadItemGroups();

const itemData = {};

function loadItemData() {
    glob.sync('**/*.json', {cwd: __dirname +'//'+ '../data/json/items'}).forEach(filename => {
        console.log("Loading item group: "+filename);
        let items = JSON.parse(fs.readFileSync(__dirname +'//'+'../data/json/items/' + filename));
        items.forEach(ig => {
            itemData[ig.id] = ig;
        })
    });
}
loadItemData();

class Prefab {
    constructor(args) {
        let basemap = args.basemap||[];
        let direction = args.direction||0;
        let offsetx = args.offsetx||0;
        let offsety = args.offsety||0;
        let mapfilename = args.mapfilename||null;
        let mapData = null;
        
        this.loadMapList();

        if(!mapfilename){
            mapfilename = this.getRandomMapName(); //this.getMapDataRandom();
        }
        if(!mapfilename) {
            return;
        }
        mapData = this.getMapDataByName(mapfilename);
        console.log("Attempting to load " + mapfilename);
        let foundPrefab = this.getMapDataPrefab(mapData);
        if(foundPrefab === -1) {
            console.log("fuckknows why foundPrefab is -1");
            process.exit(1);
        }
        let     obj=foundPrefab.object,
                w = obj.rows[0].length,
                h = obj.rows.length,
                structures = [],
                newx, newy, x, y;
                
        if(basemap[0].length < w || basemap.length < h) {
            basemap = new Array(h).fill(0).map(_ => new Array(w).fill(-1));
            basemap = basemap.map(gy => gy.map(t => this.gri(0,9)===0?{id:'t_dirt'}:{id:'t_grass'}));
        }
        console.log(w, h, basemap.length, basemap[0].length);
        for(y=0;y<obj.rows.length;y++) {
            for(x=0;x<obj.rows[y].length;x++){
                let tile_char = obj.rows[y][x];
                let tile_name = (obj.terrain && obj.terrain[tile_char]) || null;
                if(tile_name instanceof Array) {
                    tile_name = tile_name[this.gri(0, tile_name.length-1)];
                }
                if(tile_name == null) {
                        tile_name = obj.fill_ter;
                }
                switch (direction) {
                    case 0:
                        newx = x;
                        newy = y;
                        break;
                    case 90:
                        newx = w-y-1;
                        newy = x;
                        break;
                    case 180:
                        newx = h-x-1;
                        newy = w-y-1;
                        break;
                    case 270:
                        newx = y;
                        newy = h-x-1;
                        break;
                    default:
                        newx = x;
                        newy = y;
                }
                newx+=offsetx;
                newy+=offsety;
                if(obj.furniture && obj.furniture[tile_char]) {
                    structures.push({
                        id: obj.furniture[tile_char], x:newx, y:newy
                    });
                }
                if(tile_name) {
                    basemap[newy][newx] = {id: tile_name};
                }
            }
        }
        let items = [];
        if(obj.place_loot) {
            items = obj.place_loot.filter(item => this.gri(0, 100) < item.chance).map(item => {
                let item_id = getItemFromGroup(item.group);
                if(!item_id) {
                     console.log(item.group, item_id);
                }
                if(!item_id) {
                    return null;
                }
                let x = item.x;
                let y = item.y;
                if(item.x instanceof Array) {
                    x = this.gri(item.x[0], item.x[1]);
                }
                if(item.y instanceof Array) {
                    y = this.gri(item.y[0], item.y[1]);
                }
                return {
                    id: item_id,
                    item: itemData[item_id],
                    x: x,
                    y: y
                }
            }).filter(item => !!item)
            
        }
        return {ground: basemap, width: basemap[0].length, height: basemap.length, structure: structures, item: items};
    }
    gri(min,max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    loadMapList() {
        mapList = glob.sync('**/*.json', {cwd: __dirname +'//'+ pathToPrefabs}); //fs.readdirSync(__dirname +'//'+ pathToPrefabs);
        console.log(pathToPrefabs + '**/*.json', mapList);

    }
    getRandomMapName() {
        return mapList[this.gri(0, mapList.length-1)];
    }
    getMapDataRandom() {
        let randomnumber = this.gri(0, mapList.length-1);
        let mapname = mapList[randomnumber];
        let mapData = JSON.parse(fs.readFileSync(__dirname +'//'+ pathToPrefabs+'//'+mapname));
        let foundPrefab = this.getMapDataPrefab(mapData);
        if (!foundPrefab) {
                console.error("error: json map file is not type mapgen. trying another..");
                mapData = this.getMapDataRandom();
        }
        return mapData;
    }
    getMapDataByName(mapfilename) {
        let mapfile = __dirname +'//'+ pathToPrefabs + '//' + mapfilename;
        let mapData = JSON.parse(fs.readFileSync(mapfile));
        console.log("loading map:", mapfilename, !!mapData);
        let foundPrefab = this.getMapDataPrefab(mapData);
        if (!foundPrefab) {
            console.error("error: json map file is not type mapgen. quitting.");
            process.exit(1);
        }
        return mapData;
    }
    getMapDataPrefab(mapData){
        let prefabs = mapData.map(o => o.mapgen?{...o.mapgen[0], type:'mapgen'}:o).filter(o => o.type === 'mapgen' && o.object != null && !o.nested_mapgen_id);
        return prefabs[this.gri(0, prefabs.length-1)];
    }
}

export default Prefab;
