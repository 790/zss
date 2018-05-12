
class Prefab {
    constructor(args) {
        let basemap = args.basemap||[];
        let direction = args.direction||0;
        let offsetx = args.offsetx||0;
        let offsety = args.offsety||0;
        let mapData = require('./house04.json');

        if (mapData.length!==1)
        {
                console.error("error: json map file need 1 entry. this file provides", mapData.length);
                process.exit(1);
        }
        if (mapData[0].type !== "mapgen")
        {
                console.error("error: json map file is not type mapgen. this file provides", mapData[0].type);
                process.exit(1);
        }
        let     x,y,w,h,
                obj=mapData[0].object;
                w = obj.rows[0].length;
                h = obj.rows.length;

        let     structures = []
        let     newx, newy;

        for(y=0;y<obj.rows.length;y++) {
            for(x=0;x<obj.rows[y].length;x++){
                let tile_char = obj.rows[y][x];
                let tile_name = obj.terrain[tile_char];
                if(tile_name === undefined) {
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
                basemap[newy][newx] = {id: tile_name};
            }
        }
        return {ground: basemap, structure: structures, item: []};
    }
}

export default Prefab;
