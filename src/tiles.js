import itemData from '../assets/ChestHoleTileset/tile_config.json';
import {randomWeightedChoice} from './utils';

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


import RawTerrainData from '../data/json/terrain.json';
import RawFurnitureData from '../data/json/furniture.json';

const TerrainData = {};
const FurnitureData = {};

RawTerrainData.forEach(t => {
    if(t.id instanceof Array) {
        t.id.forEach(id => {
            TerrainData[id] = t;
        })
    } else {
        TerrainData[t.id] = t
    }
});

RawFurnitureData.forEach(t => {
    if(t.id instanceof Array) {
        t.id.forEach(id => {
            FurnitureData[id] = t;
        })
    } else {
        FurnitureData[t.id] = t
    }
});

function TileResolver(id) {
    let item = {...itemMap[id]};
    /*if(item.fg instanceof Array && item.fg.length) {
        if(typeof item.fg[0] === 'number') {
            item.fg = item.fg[Math.floor(Math.random()*item.fg.length)];
            return item;
        }
        item.fg = parseInt(randomWeightedChoice(item.fg.map(e => {
            if(e.sprite instanceof Array && e.sprite.length) {
               return {...e, id: e.sprite[Math.floor(Math.random()*e.sprite.length)]};
            } else {
                return {...e, id: e.sprite};
            }

        })), 10);
    }*/
    return item;
}
function GetTileRotation(val, num_connects)
{
    let rotation;
    let subtile;
    switch(num_connects) {
        case 0:
            rotation = 0;
            subtile = 'unconnected';
            break;
        case 4:
            rotation = 0;
            subtile = 'center';
            break;
        case 1: // all end pieces
            subtile = 'end_piece';
            switch(val) {
                case 8:
                    rotation = 2;
                    break;
                case 4:
                    rotation = 3;
                    break;
                case 2:
                    rotation = 1;
                    break;
                case 1:
                    rotation = 0;
                    break;
            }
            break;
        case 2:
            switch(val) {
                    // edges
                case 9:
                    subtile = 'edge';
                    rotation = 0;
                    break;
                case 6:
                    subtile = 'edge';
                    rotation = 1;
                    break;
                    // corners
                case 12:
                    subtile = 'corner';
                    rotation = 2;
                    break;
                case 10:
                    subtile = 'corner';
                    rotation = 1;
                    break;
                case 3:
                    subtile = 'corner';
                    rotation = 0;
                    break;
                case 5:
                    subtile = 'corner';
                    rotation = 3;
                    break;
            }
            break;
        case 3: // all t_connections
            subtile = 't_connection';
            switch(val) {
                case 14:
                    rotation = 2;
                    break;
                case 11:
                    rotation = 1;
                    break;
                case 7:
                    rotation = 0;
                    break;
                case 13:
                    rotation = 3;
                    break;
            }
            break;
    }
    return {rotation: rotation, subtile: subtile};
}
export {FurnitureData, TerrainData, TileResolver, GetTileRotation};
