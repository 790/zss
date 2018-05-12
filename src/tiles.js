import RawTerrainData from '../data/json/terrain.json';
const TerrainData = {};

RawTerrainData.forEach(t => {
    if(t.id instanceof Array) {
        t.id.forEach(id => {
            TerrainData[id] = t;
        })
    } else {
        TerrainData[t.id] = t
    }
});

import RawFurnitureData from '../data/json/furniture.json';
const FurnitureData = {};

RawFurnitureData.forEach(t => {
    if(t.id instanceof Array) {
        t.id.forEach(id => {
            FurnitureData[id] = t;
        })
    } else {
        FurnitureData[t.id] = t
    }
});

export {FurnitureData, TerrainData};