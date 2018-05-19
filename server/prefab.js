const fs = require('fs');
const pathToPrefabs = '../data/json/mapgen/';
class Prefab {
    constructor(args) {
        let basemap = args.basemap||[];
        let direction = args.direction||0;
        let offsetx = args.offsetx||0;
        let offsety = args.offsety||0;
        let mapfilename = args.mapfilename||-1;
        let mapData = null;
        if(mapfilename === -1){
            mapData = this.getMapDataRandom();
        } else {
            mapData = this.getMapDataByName(mapfilename);
        }
        let foundPrefab = this.getMapDataPrefabIndex(mapData);
        if(foundPrefab === -1) {
            console.log("fuckknows why foundPrefab is -1");
            process.exit(1);
        }

        let     obj=mapData[foundPrefab].object,
                w = obj.rows[foundPrefab].length,
                h = obj.rows.length,
                structures = [],
                newx, newy, x, y;

        for(y=0;y<obj.rows.length;y++) {
            for(x=0;x<obj.rows[y].length;x++){
                let tile_char = obj.rows[y][x];
                let tile_name = obj.terrain[tile_char];
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
                if(obj.furniture[tile_char]) {
                    structures.push({
                        id: obj.furniture[tile_char], x:newx, y:newy
                    });
                }
                if(tile_name) {
                    basemap[newy][newx] = {id: tile_name};
                }
            }
        }
        return {ground: basemap, structure: structures, item: []};
    }
    gri(min,max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    getMapDataRandom() {
        let maplist = fs.readdirSync(__dirname +'//'+ pathToPrefabs);
        let randomnumber = this.gri(0, maplist.length-1);
        let mapname = maplist[randomnumber];
        let mapData = require(__dirname +'//'+ pathToPrefabs+'//'+mapname);
        let foundPrefab = this.getMapDataPrefabIndex(mapData);
        if (foundPrefab === -1) {
                console.error("error: json map file is not type mapgen. trying another..");
                mapData = this.getMapDataRandom();
        }
        return mapData;
    }
    getMapDataByName(mapfilename) {
        let mapfile = __dirname +'//'+ pathToPrefabs + '//' + mapfilename;
        let mapData = require(mapfile);
        console.log("loading map:", mapfilename);
        let foundPrefab = this.getMapDataPrefabIndex(mapData);
        if (foundPrefab === -1) {
            console.error("error: json map file is not type mapgen. quitting.");
            process.exit(1);
        }
        return mapData;
    }
    getMapDataPrefabIndex(mapData){
        let foundPrefab = -1;
        mapData.forEach(function(object, index, _) {
            if(object.type == "mapgen") {
                foundPrefab = index;
                return;
            }
        });
        return foundPrefab;
    }
}

export default Prefab;
